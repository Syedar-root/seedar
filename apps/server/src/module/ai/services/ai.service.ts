import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ai } from '../entities/ai.entity';
import { CreateAiRequest } from '../dto/create-ai.request';
import { UpdateAiRequest } from '../dto/update-ai.request';
import { AiResponse } from '../dto/ai.response';

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

  async findAll(): Promise<AiResponse[]> {
    const ais = await this.aiRepository.find();
    return ais.map((ai) => this.toResponse(ai));
  }

  async findOne(id: number): Promise<AiResponse | null> {
    const ai = await this.aiRepository.findOne({ where: { id } });
    return ai ? this.toResponse(ai) : null;
  }

  async update(request: UpdateAiRequest): Promise<AiResponse | null> {
    const ai = await this.aiRepository.findOne({ where: { id: request.id } });
    if (!ai) {
      return null;
    }
    Object.assign(ai, request);
    const saved = await this.aiRepository.save(ai);
    return this.toResponse(saved);
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.aiRepository.delete(id);
    return result.affected > 0;
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
