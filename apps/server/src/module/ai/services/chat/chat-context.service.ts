import { Injectable } from '@nestjs/common';
import {
  AIMessage,
  BaseMessage,
  HumanMessage,
  RemoveMessage,
  ToolMessage,
} from '@langchain/core/messages';
import { REMOVE_ALL_MESSAGES } from '@langchain/langgraph';
import { randomUUID } from 'crypto';
import { AiResponse } from '../../dto/ai.response';
import type { LLMConfig } from '../../ai.types';
import { AiSessionMessageService } from '../ai-session-message.service';
import { ChatLlmService } from './chat-llm.service';
import { CHAT_CONTEXT_POLICY_DEFAULTS } from './chat.constants';
import type {
  ContextManagementResult,
  ContextPolicy,
  MessageSegment,
  ResolvedContextPolicy,
} from './chat.types';

@Injectable()
export class ChatContextService {
  constructor(
    private readonly aiSessionMessageService: AiSessionMessageService,
    private readonly chatLlmService: ChatLlmService,
  ) {}

  /**
   * Return default context-window size based on model family.
   */
  resolveModelContextWindow(model: string): number {
    const lower = model.toLowerCase();
    if (lower.startsWith('claude')) {
      return 200_000;
    }
    if (lower.startsWith('gpt')) {
      return 128_000;
    }
    if (lower.startsWith('deepseek')) {
      return 128_000;
    }
    return 64_000;
  }

  /**
   * Merge model defaults with configured overrides into final context policy.
   */
  resolveContextPolicy(ai: AiResponse, llmConfig: LLMConfig): ResolvedContextPolicy {
    const config = ai.config as Record<string, unknown> | undefined;
    const llm = config?.llm as Record<string, unknown> | undefined;
    const policy = llm?.contextPolicy as ContextPolicy | undefined;
    const resolvedWindow =
      policy?.contextWindowTokens && policy.contextWindowTokens > 0
        ? policy.contextWindowTokens
        /**
         * Return default context-window size based on model family.
         */
        : this.resolveModelContextWindow(llmConfig.model);

    return {
      contextWindowTokens: resolvedWindow,
      softRatio:
        typeof policy?.softRatio === 'number'
          ? policy.softRatio
          : CHAT_CONTEXT_POLICY_DEFAULTS.softRatio,
      hardRatio:
        typeof policy?.hardRatio === 'number'
          ? policy.hardRatio
          : CHAT_CONTEXT_POLICY_DEFAULTS.hardRatio,
      keepRecentSegments:
        typeof policy?.keepRecentSegments === 'number'
          ? policy.keepRecentSegments
          : CHAT_CONTEXT_POLICY_DEFAULTS.keepRecentSegments,
    };
  }

  /**
   * Normalize heterogeneous message content into plain text.
   */
  contentToText(content: unknown): string {
    if (typeof content === 'string') {
      return content;
    }
    if (Array.isArray(content)) {
      return content
        .map((item) => {
          if (typeof item === 'string') {
            return item;
          }
          if (item && typeof item === 'object') {
            const maybeText = (item as Record<string, unknown>).text;
            if (typeof maybeText === 'string') {
              return maybeText;
            }
            return JSON.stringify(item);
          }
          return '';
        })
        .join('\n');
    }
    if (content && typeof content === 'object') {
      return JSON.stringify(content);
    }
    return '';
  }

  /**
   * Estimate token usage from normalized message text.
   */
  estimateContextTokens(messages: BaseMessage[]): number {
    if (messages.length === 0) {
      return 0;
    }
    const chars = messages.reduce((acc, msg) => {
      /**
       * Normalize heterogeneous message content into plain text.
       */
      return acc + this.contentToText(msg.content).length + 8;
    }, 0);
    return Math.ceil(chars / 4);
  }

  /**
   * Remove empty and consecutive-duplicate messages to reduce noise.
   */
  sanitizeMessages(messages: BaseMessage[]): BaseMessage[] {
    const next: BaseMessage[] = [];
    for (const msg of messages) {
      /**
       * Normalize heterogeneous message content into plain text.
       */
      const text = this.contentToText(msg.content).trim();
      if (!text) {
        continue;
      }
      const last = next[next.length - 1];
      if (
        last &&
        this.getMessageKind(last) === this.getMessageKind(msg) &&
        /**
         * Normalize heterogeneous message content into plain text.
         */
        this.contentToText(last.content).trim() === text
      ) {
        continue;
      }
      next.push(msg);
    }
    return next;
  }

  /**
   * Shrink oversized tool results before sending context to model.
   */
  offloadLargeToolResults(messages: BaseMessage[]): BaseMessage[] {
    return messages.map((msg) => {
      if (!(msg instanceof ToolMessage)) {
        return msg;
      }
      /**
       * Normalize heterogeneous message content into plain text.
       */
      const text = this.contentToText(msg.content);
      if (text.length <= 2400) {
        return msg;
      }
      return new ToolMessage({
        content: `[tool_result 已压缩展示，原始长度 ${text.length} 字符] ${text.slice(0, 800)}...`,
        tool_call_id: msg.tool_call_id,
      });
    });
  }

  /**
   * Group messages by sid for window retention and summary selection.
   */
  splitBySegments(messages: BaseMessage[]): MessageSegment[] {
    const segments: MessageSegment[] = [];
    for (const message of messages) {
      const sid =
        ((message.additional_kwargs as Record<string, unknown> | undefined)
          ?.sid as string | undefined) ||
        message.id ||
        randomUUID();
      const last = segments[segments.length - 1];
      if (last?.sid === sid) {
        last.messages.push(message);
      } else {
        segments.push({ sid, messages: [message] });
      }
    }
    return segments;
  }

  /**
   * Execute pre-stream context governance (clean, summarize, trim, write-back, emit events).
   */
  async manageContextBeforeStream(params: {
    agent: {
      getState: (config: { configurable: { thread_id: string } }) => Promise<{
        values?: Record<string, unknown>;
      }>;
      updateState: (
        config: { configurable: { thread_id: string } },
        values: Record<string, unknown>,
      ) => Promise<unknown>;
    };
    ai: AiResponse;
    llmConfig: LLMConfig;
    threadId: string;
    sessionId: string;
  }): Promise<ContextManagementResult> {
    const { agent, ai, llmConfig, threadId, sessionId } = params;
    const config = { configurable: { thread_id: threadId } };
    let state:
      | {
          values?: Record<string, unknown>;
        }
      | undefined;

    try {
      state = await agent.getState(config);
    } catch {
      return { events: [] };
    }

    const sourceMessages =
      (state?.values?.messages as BaseMessage[] | undefined) ?? [];
    if (sourceMessages.length === 0) {
      return { events: [] };
    }

    /**
     * Remove empty and consecutive-duplicate messages to reduce noise.
     */
    const sanitized = this.sanitizeMessages(
      /**
       * Shrink oversized tool results before sending context to model.
       */
      this.offloadLargeToolResults(sourceMessages),
    );
    if (sanitized.length === 0) {
      return { events: [] };
    }

    /**
     * Merge model defaults with configured overrides into final context policy.
     */
    const policy = this.resolveContextPolicy(ai, llmConfig);
    const softThreshold = Math.floor(
      policy.contextWindowTokens * policy.softRatio,
    );
    const hardThreshold = Math.floor(
      policy.contextWindowTokens * policy.hardRatio,
    );

    /**
     * Estimate token usage from normalized message text.
     */
    const beforeTokens = this.estimateContextTokens(sanitized);
    // 未超软阈值时只做“无损清洗”写回，不触发摘要。
    if (beforeTokens <= softThreshold) {
      if (sanitized.length !== sourceMessages.length) {
        await agent.updateState(config, {
          messages: [
            new RemoveMessage({ id: REMOVE_ALL_MESSAGES }),
            ...sanitized,
          ],
        });
        return {
          managedMessages: sanitized,
          events: [],
        };
      }
      return { events: [] };
    }

    const events: ContextManagementResult['events'] = [
      this.aiSessionMessageService.buildContextStatusEvent(sessionId, {
        phase: 'start',
        strategy: 'summary',
        beforeTokens,
        message: '上下文较长，正在压缩历史上下文...',
      }),
    ];

    /**
     * Group messages by sid for window retention and summary selection.
     */
    const segments = this.splitBySegments(sanitized);
    const keepCount = Math.max(1, policy.keepRecentSegments);
    // 按 sid 分段保留最近窗口；仅压缩旧段，尽量不动最近对话语义。
    const recentSegments = segments.slice(-keepCount);
    const oldSegments = segments.slice(0, Math.max(0, segments.length - keepCount));
    let managedMessages = sanitized;

    try {
      if (oldSegments.length > 0) {
        const summary = await this.summarizeSegments(llmConfig, oldSegments);
        const summaryMessage = new AIMessage({
          content: `[历史摘要]\n${summary}`,
          additional_kwargs: {
            sid: `summary_${Date.now()}`,
            context_summary: true,
          },
        });
        managedMessages = [
          summaryMessage,
          ...recentSegments.flatMap((segment) => segment.messages),
        ];
      } else {
        managedMessages = recentSegments.flatMap((segment) => segment.messages);
      }

      /**
       * Estimate token usage from normalized message text.
       */
      const afterTokens = this.estimateContextTokens(managedMessages);
      events.push(
        this.aiSessionMessageService.buildContextStatusEvent(sessionId, {
          phase: 'success',
          strategy: 'summary',
          beforeTokens,
          afterTokens,
          summarySegments: oldSegments.length,
          message: '上下文压缩完成',
        }),
      );
    } catch (error) {
      // 摘要失败时降级为裁剪，保证请求仍可继续。
      const fallbackMessages = sanitized.slice(-Math.max(1, keepCount * 3));
      /**
       * Estimate token usage from normalized message text.
       */
      const afterTokens = this.estimateContextTokens(fallbackMessages);
      managedMessages = fallbackMessages;
      events.push(
        this.aiSessionMessageService.buildContextStatusEvent(sessionId, {
          phase: 'fallback',
          strategy: 'trim',
          beforeTokens,
          afterTokens,
          message: `上下文摘要失败，已降级为裁剪: ${
            error instanceof Error ? error.message : 'unknown'
          }`,
        }),
      );
    }

    /**
     * Estimate token usage from normalized message text.
     */
    const afterTokens = this.estimateContextTokens(managedMessages);
    if (afterTokens > hardThreshold) {
      // 仍超硬阈值时执行二次硬裁剪，优先保证模型可推理。
      const hardTrimMessages = managedMessages.slice(-Math.max(1, keepCount * 2));
      managedMessages = hardTrimMessages;
      events.push(
        this.aiSessionMessageService.buildContextStatusEvent(sessionId, {
          phase: 'fallback',
          strategy: 'trim',
          beforeTokens: afterTokens,
          /**
           * Estimate token usage from normalized message text.
           */
          afterTokens: this.estimateContextTokens(hardTrimMessages),
          message: '上下文仍超阈值，已执行硬裁剪',
        }),
      );
    }

    try {
      await agent.updateState(config, {
        messages: [
          new RemoveMessage({ id: REMOVE_ALL_MESSAGES }),
          ...managedMessages,
        ],
      });
    } catch (error) {
      // 状态写回失败不阻断主流程，只通过 context 事件告知前端。
      events.push(
        this.aiSessionMessageService.buildContextStatusEvent(sessionId, {
          phase: 'failed',
          strategy: 'trim',
          beforeTokens,
          message: `上下文状态写回失败: ${
            error instanceof Error ? error.message : 'unknown'
          }`,
        }),
      );
    }

    return {
      managedMessages,
      events,
    };
  }

  /**
   * Get message kind with compatibility across message implementations.
   */
  private getMessageKind(message: BaseMessage): string {
    const msg = message as BaseMessage & { getType?: () => string; type?: string };
    if (typeof msg.getType === 'function') {
      return msg.getType();
    }
    return msg.type || 'unknown';
  }

  /**
   * Summarize old segments to preserve intent while reducing context size.
   */
  private async summarizeSegments(
    llmConfig: LLMConfig,
    segments: MessageSegment[],
  ): Promise<string> {
    const llm = this.chatLlmService.createLLM(llmConfig, 0.2, 1200, {
      thinking: { type: 'disabled' },
    });
    const joined = segments
      .map((segment, index) => {
        const text = segment.messages
          .map((msg) => {
            const role = this.getMessageKind(msg);
            /**
             * Normalize heterogeneous message content into plain text.
             */
            return `[${role}] ${this.contentToText(msg.content)}`;
          })
          .join('\n');
        return `段${index + 1}(${segment.sid}):\n${text}`;
      })
      .join('\n\n');

    const prompt = [
      '请将以下历史对话段压缩为结构化摘要，保留：用户目标、关键事实、工具调用结果、未完成事项。',
      '输出中文，控制在 500 字以内，避免冗余。',
      '',
      joined,
    ].join('\n');

    const summary = await llm.invoke([new HumanMessage({ content: prompt })]);
    /**
     * Normalize heterogeneous message content into plain text.
     */
    const text = this.contentToText(summary.content).trim();
    if (!text) {
      throw new Error('上下文摘要为空');
    }
    return text;
  }
}

