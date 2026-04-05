import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AiService } from './ai.service';
import { LLMConfig } from '../ai.types';
import { AiChatResponseDto } from '../dto/ai-chat.response.dto';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatDeepSeek } from '@langchain/deepseek';
import {
  HumanMessage,
  AIMessage,
  Message,
  BaseMessage,
} from '@langchain/core/messages';
import { AiResponse } from '../dto/ai.response';
import { createDeepAgent, DeepAgent } from 'deepagents';
import {
  createAgent,
  providerStrategy,
  ReactAgent,
  toolStrategy,
} from 'langchain';
import { PromptTemplate } from '@langchain/core/prompts';
import { ToolService } from './tool.service';
import {
  StateSchema,
  MessagesValue,
  ReducedValue,
  GraphNode,
  StateGraph,
  START,
  END,
  MemorySaver,
} from '@langchain/langgraph';
import * as z from 'zod/v4';
import { AiSessionService } from './ai-session.service';
import { loadSkill } from './helper';

@Injectable()
export class ChatService {
  private readonly memoryStore: Map<string, Array<HumanMessage | AIMessage>> =
    new Map();

  private readonly testPrompt = `
  你的名字是Seedar，你是一个智能助手，你的任务是帮助用户完成任务。
  你需要严格遵循下面的规则：
  1. 请你不要在思考内容或者标签中直接说出任何关于内部工具的信息，使用直白的用户能理解的语言概括这一步骤即可，如“用户需要知道当前地点的天气，我将使用工具为用户查询天气"
  2. 当你在问题澄清、需求获取、步骤确认等场景下，请你使用提问工具向用户提出问题。
      - 你需要根据具体的问题，来决定使用的问题类型。
      - 如果你认为答案是有限的，你可以给用户提供选择。
      - 如果你认为答案是无限的，你可以直接向用户提问。
      - 如果你已经有了答案，那你必须先向用户确认。
  `;

  constructor(
    private readonly aiService: AiService,
    private readonly toolService: ToolService,
    private readonly aiSessionService: AiSessionService,
  ) {}

  private readonly State = new StateSchema({
    messages: MessagesValue,
    allowTools: new ReducedValue(z.array(z.string()).default([]), {
      reducer: (current, newStep) => newStep,
    }),
    allowSkills: new ReducedValue(z.array(z.string()).default([]), {
      reducer: (current, newStep) => newStep,
    }),
  });

  private readonly checkpointer = new MemorySaver();

  private readonly skills = ['数据查询', '图表推荐'];

  private async createGraph(aiId: string) {
    const ai = await this.aiService.findOne(aiId);
    const llmConfig = this.getLLMConfig(ai);
    const clarifyNode: GraphNode<typeof this.State> = async (state) => {
      const messages = state.messages;
      const prompt = await loadSkill('front-agent');
      const promptTemplate = PromptTemplate.fromTemplate(prompt);
      llmConfig.systemPrompt = await promptTemplate.format({
        demands: '数据查询、图表推荐',
        tools: this.toolService.getToolNames().join(', '),
        skills: this.skills.join(', '),
      });
      console.log('hcs llmConfig.systemPrompt', llmConfig.systemPrompt);
      const frontAgent = this.createNormalAgent(llmConfig, 'clarify');
      const response = await frontAgent.invoke({
        messages,
      });
      return {
        messages: response.messages,
        allowTools: [
          ...state.allowTools,
          ...response.structuredResponse.allowTools!,
        ],
        allowSkills: [
          ...state.allowSkills,
          ...response.structuredResponse.allowSkills!,
        ],
      };
    };

    const actNode: GraphNode<typeof this.State> = async (state) => {
      const messages = state.messages;
      const deepAgent = this.createDeepAgent(
        llmConfig,
        state.allowTools,
        state.allowSkills,
        'act',
      );
      const response = await deepAgent.invoke({
        messages,
      });
      return { messages: response.messages };
    };

    const graphBuilder = new StateGraph(this.State);
    graphBuilder
      .addNode('clarify', clarifyNode)
      .addNode('act', actNode)
      .addEdge(START, 'clarify')
      .addEdge('clarify', 'act')
      .addEdge('act', END);
    return graphBuilder.compile({
      checkpointer: this.checkpointer,
    });
  }

  /**
   * 处理流式对话请求
   * @param aiId AI 实例 ID
   * @param message 用户消息
   * @param agentType agent 类型 ('deep' | 'normal')，默认为 'deep'
   */
  async *streamChat(
    aiId: string,
    message: string,
    sessionId: string,
  ): AsyncGenerator<
    { content: string; type?: string; done: boolean; role?: string },
    void,
    unknown
  > {
    try {
      const session = await this.aiSessionService.findOne(sessionId);
      const agent = await this.createGraph(aiId);
      const stream = await agent.stream(
        {
          messages: [new HumanMessage({ content: message })],
        },
        {
          streamMode: ['messages', 'values'],
          configurable: {
            thread_id: session.id,
          },
        },
      );
      for await (const [streamMode, chunk] of stream) {
        if (streamMode === 'values') {
          if ((chunk as any)?.__interrupt__) {
            const interrupt = (chunk as any).__interrupt__;
            yield { content: interrupt, type: 'interrupt', done: false };
          }
          continue;
        }
        const token = chunk[0];
        const metadata = chunk[1];
        let { content, type } = this.getContentAndTypeWithStreamMessage(token);
        if (content && type) {
          if (type === 'text') {
            // 需要判断是不是tool_result
            type = token.type === 'tool' ? 'tool_result' : type;
          }
          yield { content, type, done: false, role: metadata.lc_agent_name };
        }
      }
      yield { content: '', done: true };
    } catch (error) {
      console.error('hcs streamChat error', error);
      throw new InternalServerErrorException(
        `流式对话失败: ${error instanceof Error ? error.message : '未知错误'}`,
      );
    }
  }

  /**
   * 从 AI 配置中解析 LLM 配置
   * @param ai AI 实体
   */
  private getLLMConfig(ai: AiResponse): LLMConfig {
    const config = ai.config as Record<string, unknown> | undefined;
    const llmConfig = config?.llm as Record<string, unknown> | undefined;
    if (!llmConfig) {
      throw new InternalServerErrorException('AI 配置中缺少 llm 配置');
    }

    const apiKey = llmConfig.apiKey as string | undefined;
    const model = llmConfig.model as string | undefined;

    if (!apiKey) {
      throw new InternalServerErrorException('LLM 配置中缺少 apiKey');
    }

    if (!model && !ai.name) {
      throw new InternalServerErrorException('LLM 配置中缺少 model 或 name');
    }

    return {
      type: (llmConfig.type as LLMConfig['type']) || 'openai',
      apiKey,
      baseUrl: llmConfig.baseUrl as string | undefined,
      model: model || ai.name,
      temperature: (llmConfig.temperature as number) ?? 0.7,
      maxTokens: (llmConfig.maxTokens as number) ?? 2000,
      systemPrompt: llmConfig.systemPrompt as string | undefined,
    };
  }

  /**
   * 创建 LLM 实例
   * @param llmConfig LLM 配置
   */
  private createLLM(
    llmConfig: LLMConfig,
  ): ChatOpenAI | ChatAnthropic | ChatDeepSeek {
    const config: Record<string, unknown> = {
      temperature: llmConfig.temperature,
      maxTokens: llmConfig.maxTokens,
    };

    if (llmConfig.baseUrl) {
      config.configuration = {
        baseURL: llmConfig.baseUrl,
      };
    }

    switch (llmConfig.type) {
      case 'deepseek':
        return new ChatDeepSeek(llmConfig.model, {
          apiKey: llmConfig.apiKey,
          ...config,
        });
      case 'anthropic':
        return new ChatAnthropic(llmConfig.model, {
          apiKey: llmConfig.apiKey,
          clientOptions: {
            baseURL: llmConfig.baseUrl,
          },
          ...config,
        });
      case 'openai':
      default:
        return new ChatOpenAI(llmConfig.model, {
          apiKey: llmConfig.apiKey,
          ...config,
        });
    }
  }

  /**
   * 创建 Deep Agent 实例
   * @param llmConfig LLM 配置
   */
  private createDeepAgent(
    llmConfig: LLMConfig,
    allowTools?: string[],
    allowSkills?: string[],
    name?: string,
  ): DeepAgent {
    const llm = this.createLLM(llmConfig);
    const tools = this.toolService
      .getTools()
      .filter((tool) => allowTools?.includes(tool.name));

    const agent = createDeepAgent({
      model: llm,
      tools: tools,
      systemPrompt: this.testPrompt,
      name,
    });

    return agent;
  }

  /**
   * 创建普通 Agent 实例
   * @param llmConfig LLM 配置
   */
  private createNormalAgent(llmConfig: LLMConfig, name?: string): ReactAgent {
    const llm = this.createLLM(llmConfig);
    const tools = this.toolService.getTools(['askQuestion', 'getCurrentTime']);

    const agent = createAgent({
      model: llm,
      tools: tools,
      systemPrompt: this.testPrompt,
      name,
      responseFormat: toolStrategy(
        z.object({
          userDemand: z.string().describe('用户需求'),
          allowTools: z
            .array(z.enum(this.toolService.getToolNames()))
            .describe('允许的工具'),
          allowSkills: z.array(z.enum(this.skills)).describe('允许的技能'),
        }),
        {
          toolMessageContent: '',
        },
      ),
    });

    return agent;
  }

  private getContentAndTypeWithStreamMessage(token: BaseMessage): {
    content: string;
    type?: string;
  } {
    const contentBlock = token.contentBlocks[0];
    return {
      content: (contentBlock?.[contentBlock?.type || 'text'] as string) || '',
      type: contentBlock?.type || 'text',
    };
  }
}
