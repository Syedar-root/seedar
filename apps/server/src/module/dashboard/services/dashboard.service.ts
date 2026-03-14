import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Dashboard } from '../entities/dashboard.entity';
import { DashboardPanelRelation } from '../entities/dashboard-panel-relation.entity';
import { CreateDashboardRequest } from '../dto/create-dashboard.request';
import { UpdateDashboardRequest } from '../dto/update-dashboard.request';
import { DashboardResponse } from '../dto/dashboard.response';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Dashboard)
    private readonly dashboardRepository: Repository<Dashboard>,
    @InjectRepository(DashboardPanelRelation)
    private readonly relationRepository: Repository<DashboardPanelRelation>,
  ) {}

  async create(
    createDashboardRequest: CreateDashboardRequest,
  ): Promise<DashboardResponse> {
    const dashboard = this.dashboardRepository.create({
      name: createDashboardRequest.name,
      layout: createDashboardRequest.layout || null,
    });
    const saved = await this.dashboardRepository.save(dashboard);
    return DashboardResponse.fromEntity(saved);
  }

  async findAll(): Promise<DashboardResponse[]> {
    const dashboards = await this.dashboardRepository.find();
    return dashboards.map((d) => DashboardResponse.fromEntity(d));
  }

  async findOne(id: string): Promise<DashboardResponse> {
    const dashboard = await this.dashboardRepository.findOne({
      where: { id },
      relations: ['panelRelations', 'panelRelations.panel'],
    });
    if (!dashboard) {
      throw new NotFoundException(`Dashboard with ID ${id} not found`);
    }
    return DashboardResponse.fromEntity(dashboard);
  }

  async update(
    id: string,
    updateDashboardRequest: UpdateDashboardRequest,
  ): Promise<DashboardResponse> {
    const dashboard = await this.dashboardRepository.findOne({ where: { id } });
    if (!dashboard) {
      throw new NotFoundException(`Dashboard with ID ${id} not found`);
    }
    Object.assign(dashboard, updateDashboardRequest);
    const saved = await this.dashboardRepository.save(dashboard);
    return DashboardResponse.fromEntity(saved);
  }

  async remove(id: string): Promise<void> {
    const result = await this.dashboardRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Dashboard with ID ${id} not found`);
    }
  }

  async updateLayout(
    id: string,
    layout: Record<string, any>,
  ): Promise<DashboardResponse> {
    const dashboard = await this.dashboardRepository.findOne({ where: { id } });
    if (!dashboard) {
      throw new NotFoundException(`Dashboard with ID ${id} not found`);
    }
    dashboard.layout = layout;
    const saved = await this.dashboardRepository.save(dashboard);
    return DashboardResponse.fromEntity(saved);
  }

  async addPanel(dashboardId: string, panelId: string): Promise<void> {
    const relation = this.relationRepository.create({
      dashboardId,
      panelId,
    });
    await this.relationRepository.save(relation);
  }

  async removePanel(dashboardId: string, panelId: string): Promise<void> {
    const result = await this.relationRepository.delete({
      dashboardId,
      panelId,
    });
    if (result.affected === 0) {
      throw new NotFoundException(
        `Panel ${panelId} not found in Dashboard ${dashboardId}`,
      );
    }
  }
}
