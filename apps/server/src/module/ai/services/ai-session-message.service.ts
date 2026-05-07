import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { BaseMessage, mapStoredMessageToChatMessage } from '@langchain/core/messages';
import { AiSessionMessage } from '../entities';
import {
  AiSessionMessageResponse,
  CursorPaginatedResponse,
} from '../dto/ai-session-message.response';
import { YieldType } from '@seedar/types/ai';
import type { AiChatResumeDto } from '@seedar/types/ai';

type PersistableMessageType = YieldType | 'user';
type AiContextStrategy = 'preventive' | 'window' | 'summary' | 'trim';
type PersistableChunk = {
  sid: string;
  type?: YieldType;
  role?: string;
  content: string | Record<string, unknown>;
  meta?: Record<string, unknown>;
};

type SegmentAccumulator = {
  sessionId: string;
  turnId: string;
  sid: string;
  messageType: PersistableMessageType;
  role?: string;
  contentText: string;
  contentJson?: Record<string, unknown>;
  metaJson?: Record<string, unknown>;
};

@Injectable()
export class AiSessionMessageService {
  constructor(
    @InjectRepository(AiSessionMessage)
    private readonly aiSessionMessageRepository: Repository<AiSessionMessage>,
  ) {}

  createUserMessageSegment(
    sessionId: string,
    turnId: string,
    content: string,
  ): SegmentAccumulator {
    return {
      sessionId,
      turnId,
      sid: `user_${turnId}`,
      messageType: 'user',
      role: 'user',
      contentText: content ?? '',
    };
  }

  createChunkSegment(
    sessionId: string,
    turnId: string,
    chunk: PersistableChunk,
  ): SegmentAccumulator {
    return {
      sessionId,
      turnId,
      sid: chunk.sid,
      messageType: (chunk.type ?? 'text') as PersistableMessageType,
      role: chunk.role,
      contentText: typeof chunk.content === 'string' ? chunk.content : '',
      contentJson:
        typeof chunk.content === 'string'
          ? undefined
          : (chunk.content as unknown as Record<string, unknown>),
      metaJson: chunk.meta ? { ...chunk.meta } : undefined,
    };
  }

  appendChunkToSegment(
    segment: SegmentAccumulator,
    chunk: PersistableChunk,
  ): SegmentAccumulator {
    const next = { ...segment };
    if (typeof chunk.content === 'string') {
      next.contentText += chunk.content;
    } else {
      next.contentJson = chunk.content as unknown as Record<string, unknown>;
    }
    if (chunk.meta) {
      next.metaJson = { ...chunk.meta };
    }
    return next;
  }

  async persistSegment(segment: SegmentAccumulator): Promise<void> {
    const message = this.aiSessionMessageRepository.create({
      sessionId: segment.sessionId,
      turnId: segment.turnId,
      sid: segment.sid,
      messageType: segment.messageType,
      role: segment.role,
      contentText: segment.contentText || undefined,
      contentJson: segment.contentJson,
      metaJson: segment.metaJson,
    });
    await this.aiSessionMessageRepository.save(message);
  }

  async applyInterruptResumeResult(
    sessionId: string,
    resumePayload?: AiChatResumeDto,
  ): Promise<void> {
    if (
      !resumePayload ||
      resumePayload.kind !== 'interrupt_result' ||
      !resumePayload.interruptResult
    ) {
      return;
    }

    const interruptRows = await this.aiSessionMessageRepository.find({
      where: {
        sessionId,
        messageType: 'interrupt',
      },
      order: { id: 'DESC' },
      take: 200,
    });

    if (interruptRows.length === 0) {
      return;
    }

    const interruptResult = resumePayload.interruptResult as unknown as Record<
      string,
      unknown
    >;
    const resultKind = interruptResult.kind as string | undefined;

    if (resultKind === 'ask_user_result') {
      const target = interruptRows.find(
        (row) => this.getInterruptKind(row) === 'ask_user',
      );
      if (!target) {
        return;
      }

      const nextContentJson = this.mergeAskUserAnswers(
        target.contentJson,
        interruptResult,
      );
      const nextMetaJson = {
        ...(target.metaJson ?? {}),
        interruptResolved: true,
        interruptResolvedKind: 'ask_user_result',
        interruptResolvedAt: new Date().toISOString(),
      };

      target.contentJson =
        (nextContentJson as unknown as AiSessionMessage['contentJson']) ??
        undefined;
      target.metaJson = nextMetaJson as unknown as AiSessionMessage['metaJson'];
      await this.aiSessionMessageRepository.save(target);
      return;
    }

    if (resultKind === 'workflow_result') {
      const interruptId = interruptResult.interruptId as string | undefined;
      const target = interruptRows.find((row) => {
        if (this.getInterruptKind(row) !== 'workflow_run') {
          return false;
        }
        if (!interruptId) {
          return true;
        }
        return this.getWorkflowInterruptId(row) === interruptId;
      });
      if (!target) {
        return;
      }

      const nextMetaJson = {
        ...(target.metaJson ?? {}),
        interruptResolved: true,
        interruptResolvedKind: 'workflow_result',
        interruptResolvedAt: new Date().toISOString(),
        workflowResult: interruptResult,
      };

      target.metaJson = nextMetaJson as unknown as AiSessionMessage['metaJson'];
      await this.aiSessionMessageRepository.save(target);
    }
  }

  async listBySession(
    sessionId: string,
    cursor?: string,
    limit: number = 50,
  ): Promise<CursorPaginatedResponse<AiSessionMessageResponse>> {
    const safeLimit = Math.max(1, Math.min(limit, 200));
    const where = cursor
      ? ({ sessionId, id: LessThan(cursor) } as const)
      : ({ sessionId } as const);
    const rows = await this.aiSessionMessageRepository.find({
      where,
      order: { id: 'DESC' },
      take: safeLimit + 1,
    });

    const hasMore = rows.length > safeLimit;
    const pageRows = hasMore ? rows.slice(0, safeLimit) : rows;
    const ascRows = pageRows.reverse();

    return {
      data: ascRows.map((row) => this.toResponse(row)),
      nextCursor: hasMore ? pageRows[pageRows.length - 1]?.id : undefined,
    };
  }

  async listBySessionOrRecover(
    sessionId: string,
    cursor: string | undefined,
    limit: number,
    checkpointMessages?: unknown,
  ): Promise<CursorPaginatedResponse<AiSessionMessageResponse>> {
    const page = await this.listBySession(sessionId, cursor, limit);
    if (page.data.length > 0 || cursor) {
      return page;
    }

    const recovered = this.tryRecoverMessagesFromCheckpoint(
      sessionId,
      checkpointMessages,
    );
    if (recovered.length === 0) {
      return {
        data: [this.createHistoryUnavailableMessage(sessionId)],
      };
    }

    return {
      data: recovered,
    };
  }

  buildContextStatusEvent(
    sessionId: string,
    payload: {
      phase: 'start' | 'success' | 'fallback' | 'failed';
      strategy: AiContextStrategy;
      beforeTokens: number;
      afterTokens?: number;
      summarySegments?: number;
      message: string;
    },
  ): {
    sessionId: string;
    phase: 'start' | 'success' | 'fallback' | 'failed';
    strategy: AiContextStrategy;
    beforeTokens: number;
    afterTokens?: number;
    summarySegments?: number;
    message: string;
  } {
    return {
      sessionId,
      ...payload,
    };
  }

  private tryRecoverMessagesFromCheckpoint(
    sessionId: string,
    checkpointMessages: unknown,
  ): AiSessionMessageResponse[] {
    if (!Array.isArray(checkpointMessages) || checkpointMessages.length === 0) {
      return [];
    }

    const messages: BaseMessage[] = [];
    for (const item of checkpointMessages) {
      try {
        const mapped = mapStoredMessageToChatMessage(
          item as Parameters<typeof mapStoredMessageToChatMessage>[0],
        );
        if (mapped._getType() !== 'remove') {
          messages.push(mapped);
        }
      } catch {
        continue;
      }
    }

    if (messages.length === 0) {
      return [];
    }

    return messages.map((message, index) => {
      const createdAt = new Date(Date.now() + index);
      const contentText = this.messageContentToText(message.content);
      const messageType = this.mapMessageTypeFromBaseMessage(message);
      const role = this.mapRoleFromBaseMessage(message);
      const sid =
        ((message.additional_kwargs as Record<string, unknown> | undefined)
          ?.sid as string | undefined) || `recovered_${index + 1}`;

      return {
        id: `recovered-${index + 1}`,
        sessionId,
        turnId: 'recovered',
        sid,
        messageType,
        role,
        contentText,
        contentJson:
          typeof message.content === 'string'
            ? undefined
            : ({ value: message.content } as Record<string, unknown>),
        metaJson: {
          recoveredFromCheckpoint: true,
        },
        createdAt,
      };
    });
  }

  private messageContentToText(content: unknown): string {
    if (typeof content === 'string') {
      return content;
    }

    if (Array.isArray(content)) {
      return content
        .map((item) => {
          if (typeof item === 'string') {
            return item;
          }
          if (item && typeof item === 'object' && 'text' in item) {
            const text = (item as { text?: unknown }).text;
            return typeof text === 'string' ? text : '';
          }
          return '';
        })
        .filter(Boolean)
        .join('\n');
    }

    if (content && typeof content === 'object') {
      return JSON.stringify(content);
    }

    return '';
  }

  private mapMessageTypeFromBaseMessage(message: BaseMessage): string {
    const type = message._getType();
    if (type === 'human') {
      return 'user';
    }
    if (type === 'tool') {
      return 'tool_result';
    }
    return 'text';
  }

  private mapRoleFromBaseMessage(message: BaseMessage): string {
    const type = message._getType();
    if (type === 'human') {
      return 'user';
    }
    return 'act';
  }

  private createHistoryUnavailableMessage(
    sessionId: string,
  ): AiSessionMessageResponse {
    return {
      id: 'history-unavailable',
      sessionId,
      turnId: 'system',
      sid: 'system_history_unavailable',
      messageType: 'text',
      role: 'act',
      contentText:
        '该会话创建较早，尚未启用分段消息持久化，历史消息暂不可回放。后续对话会自动保存。',
      metaJson: {
        recoveredFromCheckpoint: false,
        historyUnavailable: true,
      },
      createdAt: new Date(),
    };
  }

  private getInterruptKind(row: AiSessionMessage): string | undefined {
    const value = row.contentJson?.value as Record<string, unknown> | undefined;
    const kind = value?.kind;
    return typeof kind === 'string' ? kind : undefined;
  }

  private getWorkflowInterruptId(row: AiSessionMessage): string | undefined {
    const value = row.contentJson?.value as Record<string, unknown> | undefined;
    const interruptId = value?.interruptId;
    return typeof interruptId === 'string' ? interruptId : undefined;
  }

  private mergeAskUserAnswers(
    sourceContentJson: Record<string, unknown> | undefined,
    askUserResult: Record<string, unknown>,
  ): Record<string, unknown> | undefined {
    if (!sourceContentJson || typeof sourceContentJson !== 'object') {
      return sourceContentJson;
    }

    const value = sourceContentJson.value as Record<string, unknown> | undefined;
    if (!value || value.kind !== 'ask_user') {
      return sourceContentJson;
    }

    const answers = askUserResult.answers;
    if (!Array.isArray(answers)) {
      return sourceContentJson;
    }

    return {
      ...sourceContentJson,
      value: {
        ...value,
        answers,
      },
    };
  }

  private toResponse(row: AiSessionMessage): AiSessionMessageResponse {
    return {
      id: row.id,
      sessionId: row.sessionId,
      turnId: row.turnId,
      sid: row.sid,
      messageType: row.messageType,
      role: row.role,
      contentText: row.contentText,
      contentJson: row.contentJson,
      metaJson: row.metaJson,
      createdAt: row.createdAt,
    };
  }
}
