import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ai } from '../entities/ai.entity';
import { CreateAiRequest } from '../dto/create-ai.request';
import { UpdateAiRequest } from '../dto/update-ai.request';
import { AiResponse } from '../dto/ai.response';
import { PaginatedResult } from '../ai.types';

@Injectable()
export class AiService {
  constructor(
    @InjectRepository(Ai)
    private readonly aiRepository: Repository<Ai>,
  ) {}

  async create(request: CreateAiRequest): Promise<AiResponse> {
    const ai = this.aiRepository.create(request);
    const saved = await this.aiRepository.save(ai);
    return this.toResponse(saved);
  }

  async findAll(
    page: number = 1,
    pageSize: number = 20,
  ): Promise<PaginatedResult<AiResponse>> {
    const pageSizeLimit = Math.min(pageSize, 100);

    const [ais, total] = await this.aiRepository.findAndCount({
      where: {},
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSizeLimit,
      take: pageSizeLimit,
    });

    return {
      data: ais.map((ai) => this.toResponse(ai)),
      total,
      page,
      pageSize: pageSizeLimit,
    };
  }

  async findOne(id: string): Promise<AiResponse> {
    const ai = await this.aiRepository.findOne({ where: { id } });
    if (!ai) {
      throw new NotFoundException(`AI with ID ${id} not found`);
    }
    return this.toResponse(ai);
  }

  async update(request: UpdateAiRequest): Promise<AiResponse> {
    const ai = await this.aiRepository.findOne({ where: { id: request.id } });
    if (!ai) {
      throw new NotFoundException(`AI with ID ${request.id} not found`);
    }
    Object.assign(ai, request);
    const saved = await this.aiRepository.save(ai);
    return this.toResponse(saved);
  }

  async remove(id: string): Promise<void> {
    const ai = await this.aiRepository.findOne({ where: { id } });
    if (!ai) {
      throw new NotFoundException(`AI with ID ${id} not found`);
    }
    await this.aiRepository.softRemove(ai);
  }

  private toResponse(ai: Ai): AiResponse {
    return {
      id: ai.id,
      name: ai.name,
      description: ai.description,
      type: ai.type,
      status: ai.status,
      config: ai.config,
      createdAt: ai.createdAt,
      updatedAt: ai.updatedAt,
    };
  }
}
