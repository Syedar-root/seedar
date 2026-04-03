import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AiService } from './ai.service';
import { LLMConfig } from '../ai.types';
import { AiChatResponseDto } from '../dto/ai-chat.response.dto';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, AIMessage } from '@langchain/core/messages';
import { AiResponse } from '../dto/ai.response';

@Injectable()
export class ChatService {
  private readonly memoryStore: Map<string, Array<HumanMessage | AIMessage>> =
    new Map();

  constructor(private readonly aiService: AiService) {}

  /**
   * 处理对话请求
   * @param aiId AI 实例 ID
   * @param message 用户消息
   * @param _stream 是否流式输出（暂未实现）
   */
  async chat(
    aiId: string,
    message: string,
    _stream?: boolean,
  ): Promise<AiChatResponseDto> {
    const ai = await this.aiService.findOne(aiId);
    const llmConfig = this.getLLMConfig(ai);

    const sessionId = this.getOrCreateSessionId(aiId);
    const timestamp = new Date();

    return this.nonStreamChat(llmConfig, message, sessionId, timestamp);
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

    if (!model) {
      throw new InternalServerErrorException('LLM 配置中缺少 model');
    }

    return {
      type: (llmConfig.type as LLMConfig['type']) || 'openai',
      apiKey,
      baseUrl: llmConfig.baseUrl as string | undefined,
      model,
      temperature: (llmConfig.temperature as number) ?? 0.7,
      maxTokens: (llmConfig.maxTokens as number) ?? 2000,
      systemPrompt: llmConfig.systemPrompt as string | undefined,
    };
  }

  /**
   * 创建 LLM 实例
   * @param llmConfig LLM 配置
   */
  private createLLM(llmConfig: LLMConfig): ChatOpenAI {
    const config: Record<string, unknown> = {
      temperature: llmConfig.temperature,
      maxTokens: llmConfig.maxTokens,
    };

    if (llmConfig.baseUrl) {
      config.configuration = {
        baseURL: llmConfig.baseUrl,
      };
    }

    return new ChatOpenAI({
      model: llmConfig.model,
      apiKey: llmConfig.apiKey,
      ...config,
    });
  }

  /**
   * 获取或创建会话 ID
   * @param aiId AI 实例 ID
   */
  private getOrCreateSessionId(aiId: string): string {
    return `ai_${aiId}`;
  }
}
