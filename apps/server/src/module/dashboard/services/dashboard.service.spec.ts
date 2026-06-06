import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { Dashboard } from '../entities/dashboard.entity';
import { DashboardPanelRelation } from '../entities/dashboard-panel-relation.entity';
import { PanelService } from './panel.service';
import { createRepositoryMock } from '../../../../test/test-utils';

describe('仪表盘服务', () => {
  let service: DashboardService;
  const dashboardRepository = createRepositoryMock<Dashboard>();
  const relationRepository = createRepositoryMock<DashboardPanelRelation>();
  const panelService = { findAll: jest.fn() };

  const dashboard = {
    id: 'd1',
    name: 'Main',
    layout: null,
    panelRelations: [{ panel: { id: 'p1' } }],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  } as any;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: getRepositoryToken(Dashboard), useValue: dashboardRepository },
        {
          provide: getRepositoryToken(DashboardPanelRelation),
          useValue: relationRepository,
        },
        { provide: PanelService, useValue: panelService },
      ],
    }).compile();

    service = moduleRef.get(DashboardService);
    jest.clearAllMocks();
  });

  it('正常流程：有效布局可创建仪表盘', async () => {
    panelService.findAll.mockResolvedValue([{ id: 'p1' }]);
    dashboardRepository.save.mockResolvedValue(dashboard);

    await expect(
      service.create({ name: 'Main', layout: { lg: [{ i: 'p1' }] } } as any),
    ).resolves.toMatchObject({ id: 'd1', panels: [{ id: 'p1' }] });
  });

  it('异常流程：布局引用未知面板时拒绝创建', async () => {
    panelService.findAll.mockResolvedValue([{ id: 'p1' }]);

    await expect(
      service.create({ name: 'Bad', layout: { lg: [{ i: 'p2' }] } } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('正常流程：查询仪表盘列表', async () => {
    dashboardRepository.find.mockResolvedValue([dashboard]);

    await expect(service.findAll()).resolves.toEqual([
      expect.objectContaining({ id: 'd1' }),
    ]);
  });

  it('正常流程：查询单个仪表盘并映射面板', async () => {
    dashboardRepository.findOne.mockResolvedValue(dashboard);

    await expect(service.findOne('d1')).resolves.toMatchObject({
      id: 'd1',
      panels: [{ id: 'p1' }],
    });
  });

  it('异常流程：查询不存在仪表盘时报错', async () => {
    dashboardRepository.findOne.mockResolvedValue(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('正常流程：更新仪表盘基础信息', async () => {
    dashboardRepository.findOne.mockResolvedValue(dashboard);
    dashboardRepository.save.mockResolvedValue({ ...dashboard, name: 'Updated' });

    await expect(
      service.update('d1', { name: 'Updated' } as any),
    ).resolves.toMatchObject({ name: 'Updated' });
  });

  it('正常流程：删除仪表盘', async () => {
    dashboardRepository.delete.mockResolvedValue({ affected: 1 });
    await expect(service.remove('d1')).resolves.toBeUndefined();
  });

  it('正常流程：更新布局并校验面板合法性', async () => {
    panelService.findAll.mockResolvedValue([{ id: 'p1' }]);
    dashboardRepository.findOne.mockResolvedValue(dashboard);
    dashboardRepository.save.mockResolvedValue({ ...dashboard, layout: {} });

    await expect(
      service.updateLayout('d1', { lg: [{ i: 'p1' }] } as any),
    ).resolves.toMatchObject({ id: 'd1' });
  });

  it('正常流程：新增并移除仪表盘面板', async () => {
    relationRepository.delete.mockResolvedValue({ affected: 1 });
    relationRepository.save.mockResolvedValue({});

    await expect(service.addPanel('d1', 'p1')).resolves.toBeUndefined();
    await expect(service.removePanel('d1', 'p1')).resolves.toBeUndefined();
  });
});
