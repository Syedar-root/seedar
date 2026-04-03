import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiSession } from '../entities/ai-session.entity';
import { AiSessionStatus } from '../enums/ai-session-status.enum';
import {
  CreateAiSessionRequest,
  QueryAiSessionRequest,
  UpdateAiSessionRequest,
} from '../dto/ai-session.request';
import {
  AiSessionResponse,
  PaginatedAiSessionResponse,
} from '../dto/ai-session.response';

@Injectable()
export class AiSessionService {
  constructor(
    @InjectRepository(AiSession)
    private readonly aiSessionRepository: Repository<AiSession>,
  ) {}

  async create(request: CreateAiSessionRequest): Promise<AiSessionResponse> {
    const session = this.aiSessionRepository.create({
      title: request.title,
      type: request.type,
      status: AiSessionStatus.ACTIVE,
    });
    const saved = await this.aiSessionRepository.save(session);
    return this.toResponse(saved);
  }

  async findAll(
    query: QueryAiSessionRequest,
  ): Promise<PaginatedAiSessionResponse<AiSessionResponse>> {
    const { page = 1, pageSize = 20, status, type } = query;

    const where: Record<string, any> = {};
    if (status !== undefined) {
      where.status = status;
    } else {
      where.status = AiSessionStatus.ACTIVE;
    }
    if (type !== undefined) {
      where.type = type;
    }

    const [sessions, total] = await this.aiSessionRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      data: sessions.map((s) => this.toResponse(s)),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string): Promise<AiSessionResponse | null> {
    const session = await this.aiSessionRepository.findOne({ where: { id } });
    return session ? this.toResponse(session) : null;
  }

  async update(
    request: UpdateAiSessionRequest,
  ): Promise<AiSessionResponse | null> {
    const session = await this.aiSessionRepository.findOne({
      where: { id: request.id },
    });
    if (!session) {
      return null;
    }
    if (request.title !== undefined) {
      session.title = request.title;
    }
    if (request.status !== undefined) {
      session.status = request.status;
    }
    const saved = await this.aiSessionRepository.save(session);
    return this.toResponse(saved);
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.aiSessionRepository.softDelete({ id });
    return (result.affected ?? 0) > 0;
  }

  private toResponse(session: AiSession): AiSessionResponse {
    return {
      id: session.id,
      title: session.title,
      type: session.type,
      status: session.status,
      totalTokens: session.totalTokens,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
    };
  }
}
