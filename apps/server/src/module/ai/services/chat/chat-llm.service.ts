import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatDeepSeek } from '@langchain/deepseek';
import { ChatOpenAI } from '@langchain/openai';
import type { AiResponse } from '../../dto/ai.response';
import type { LLMConfig } from '../../ai.types';

@Injectable()
export class ChatLlmService {
  /**
   * Parse and validate LLM runtime configuration from AI config.
   */
  getLLMConfig(ai: AiResponse): LLMConfig {
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
   * Instantiate provider-specific LLM client from normalized config.
   */
  createLLM(
    llmConfig: LLMConfig,
    temperature?: number,
    maxTokens?: number,
    extraBody?: Record<string, unknown>,
  ): ChatOpenAI | ChatAnthropic | ChatDeepSeek {
    const config: Record<string, unknown> = {
      temperature: temperature ?? llmConfig.temperature,
      maxTokens: maxTokens ?? llmConfig.maxTokens,
    };

    if (llmConfig.baseUrl) {
      config.configuration = {
        baseURL: llmConfig.baseUrl,
      };
    }

    if (llmConfig.model.includes('deepseek')) {
      extraBody = {
        ...extraBody,
        thinking: {
          type: 'disabled',
        },
      };
    }

    switch (llmConfig.type) {
      case 'deepseek':
        return new ChatDeepSeek(llmConfig.model, {
          apiKey: llmConfig.apiKey,
          modelKwargs: {
            tool_choice: 'auto',
            ...extraBody,
          },
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
          modelKwargs: {
            tool_choice: 'auto',
            ...extraBody,
          },
          ...config,
        });
    }
  }
}

