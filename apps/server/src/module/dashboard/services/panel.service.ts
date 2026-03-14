import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DashboardPanel } from '../entities/dashboard-panel.entity';
import { CreatePanelRequest } from '../dto/create-panel.request';
import { UpdatePanelRequest } from '../dto/update-panel.request';
import { PanelResponse } from '../dto/panel.response';

@Injectable()
export class PanelService {
  constructor(
    @InjectRepository(DashboardPanel)
    private readonly panelRepository: Repository<DashboardPanel>,
  ) {}

  async create(createPanelRequest: CreatePanelRequest): Promise<PanelResponse> {
    const panel = this.panelRepository.create({
      title: createPanelRequest.title || null,
      type: createPanelRequest.type,
      queryId: createPanelRequest.queryId || null,
      config: createPanelRequest.config || null,
      width: createPanelRequest.width || null,
      height: createPanelRequest.height || null,
    });
    const saved = await this.panelRepository.save(panel);
    return PanelResponse.fromEntity(saved);
  }

  async findAll(): Promise<PanelResponse[]> {
    const panels = await this.panelRepository.find();
    return panels.map((p) => PanelResponse.fromEntity(p));
  }

  async findOne(id: string): Promise<PanelResponse> {
    const panel = await this.panelRepository.findOne({ where: { id } });
    if (!panel) {
      throw new NotFoundException(`Panel with ID ${id} not found`);
    }
    return PanelResponse.fromEntity(panel);
  }

  async update(
    id: string,
    updatePanelRequest: UpdatePanelRequest,
  ): Promise<PanelResponse> {
    const panel = await this.panelRepository.findOne({ where: { id } });
    if (!panel) {
      throw new NotFoundException(`Panel with ID ${id} not found`);
    }
    Object.assign(panel, updatePanelRequest);
    const saved = await this.panelRepository.save(panel);
    return PanelResponse.fromEntity(saved);
  }

  async remove(id: string): Promise<void> {
    const result = await this.panelRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Panel with ID ${id} not found`);
    }
  }
}
