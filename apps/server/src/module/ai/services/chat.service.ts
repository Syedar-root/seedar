import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AiService } from './ai.service';
import {
  AskQuestion,
  InterruptContent,
  LLMConfig,
  StreamChunk,
  YieldType,
} from '../ai.types';
import { AiChatResponseDto } from '../dto/ai-chat.response.dto';
import { ChatOpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatDeepSeek } from '@langchain/deepseek';
import {
  HumanMessage,
  AIMessage,
  Message,
  BaseMessage,
  ToolMessage,
} from '@langchain/core/messages';
import { AiResponse } from '../dto/ai.response';
import { createDeepAgent, DeepAgent, FilesystemBackend } from 'deepagents';
import {
  createAgent,
  createMiddleware,
  providerStrategy,
  ReactAgent,
  Tool,
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
  Command,
  GraphInterrupt,
} from '@langchain/langgraph';
import * as z from 'zod/v4';
import { AiSessionService } from './ai-session.service';
import { loadSkill } from './helper';
import path from 'path';
import { existsSync } from 'fs';
import { AskQuestionParams } from './toolSchema';
import { randomUUID } from 'crypto';
import { LoggerService } from '@/logger/logger.service';

@Injectable()
export class ChatService {
  private readonly SYSTEM_PROMPT = `
你的名字是Seedar，你是一个智能助手，你的任务是帮助用户完成任务。
你需要严格遵循下面的规则：
1. 请你不要在思考内容或者标签中直接说出任何关于内部工具的信息，使用直白的用户能理解的语言概括这一步骤即可，如"用户需要知道当前地点的天气，我将使用工具为用户查询天气"
2. 当你在问题澄清、需求获取、步骤确认等场景下，请你使用提问工具向用户提出问题。
   - 你需要根据具体的问题，来决定使用的问题类型。
   - 如果你认为答案是有限的，你可以给用户提供选择。
   - 如果你认为答案是无限的，你可以直接向用户提问。
   - 如果你已经有了答案，那你必须先向用户确认。
  `;

  private readonly DEMAND_TOOL_MAP = {
    'data-query': ['getDataAtTemp', 'getDatasetInfo'],
    'chart-recommend': ['askQuestion', 'getCurrentTime'],
    'convert-to-backend': [],
  };

  constructor(
    private readonly aiService: AiService,
    private readonly toolService: ToolService,
    private readonly aiSessionService: AiSessionService,
    private readonly logger: LoggerService,
  ) {}

  private readonly State = new StateSchema({
    messages: MessagesValue,
    allowTools: new ReducedValue(z.array(z.string()).default([]), {
      reducer: (current, newStep) => newStep,
    }),
    allowSkills: new ReducedValue(z.array(z.string()).default([]), {
      reducer: (current, newStep) => newStep,
    }),
    isClarify: z.boolean().default(false),
  });

  private readonly checkpointer = new MemorySaver();

  private createCatchToolExceptionMiddleware() {
    return createMiddleware({
      name: 'catchToolException',
      wrapToolCall: (request, handler) => {
        try {
          return handler(request);
        } catch (error) {
          this.logger.error(error);
          return Promise.resolve(
            new ToolMessage({
              content: `工具调用失败：${error instanceof Error ? error.message : error?.toString()}`,
              tool_call_id: request.toolCall.id || '',
            }),
          );
        }
      },
    });
  }

  /**
   * 创建对话图
   * @param aiId AI 实例 ID
   * @returns 编译后的状态图
   */
  private async createGraph(aiId: string) {
    const ai = await this.aiService.findOne(aiId);
    const llmConfig = this.getLLMConfig(ai);

    const graphBuilder = new StateGraph(this.State);

    graphBuilder
      .addNode('clarify', this.createClarifyNode(llmConfig))
      .addNode('act', this.createActNode(llmConfig))
      .addEdge(START, 'clarify')
      .addEdge('clarify', 'act')
      .addEdge('act', END);

    return graphBuilder.compile({
      checkpointer: this.checkpointer,
    });
  }

  // private createTestNode() {
  //   return async (state) => {
  //     const tools = this.toolService.getTools();
  //     const askQuestionTool = tools.find((tool) => tool.name === 'askQuestion');

  //     const result = await askQuestionTool?.invoke({
  //       questions: [{ type: 'text', question: '你好' }],
  //     });
  //     return result;
  //   };
  // }

  /**
   * 创建澄清节点
   * 负责理解用户需求，确定需要使用的工具和技能
   *
   * Agent 特点：
   * - 使用固定的工具集：askQuestion, getCurrentTime
   * - 使用结构化响应格式，返回用户需求、允许的工具和技能
   *
   * @param llmConfig LLM 配置
   * @returns Graph 节点
   */
  private createClarifyNode(
    llmConfig: LLMConfig,
  ): GraphNode<typeof this.State> {
    return async (state) => {
      const lastHumanMsg = state.messages
        .filter((msg) => msg instanceof HumanMessage)
        .at(-1);

      let maybeUserDemands: string[] = [];
      const content = (lastHumanMsg?.content as string) || '';
      const lowerContent = content.toLowerCase();

      const keywordMap: Record<string, string[]> = {
        'data-query': [
          '数据',
          '查询',
          '温度',
          '信息',
          'data',
          'query',
          'temperature',
          'info',
        ],
        'chart-recommend': [
          '图表',
          '画图',
          '推荐',
          'chart',
          'recommend',
          '图形',
        ],
      };

      for (const [demand, keywords] of Object.entries(keywordMap)) {
        if (keywords.some((keyword) => lowerContent.includes(keyword))) {
          maybeUserDemands.push(demand);
        }
      }

      if (!maybeUserDemands.length) {
        maybeUserDemands.push('convert-to-backend');
      }

      // 步骤4: 返回更新后的状态
      return {
        allowTools: Array.from(
          new Set([
            ...state.allowTools,
            ...maybeUserDemands
              .map((demand) => this.DEMAND_TOOL_MAP[demand] || [])
              .flat(),
          ]),
        ),
        allowSkills: Array.from(
          new Set([...state.allowSkills, ...maybeUserDemands]),
        ),
      };
    };
  }

  /**
   * 创建执行节点
   * 负责使用工具和技能执行具体任务
   *
   * Agent 特点：
   * - 根据允许的工具列表动态过滤工具
   * - 使用自由响应格式，不限制输出结构
   *
   * @param llmConfig LLM 配置
   * @returns Graph 节点
   */
  private createActNode(llmConfig: LLMConfig): GraphNode<typeof this.State> {
    return async (state) => {
      // 步骤1: 创建 Deep Agent
      const llm = this.createLLM(llmConfig);
      const essentialTools = [
        'askQuestion',
        'getCurrentTime',
        'toolMarket',
        'toolMarketExecutor',
      ];
      state.allowTools = state.allowTools || [];
      essentialTools.forEach((tool) => {
        if (!state.allowTools!.includes(tool)) {
          state.allowTools!.push(tool);
        }
      });

      let tools: Tool[] = [];
      if (state.allowSkills?.includes('convert-to-backend')) {
        tools = this.toolService.getTools(essentialTools);
      } else {
        tools = this.toolService
          .getTools()
          .filter((tool) => state.allowTools?.includes(tool.name));
      }

      const prompt = await loadSkill('act');
      const promptTemplate = PromptTemplate.fromTemplate(prompt);
      const systemPrompt = await promptTemplate.format({
        recommendSkills:
          state.allowSkills
            ?.filter((skill) => skill !== 'convert-to-backend')
            .join(', ') || '',
      });

      // 1. 技能根目录（NestJS 源码目录：src/skills）
      const SKILLS_ROOT = path.join(__dirname, '.');
      // 2. 校验目录是否存在
      if (!existsSync(SKILLS_ROOT)) {
        throw new InternalServerErrorException(
          `技能目录不存在：${SKILLS_ROOT}`,
        );
      }
      console.log('hcs SKILLS_ROOT', SKILLS_ROOT); //hcs SKILLS_ROOT D:\Program\projects\seedar\apps\server\dist\module\ai\services

      // 3. 创建文件系统后端（允许读取本地技能文件）
      const backend = new FilesystemBackend({
        rootDir: SKILLS_ROOT, // 技能根目录
        virtualMode: true,
      });

      const agent = createDeepAgent({
        model: llm,
        tools,
        systemPrompt,
        name: 'act',
        backend,
        middleware: [this.createCatchToolExceptionMiddleware()],
        skills: ['/skills/'],
      });

      // 步骤2: 执行 Agent
      const response = await agent.invoke({ messages: state.messages });

      // 步骤3: 返回更新后的消息
      return { messages: response.messages };
    };
  }

  private readonly BLACKLIST_TOOL_NAMES: RegExp[] = [/askQuestion/, /extract/];

  /**
   * 处理流式对话请求
   * @param aiId AI 实例 ID
   * @param message 用户消息
   * @param sessionId 会话 ID
   * @yields 流式响应数据
   */
  async *streamChat(
    aiId: string,
    message: string,
    sessionId: string,
    isResume: boolean = false,
  ): AsyncGenerator<StreamChunk<AskQuestion>, void, unknown> {
    try {
      // 步骤1: 获取会话信息
      const session = await this.aiSessionService.findOne(sessionId);

      // 步骤2: 创建对话图
      const agent = await this.createGraph(aiId);

      // 步骤3: 启动流式对话
      const stream = await agent.stream(
        !isResume
          ? {
              messages: [new HumanMessage({ content: message })],
            }
          : new Command({ resume: { message } }),
        {
          streamMode: ['messages', 'values'],
          configurable: {
            thread_id: session.id,
          },
        },
      );

      const tool_call: any[] = [];
      const blacklistToolCallIds: string[] = [];

      let currentSid = '';
      let lastType: YieldType | undefined;

      // 步骤4: 处理流式响应
      for await (const [streamMode, chunk] of stream) {
        // 处理 values 模式的中断信息
        // TODO: 这样是有风险的
        if (streamMode === 'values') {
          const interruptData = this.extractInterrupt(chunk);
          if (interruptData && interruptData?.[0]?.value) {
            currentSid = randomUUID();
            lastType = 'interrupt';
            yield {
              sid: currentSid,
              content: interruptData[0] as InterruptContent<AskQuestionParams>,
              type: 'interrupt',
              done: false,
            };
          }
          continue;
        }

        // 处理 messages 模式的消息内容
        const token = chunk[0];
        const metadata = chunk[1];
        const { content, type } =
          this.getContentAndTypeWithStreamMessage(token);

        if (
          type === 'tool_call' &&
          this.BLACKLIST_TOOL_NAMES.some((name) =>
            name.test(token.contentBlocks[0].name as string),
          )
        ) {
          console.log(
            'hcs blacklist tool_call',
            token.contentBlocks[0].name as string,
          );
          blacklistToolCallIds.push(token.contentBlocks[0].id as string);
          continue;
        }

        if (type === 'tool_call') {
          tool_call.push(token.contentBlocks);
        }

        if (content && type) {
          // 判断是否为工具调用结果
          const messageType = token.type === 'tool' ? 'tool_result' : type;
          if (
            messageType === 'tool_result' &&
            blacklistToolCallIds.includes(
              (token as ToolMessage).tool_call_id as string,
            )
          ) {
            continue;
          }

          // 类型变化时生成新的 sid
          if (type !== lastType) {
            currentSid = randomUUID();
            lastType = type as YieldType;
          }

          const meta = {
            tool_call:
              type === 'tool_call'
                ? {
                    id: token.contentBlocks[0].id as string,
                    name: token.contentBlocks[0].name as string,
                  }
                : undefined,
            tool_result:
              messageType === 'tool_result'
                ? { tool_call_id: (token as ToolMessage).tool_call_id }
                : undefined,
            role: metadata.lc_agent_name,
          };

          yield {
            sid: currentSid,
            content,
            type: messageType as YieldType,
            done: false,
            role: metadata.lc_agent_name,
            meta,
          };
        }
      }

      // 步骤5: 返回完成标记
      console.log('hcs tool_call', JSON.stringify(tool_call, null, 2));
      yield { sid: currentSid, content: '', done: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.error('streamChat error:', errorMessage, error, '\n');
      console.log('error type:', typeof error, '\n');
      yield {
        sid: randomUUID(),
        content: errorMessage,
        type: 'error',
        done: true,
        role: '',
      };
      throw new InternalServerErrorException(`流式对话失败: ${errorMessage}`);
    }
  }

  /**
   * 从流数据中提取中断信息
   * @param chunk 流数据块
   * @returns 中断信息或 null
   */
  private extractInterrupt(chunk: unknown): any | null {
    if (
      typeof chunk === 'object' &&
      chunk !== null &&
      '__interrupt__' in chunk
    ) {
      return (chunk as { __interrupt__: any }).__interrupt__;
    }
    return null;
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

  private getContentAndTypeWithStreamMessage(token: BaseMessage): {
    content: string;
    type?: string;
  } {
    const contentBlock = token.contentBlocks[0];
    switch (contentBlock?.type) {
      case 'text':
        return {
          content: contentBlock.text,
          type: 'text',
        };
      case 'tool_call':
        return {
          content: contentBlock.name,
          type: 'tool_call',
        };
      case 'reasoning':
        return {
          content: contentBlock.reasoning,
          type: 'reasoning',
        };
      default:
        return {
          content:
            (contentBlock?.[contentBlock?.type || 'text'] as string) || '',
          type: contentBlock?.type || 'text',
        };
    }
  }
}
