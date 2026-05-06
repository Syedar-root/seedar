import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { AiSessionMessage } from '../entities';
import {
  AiSessionMessageResponse,
  CursorPaginatedResponse,
} from '../dto/ai-session-message.response';
import { YieldType } from '@seedar/types/ai';

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
