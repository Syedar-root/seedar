import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { HumanMessage } from '@langchain/core/messages';
import { PromptTemplate } from '@langchain/core/prompts';
import { createAgent, toolStrategy } from 'langchain';
import * as z from 'zod/v4';
import { LoggerService } from '@/logger/logger.service';
import { AiService } from '../ai.service';
import { ChatCheckpointService } from './chat-checkpoint.service';
import { ChatGraphService } from './chat-graph.service';
import { ChatLlmService } from './chat-llm.service';
import { ChatPromptService } from './chat-prompt.service';
import {
  GenerateFieldBusinessNameRequestDto,
  GenerateFieldBusinessNameResponseDto,
} from '../../dto';
import { AiStatus } from '../../enums';
import type {
  AiChatMode,
  AiChatResumeDto,
  AiChatScene,
  AiStreamOutputChunk,
} from '../../ai.types';
import { AiSessionService } from '../ai-session.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly aiService: AiService,
    private readonly aiSessionService: AiSessionService,
    private readonly chatGraphService: ChatGraphService,
    private readonly chatCheckpointService: ChatCheckpointService,
    private readonly chatLlmService: ChatLlmService,
    private readonly chatPromptService: ChatPromptService,
    private readonly logger: LoggerService,
  ) {}

  /**
   * 对外统一的流式聊天入口：参数校验后转交给 ChatGraphService 执行完整对话图流程。
   */
  streamChat(
    aiId: string,
    message: string | undefined,
    sessionId: string,
    mode: AiChatMode = 'chat',
    scenes?: AiChatScene[],
    isResume: boolean = false,
    resumePayload?: AiChatResumeDto,
    signal?: AbortSignal,
  ): AsyncGenerator<AiStreamOutputChunk, void, unknown> {
    return this.chatGraphService.streamChat(
      aiId,
      message,
      sessionId,
      mode,
      scenes,
      isResume,
      resumePayload,
      signal,
    );
  }

  /**
   * 按 thread_id 查询 checkpoint 快照，供历史消息回填/兜底恢复使用。
   */
  async getCheckpointTupleByThreadId(threadId: string): Promise<
    | {
        checkpoint?: {
          channel_values?: Record<string, unknown>;
        };
      }
    | undefined
  > {
    return this.chatCheckpointService.getCheckpointTupleByThreadId(threadId);
  }

  /**
   * 为数据集字段批量生成业务名称：用结构化输出约束模型返回，再按输入顺序补齐结果。
   */
  async generateFieldBusinessName(
    request: GenerateFieldBusinessNameRequestDto,
  ): Promise<GenerateFieldBusinessNameResponseDto> {
    if (request.fields.length === 0) {
      return { items: [] };
    }

    const ai = await this.aiService.findOne(request.aiId);
    if (ai.status !== AiStatus.ACTIVE) {
      throw new BadRequestException('当前模型不可用，请先启用可用模型');
    }

    const llm = this.chatLlmService.createLLM(
      this.chatLlmService.getLLMConfig(ai),
      0.3,
      undefined,
      {
        thinking: {
          type: 'disabled',
        },
      },
    );

    const responseSchema = z.object({
      items: z.array(
        z.object({
          fieldId: z.string(),
          businessName: z.string().min(1),
        }),
      ),
    });

    const promptTemplate = PromptTemplate.fromTemplate(
      await this.chatPromptService.loadFieldBusinessNamePrompt(),
    );
    const prompt = await promptTemplate.format({
      requestPayload: JSON.stringify(request, null, 2),
    });

    const agent = createAgent({
      model: llm,
      tools: [],
      responseFormat: toolStrategy(responseSchema),
      systemPrompt: prompt,
    });

    const result = await agent.invoke({
      messages: [new HumanMessage('请为这些字段生成业务名称。')],
    });

    const structuredResponse = result.structuredResponse as
      | { items: Array<{ fieldId: string; businessName: string }> }
      | undefined;

    if (!structuredResponse?.items) {
      this.logger.error(
        '生成字段业务名称失败，返回结果格式错误',
        JSON.stringify(result, null, 2),
      );
      throw new InternalServerErrorException('生成字段业务名称失败');
    }

    const generatedNameMap = new Map(
      structuredResponse.items.map((item) => [
        item.fieldId,
        item.businessName.trim(),
      ]),
    );

    return {
      items: request.fields.map((field) => ({
        fieldId: field.fieldId,
        businessName:
          generatedNameMap.get(field.fieldId) ||
          field.currentBusinessName?.trim() ||
          field.fieldName,
      })),
    };
  }

  /**
   * 首轮对话后生成会话标题；仅当标题为空时执行，避免重复生成与覆盖用户已有标题。
   */
  async generateSessionTitleIfMissing(params: {
    sessionId: string;
    aiId: string;
    userMessage: string;
    assistantMessage: string;
  }): Promise<string | null> {
    const { sessionId, aiId, userMessage, assistantMessage } = params;

    console.log('hcs userMessage', userMessage);
    console.log('hcs assistantMessage', assistantMessage);

    const session = await this.aiSessionService.findOne(sessionId);
    if (session.title?.trim()) {
      return null;
    }

    const ai = await this.aiService.findOne(aiId);
    if (ai.status !== AiStatus.ACTIVE) {
      return null;
    }

    const llm = this.chatLlmService.createLLM(
      this.chatLlmService.getLLMConfig(ai),
      0.2,
      64,
      {
        thinking: {
          type: 'disabled',
        },
      },
    );

    const responseSchema = z.object({
      title: z.string().min(2).max(30),
    });

    const promptTemplate = PromptTemplate.fromTemplate(
      await this.chatPromptService.loadSessionTitlePrompt(),
    );
    const prompt = await promptTemplate.format({
      userMessage,
      assistantMessage,
    });

    const agent = createAgent({
      model: llm,
      tools: [],
      responseFormat: toolStrategy(responseSchema),
      systemPrompt: prompt,
    });

    const result = await agent.invoke({
      messages: [new HumanMessage('请生成本次会话标题。')],
    });

    const structuredResponse = result.structuredResponse as
      | { title: string }
      | undefined;

    const generatedTitle = structuredResponse?.title?.trim();
    if (!generatedTitle) {
      return null;
    }

    await this.aiSessionService.update({
      id: sessionId,
      title: generatedTitle,
    });

    return generatedTitle;
  }
}
