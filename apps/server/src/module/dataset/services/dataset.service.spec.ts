import { createLoggerMock, createRepositoryMock } from '../../../../test/test-utils';
import { ExceptionType } from '@/common/exceptions';
import { DatasetStatus, DatasetType, FieldType, JoinType, MetricType } from '../dataset.types';
import { DatasetService } from './dataset.service';
import {
  fieldManager,
  metricManager,
  joinManager,
  tableManager,
} from './helper/dataset.helper';

jest.mock('./helper/dataset.helper', () => ({
  fieldManager: { handle: jest.fn() },
  metricManager: { handle: jest.fn() },
  joinManager: { handle: jest.fn() },
  tableManager: { handle: jest.fn() },
}));

describe('数据集服务', () => {
  const logger = createLoggerMock();
  const datasetRepository = createRepositoryMock();
  const datasetTableRepository = createRepositoryMock();
  const datasetJoinRepository = createRepositoryMock();
  const datasetFieldRepository = createRepositoryMock();
  const datasetMetricRepository = createRepositoryMock();
  const queryRepository = createRepositoryMock();
  const datasourceService = { findOne: jest.fn() } as any;
  const datasourceForeignKeyService = {
    findByDataSourceId: jest.fn(),
  } as any;
  const datasourceTableService = {
    findOne: jest.fn(),
    findByDataSourceId: jest.fn(),
    create: jest.fn(),
    deleteByDataSourceId: jest.fn(),
    updatePrimaryFieldId: jest.fn(),
  } as any;
  const datasourceColumnService = {
    findOne: jest.fn(),
    findByTableId: jest.fn(),
    create: jest.fn(),
  } as any;

  let service: DatasetService;

  const createTxManager = () => {
    let nextId = 1;
    return {
      create: jest.fn((_entity: unknown, value: any) => ({ ...value })),
      save: jest.fn(async (value: any) => {
        const assignId = (item: any) => {
          if (item && item.id == null) {
            item.id = nextId++;
          }
          return item;
        };
        if (Array.isArray(value)) {
          return value.map(assignId);
        }
        return assignId(value);
      }),
      update: jest.fn(async () => undefined),
      delete: jest.fn(async () => undefined),
      findOne: jest.fn(),
      find: jest.fn(),
    };
  };

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.clearAllMocks();

    service = new DatasetService(logger);
    (service as any).datasetRepository = datasetRepository;
    (service as any).datasetTableRepository = datasetTableRepository;
    (service as any).datasetJoinRepository = datasetJoinRepository;
    (service as any).datasetFieldRepository = datasetFieldRepository;
    (service as any).datasetMetricRepository = datasetMetricRepository;
    (service as any).queryRepository = queryRepository;
    (service as any).datasourceService = datasourceService;
    (service as any).datasourceForeignKeyService = datasourceForeignKeyService;
    (service as any).datasourceTableService = datasourceTableService;
    (service as any).datasourceColumnService = datasourceColumnService;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('正常流程：创建数据集并落表字段关联', async () => {
    const txManager = createTxManager();
    datasetRepository.manager.transaction.mockImplementation(async (cb: any) =>
      cb(txManager),
    );

    datasourceService.findOne.mockResolvedValue({ id: 10 });
    datasourceTableService.findOne.mockImplementation(async (id: number) => {
      if (id === 1) {
        return { id: 1, tableName: 'orders' };
      }
      if (id === 2) {
        return { id: 2, tableName: 'users' };
      }
      return null;
    });
    datasourceColumnService.findByTableId.mockImplementation(async (tableId: number) =>
      tableId === 1
        ? [
            { id: 101, isPrimaryKey: true },
            { id: 102, isPrimaryKey: false },
          ]
        : [{ id: 201, isPrimaryKey: true }],
    );
    datasourceColumnService.findOne.mockImplementation(async (id: number) =>
      id === 101
        ? { id: 101, normalizedType: FieldType.NUMBER, isPrimaryKey: true }
        : { id: 201, normalizedType: FieldType.STRING, isPrimaryKey: true },
    );

    const result = await service.create({
      datasourceId: 10,
      datasourceTableIds: [1, 2],
      mainTableId: 1,
      name: 'demo',
      description: 'desc',
      fields: [
        { tableId: 1, dataSourceColumnId: 101, businessName: '订单总额' },
        { tableId: 2, dataSourceColumnId: 201, businessName: '用户地区' },
      ],
      joins: [
        {
          leftTableId: 1,
          rightTableId: 2,
          leftColumnId: 101,
          rightColumnId: 201,
          joinType: JoinType.LEFT,
        },
      ],
    } as any);

    expect(result).toMatchObject({ id: 1, name: 'demo' });
    expect(txManager.create).toHaveBeenCalled();
    expect(txManager.update).toHaveBeenCalledWith(
      expect.anything(),
      1,
      { mainTableId: 2 },
    );
    expect(txManager.save).toHaveBeenCalledTimes(4);
  });

  it('异常流程：数据源或数据表缺失时拒绝创建', async () => {
    datasourceService.findOne.mockResolvedValue(null);
    await expect(
      service.create({
        datasourceId: 99,
        datasourceTableIds: [1],
        name: 'broken',
        fields: [{ tableId: 1, dataSourceColumnId: 1 }],
      } as any),
    ).rejects.toThrow();

    datasourceService.findOne.mockResolvedValue({ id: 10 });
    datasourceTableService.findOne.mockResolvedValue({ id: 1, tableName: 't1' });
    await expect(
      service.create({
        datasourceId: 10,
        datasourceTableIds: [1],
        name: 'broken',
        fields: [{ tableId: 1, dataSourceColumnId: 1 }],
      } as any),
    ).rejects.toThrow();
  });

  it('正常流程：返回数据集详情列表与单项视图', async () => {
    datasetRepository.find.mockResolvedValue([
      {
        id: 1,
        name: 'demo',
        description: 'desc',
        type: DatasetType.SEMANTIC,
        status: DatasetStatus.ACTIVE,
        mainTableId: 11,
        datasource: { id: 10, name: 'ds', type: 'mysql' },
        mainTable: { id: 11, tableName: 'orders', datasetName: 'demo' },
      },
    ]);
    datasetTableRepository.find.mockResolvedValue([
      {
        id: 11,
        datasetId: 1,
        datasourceTableId: 1,
        tableName: 'orders',
        datasetName: 'demo',
        primaryFieldId: 101,
      },
    ]);
    datasetFieldRepository.find.mockResolvedValue([
      {
        id: 101,
        dataSetId: 1,
        name: 'total',
        alias: 'total',
        type: FieldType.NUMBER,
        description: '订单金额',
        businessName: '订单总额',
        isPrimaryKey: true,
        tableId: 11,
        table: { tableName: 'orders' },
        dataSourceColumnId: 1001,
      },
    ]);
    datasetMetricRepository.find.mockResolvedValue([
      {
        id: 201,
        dataSetId: 1,
        name: 'gmv',
        alias: 'gmv',
        metricType: MetricType.AGGREGATE,
        distinct: false,
        dataSourceColumnId: 1001,
        dataSourceColumn: { columnName: 'total' },
        aggregateFunction: 'sum',
        sourceMetricId: undefined,
        baseMetricId: undefined,
      },
    ]);
    datasetJoinRepository.find.mockResolvedValue([
      {
        id: 301,
        datasetId: 1,
        leftTableId: 11,
        rightTableId: 12,
        leftField: 'user_id',
        rightField: 'id',
        joinType: JoinType.INNER,
      },
    ]);
    datasetRepository.findOne.mockResolvedValue({
      id: 1,
      name: 'demo',
      description: 'desc',
      type: DatasetType.SEMANTIC,
      status: DatasetStatus.ACTIVE,
      mainTableId: 11,
      datasource: { id: 10, name: 'ds', type: 'mysql' },
      mainTable: { id: 11, tableName: 'orders', datasetName: 'demo' },
    });

    const details = await service.findAllWithDetails();
    expect(details[0]).toMatchObject({
      id: 1,
      datasource: { id: 10, name: 'ds', type: 'mysql' },
      tables: [
        {
          id: 11,
          datasourceTableId: 1,
          tableName: 'orders',
          datasetName: 'demo',
          primaryFieldId: 101,
        },
      ],
      fields: [
        {
          id: 101,
          name: 'total',
          tableName: 'orders',
          datasourceColumnId: 1001,
        },
      ],
      metrics: [
        {
          id: 201,
          dataSourceColumnName: 'total',
          metricType: MetricType.AGGREGATE,
        },
      ],
      joins: [
        {
          id: 301,
          joinType: JoinType.INNER,
        },
      ],
    });

    const single = await service.findOne(1);
    expect(single).toMatchObject({
      id: 1,
      mainTable: { id: 11, tableName: 'orders', datasetName: 'demo' },
    });
  });

  it('正常流程：更新数据集元信息并委托子动作', async () => {
    datasetRepository.findOne.mockResolvedValue({
      id: 1,
      name: 'demo',
      description: 'desc',
      type: DatasetType.SEMANTIC,
      status: DatasetStatus.ACTIVE,
    });
    datasetRepository.update.mockResolvedValue(undefined);
    datasetRepository.manager.transaction.mockImplementation(async (cb: any) =>
      cb({}),
    );
    datasetRepository.findOne.mockResolvedValueOnce({
      id: 1,
      name: 'demo',
      description: 'desc',
      type: DatasetType.SEMANTIC,
      status: DatasetStatus.ACTIVE,
    });
    datasetRepository.findOne.mockResolvedValue({
      id: 1,
      name: 'demo-updated',
      description: 'desc-updated',
      type: DatasetType.SEMANTIC,
      status: DatasetStatus.ACTIVE,
      datasource: { id: 10, name: 'ds', type: 'mysql' },
    });
    datasetTableRepository.find.mockResolvedValue([]);
    datasetFieldRepository.find.mockResolvedValue([]);
    datasetMetricRepository.find.mockResolvedValue([]);
    datasetJoinRepository.find.mockResolvedValue([]);

    (fieldManager.handle as jest.Mock).mockResolvedValue(undefined);
    (metricManager.handle as jest.Mock).mockResolvedValue(undefined);
    (joinManager.handle as jest.Mock).mockResolvedValue(undefined);
    (tableManager.handle as jest.Mock).mockResolvedValue(undefined);

    await expect(
      service.update({
        dataSetId: 1,
        name: 'demo-updated',
        description: 'desc-updated',
        fields: [{ id: 11 }],
        metrics: [{ id: 21 }],
        joins: [{ id: 31 }],
        tables: [{ id: 41 }],
      } as any),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 1,
        name: 'demo-updated',
      }),
    );

    expect(datasetRepository.update).toHaveBeenCalledWith(1, {
      name: 'demo-updated',
      description: 'desc-updated',
    });
    expect(fieldManager.handle).toHaveBeenCalled();
    expect(metricManager.handle).toHaveBeenCalled();
    expect(joinManager.handle).toHaveBeenCalled();
    expect(tableManager.handle).toHaveBeenCalled();
  });

  it('异常与正常：存在依赖时拒绝删除并支持软删除', async () => {
    datasetRepository.findOne.mockResolvedValue({
      id: 1,
      status: DatasetStatus.ACTIVE,
    });
    queryRepository.find.mockResolvedValue([
      { id: 9, name: 'q1' },
      { id: 10, name: 'q2' },
    ]);

    await expect(service.remove(1)).rejects.toMatchObject({
      response: expect.objectContaining({
        code: ExceptionType.BAD_REQUEST,
      }),
    });

    queryRepository.find.mockResolvedValue([]);
    datasetRepository.update.mockResolvedValue(undefined);
    await expect(service.remove(1)).resolves.toBeUndefined();
    expect(datasetRepository.update).toHaveBeenCalledWith(1, {
      status: DatasetStatus.DELETED,
    });
    expect(logger.log).toHaveBeenCalled();
  });
});
