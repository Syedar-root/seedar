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
import { tool } from '@langchain/core/tools';
import { createAgent, ReactAgent } from 'langchain';
import z from 'zod';

@Injectable()
export class ChatService {
  private readonly memoryStore: Map<string, Array<HumanMessage | AIMessage>> =
    new Map();

  constructor(private readonly aiService: AiService) {}

  /**
   * 处理对话请求
   * @param aiId AI 实例 ID
   * @param message 用户消息
   * @param stream 是否流式输出
   */
  async chat(
    aiId: string,
    message: string,
    stream?: boolean,
  ): Promise<AiChatResponseDto> {
    const ai = await this.aiService.findOne(aiId);
    const llmConfig = this.getLLMConfig(ai);

    const sessionId = this.getOrCreateSessionId(aiId);
    const timestamp = new Date();

    if (stream) {
      throw new Error('请使用 streamChat 方法进行流式输出');
    }

    return this.nonStreamChat(llmConfig, message, sessionId, timestamp);
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
    agentType: 'deep' | 'normal' = 'normal',
  ): AsyncGenerator<
    { content: string; type?: string; done: boolean },
    void,
    unknown
  > {
    try {
      const ai = await this.aiService.findOne(aiId);
      const llmConfig = this.getLLMConfig(ai);
      // const sessionId = this.getOrCreateSessionId(aiId);

      // const chatHistory = this.memoryStore.get(sessionId) || [];
      const chatHistory: Message[] = [];
      chatHistory.push(new HumanMessage({ content: message }));

      const agent =
        agentType === 'deep'
          ? this.createDeepAgent(llmConfig)
          : this.createNormalAgent(llmConfig);

      const stream = await agent.stream(
        {
          messages: chatHistory,
        },
        {
          streamMode: 'messages',
        },
      );

      let reasoningResponse = '';
      let response = '';
      const reasoningBlocks = [] as any[];
      for await (const chunk of stream) {
        const [token, metadata] = chunk;
        let { content, type } = this.getContentAndTypeWithStreamMessage(token);
        if (content && type) {
          if (type === 'reasoning') {
            reasoningResponse += content;
          } else if (type === 'text') {
            // 需要判断是不是tool_result
            type = token.type === 'tool' ? 'tool_result' : type;
          }
          response += content;
          yield { content, type, done: false };
        }
      }

      chatHistory.push(new AIMessage({ content: response }));
      yield { content: '', done: true };
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(
        `流式对话失败: ${error instanceof Error ? error.message : '未知错误'}`,
      );
    }
  }

  /**
   * 获取非流式对话结果
   * @param llmConfig LLM 配置
   * @param message 用户消息
   * @param sessionId 会话 ID
   * @param timestamp 时间戳
   */
  private async nonStreamChat(
    llmConfig: LLMConfig,
    message: string,
    sessionId: string,
    timestamp: Date,
  ): Promise<AiChatResponseDto> {
    try {
      const llm = this.createLLM(llmConfig);
      const chatHistory = this.memoryStore.get(sessionId) || [];

      chatHistory.push(new HumanMessage({ content: message }));

      const response = await llm.invoke(chatHistory);

      chatHistory.push(new AIMessage({ content: response.content as string }));

      this.memoryStore.set(sessionId, chatHistory.slice(-20));

      return {
        reply: response.content as string,
        sessionId,
        timestamp,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `对话失败: ${error instanceof Error ? error.message : '未知错误'}`,
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

  testPrompt = `请你不要在思考内容或者标签中直接说出任何关于内部工具的信息，使用直白的用户能理解的语言概括这一步骤即可，如“用户需要知道当前地点的天气，我将使用工具为用户查询天气`;

  /**
   * 创建 Deep Agent 实例
   * @param llmConfig LLM 配置
   */
  private createDeepAgent(llmConfig: LLMConfig): DeepAgent {
    const llm = this.createLLM(llmConfig);
    const getCurrentTime = tool(
      async ({}) => {
        return new Date().toLocaleString();
      },
      {
        name: 'get_current_time',
        description: 'Get current time.',
        schema: z.object({}),
      },
    );

    const agent = createDeepAgent({
      model: llm,
      tools: [getCurrentTime],
      systemPrompt: this.testPrompt,
    });

    return agent;
  }

  /**
   * 创建普通 Agent 实例
   * @param llmConfig LLM 配置
   */
  private createNormalAgent(llmConfig: LLMConfig): ReactAgent {
    const llm = this.createLLM(llmConfig);

    const getCurrentTime = tool(
      async ({}) => {
        return new Date().toLocaleString();
      },
      {
        name: 'get_current_time',
        description: '获取当前时间',
        schema: z.object({}),
      },
    );

    const agent = createAgent({
      model: llm,
      tools: [getCurrentTime],
      systemPrompt: this.testPrompt,
    });

    return agent;
  }

  /**
   * 获取或创建会话 ID
   * @param aiId AI 实例 ID
   */
  private getOrCreateSessionId(aiId: string): string {
    return `ai_${aiId}`;
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
