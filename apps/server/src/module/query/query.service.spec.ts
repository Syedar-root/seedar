import { NotFoundException } from '@nestjs/common';
import { BusinessException } from '@/common/exceptions';
import { DataSourceType } from '@/module/datasource/datasource.types';
import { QueryService } from './query.service';
import { createLoggerMock, createRepositoryMock } from '../../../test/test-utils';

const mockTransformV2 = jest.fn();
const mockSetClient = jest.fn();
const mockBuild = jest.fn();
const mockConfigDecryption = jest.fn((config) => config);

jest.mock('./dsl-transformer/dsl-transformer.v2', () => ({
  DSLTransformerV2: {
    transform: (...args: unknown[]) => mockTransformV2(...args),
  },
}));

jest.mock('@/module/datasource/service/helper', () => ({
  configDecryption: (...args: unknown[]) => mockConfigDecryption(...args),
}));

jest.mock('@metric-engine/core', () => {
  const actual = jest.requireActual('@metric-engine/core');

  class MockKnexQueryBuilder {
    build = mockBuild;
    constructor(_connection: unknown) {}
  }

  return {
    ...actual,
    DatabaseDialect: {
      setClient: (...args: unknown[]) => mockSetClient(...args),
    },
    KnexQueryBuilder: MockKnexQueryBuilder,
  };
});

describe('查询服务', () => {
  const queryRepository = createRepositoryMock();
  const datasourceRepository = createRepositoryMock();
  const datasetService = { findOne: jest.fn() } as any;
  const knexConnectionFactory = { createConnection: jest.fn() } as any;
  const configService = { get: jest.fn() } as any;
  const logger = createLoggerMock();

  let service: QueryService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new QueryService(
      queryRepository,
      datasourceRepository,
      datasetService,
      knexConnectionFactory,
      configService,
      logger,
    );
  });

  it('正常流程：创建查询并完成查改删', async () => {
    queryRepository.create.mockReturnValue({ id: 'q1', name: 'draft' });
    queryRepository.save.mockResolvedValue({ id: 'q1', name: 'saved' });
    queryRepository.find.mockResolvedValue([{ id: 'q1' }]);
    queryRepository.findOne.mockResolvedValue({ id: 'q1', name: 'saved' });
    queryRepository.delete.mockResolvedValue({ affected: 1 });

    await expect(
      service.create({ name: 'draft', datasetId: 7 } as any),
    ).resolves.toEqual({ id: 'q1', name: 'saved' });
    await expect(service.findAll()).resolves.toEqual([{ id: 'q1' }]);
    await expect(service.findAll('draft' as any)).resolves.toEqual([{ id: 'q1' }]);
    await expect(service.findOne('q1')).resolves.toEqual({
      id: 'q1',
      name: 'saved',
    });
    await expect(
      service.update('q1', { name: 'updated' } as any),
    ).resolves.toEqual({ id: 'q1', name: 'saved' });
    await expect(service.remove('q1')).resolves.toBeUndefined();
  });

  it('异常流程：查询不存在、DSL 缺失和执行失败都会抛出', async () => {
    queryRepository.findOne.mockResolvedValueOnce(null);
    await expect(service.findOne('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );

    queryRepository.findOne.mockResolvedValueOnce({ id: 'q3', datasetId: 9 });
    await expect(service.execute('q3')).rejects.toThrow(
      'Query DSL is required for execution',
    );

    queryRepository.findOne.mockResolvedValueOnce({
      id: 'q4',
      datasetId: 9,
      dsl: { datasetId: 9 },
    });
    datasetService.findOne.mockResolvedValue({
      id: 9,
      datasource: { id: 5 },
      tables: [],
      fields: [],
      metrics: [],
      joins: [],
    });
    datasourceRepository.findOne.mockResolvedValue({
      id: 5,
      type: DataSourceType.MYSQL,
      config: { host: '127.0.0.1', database: 'seedar' },
    });
    knexConnectionFactory.createConnection.mockReturnValue({
      raw: jest.fn().mockRejectedValue(new Error('boom')),
      destroy: jest.fn().mockResolvedValue(undefined),
    });
    mockTransformV2.mockReturnValue({ from: { table: 'orders', alias: 't1' } });
    mockBuild.mockReturnValue({ sql: 'select 1', bindings: [] });

    await expect(service.execute('q4')).rejects.toBeInstanceOf(BusinessException);
  });

  it('正常流程：执行已保存查询并复用缓存结果', async () => {
    const dataset = {
      id: 7,
      datasource: { id: 3, name: 'warehouse' },
      tables: [{ id: 1, tableName: 'orders' }],
      fields: [{ id: 12, tableId: 1, name: 'total', type: 'number' }],
      metrics: [],
      joins: [],
    };
    const query = {
      id: 'q1',
      datasetId: 7,
      dsl: { datasetId: 7, dimensions: [12] },
    };
    const raw = jest.fn().mockResolvedValue([[{ total: 9 }]]);
    const destroy = jest.fn().mockResolvedValue(undefined);

    queryRepository.findOne.mockResolvedValue(query);
    datasourceRepository.findOne.mockResolvedValue({
      id: 3,
      type: DataSourceType.MYSQL,
      config: { host: '127.0.0.1', database: 'seedar' },
    });
    datasetService.findOne.mockResolvedValue(dataset);
    knexConnectionFactory.createConnection.mockReturnValue({ raw, destroy });
    mockTransformV2.mockReturnValue({ from: { table: 'orders', alias: 't1' } });
    mockBuild.mockReturnValue({
      sql: 'select total from orders',
      bindings: [],
      columnMappings: [
        {
          alias: 'orders.total',
          type: 'metric',
          displayName: '总计',
          businessName: '销售额',
        },
      ],
    });

    const first = await service.execute('q1');
    const second = await service.execute('q1');

    expect(first.results).toMatchObject({
      header: ['销售额'],
      rows: [[9]],
    });
    expect(second).toEqual(first);
    expect(raw).toHaveBeenCalledTimes(1);
    expect(destroy).toHaveBeenCalledTimes(1);
  });

  it('逻辑辅助：列映射规范化会补默认值并忽略非法项', () => {
    const normalize = (service as any).normalizeColumnMappings.bind(service);

    expect(normalize(undefined)).toEqual([]);
    expect(
      normalize([
        null,
        {
          type: 'unknown',
          displayName: ' ',
          businessName: '',
        },
        {
          alias: '业务额',
          type: 'metric',
          displayName: '销售额',
          businessName: '销售额',
        },
      ]),
    ).toEqual([
      {
        alias: 'column_2',
        type: 'dimension',
        displayName: 'column_2',
        businessName: undefined,
        index: 1,
      },
      {
        alias: '业务额',
        type: 'metric',
        displayName: '销售额',
        businessName: '销售额',
        index: 2,
      },
    ]);
  });

  it('逻辑辅助：维度目标和派生维度键覆盖所有分支', () => {
    const buildDimensionTarget = (service as any).buildDimensionTarget.bind(
      service,
    );
    const buildDerivedDimensionKey = (service as any).buildDerivedDimensionKey.bind(
      service,
    );

    expect(buildDimensionTarget(12, 7, 0)).toEqual({
      kind: 'field',
      datasetId: 7,
      id: '12',
    });
    expect(buildDimensionTarget(null, 7, 1)).toEqual({
      kind: 'unknown',
      datasetId: 7,
      key: 'dimension:1',
    });
    expect(buildDimensionTarget({ fieldId: 22 } as any, 7, 2)).toEqual({
      kind: 'field',
      datasetId: 7,
      id: '22',
    });
    expect(
      buildDimensionTarget(
        { derivedKind: 'expression', alias: '利润' } as any,
        7,
        3,
      ),
    ).toEqual({
      kind: 'derived_dimension',
      datasetId: 7,
      key: 'expression:利润',
    });

    expect(buildDerivedDimensionKey({ alias: 'base' } as any, 0)).toBe(
      'base:base',
    );
    expect(
      buildDerivedDimensionKey(
        {
          derivedKind: 'time_grain',
          fieldId: 1,
          grain: 'month',
          alias: '月',
        } as any,
        0,
      ),
    ).toBe('time_grain:1:month:月');
    expect(
      buildDerivedDimensionKey(
        { derivedKind: 'bucket', fieldId: 2, alias: '分桶' } as any,
        1,
      ),
    ).toBe('bucket:2:分桶');
    expect(
      buildDerivedDimensionKey(
        { derivedKind: 'mapping', fieldId: 3, alias: '映射' } as any,
        2,
      ),
    ).toBe('mapping:3:映射');
    expect(
      buildDerivedDimensionKey(
        { derivedKind: 'expression', alias: 'expr' } as any,
        3,
      ),
    ).toBe('expression:expr');
    expect(
      buildDerivedDimensionKey(
        { derivedKind: 'custom', alias: '其他' } as any,
        4,
      ),
    ).toBe('custom:其他');
  });

  it('逻辑辅助：列映射生成会保留显式映射并在无映射时回退', () => {
    const buildColumnMappings = (service as any).buildColumnMappings.bind(
      service,
    );
    const dsl = {
      dimensions: [
        12,
        { fieldId: 22 },
        { derivedKind: 'expression', alias: 'expr', expression: 'a+b' },
      ],
      metrics: [{ id: 91 }],
      tempMetrics: [
        {
          id: 'tmp1',
          baseMetricId: 91,
          periodType: 'month_over_month',
          calculationMode: 'percentage',
        },
      ],
    };

    expect(
      buildColumnMappings(
        dsl as any,
        7,
        [
          {
            alias: 'dim_total',
            type: 'dimension',
            displayName: '总额',
            businessName: '销售总额',
            target: { kind: 'field', datasetId: 7, id: '12' },
          },
          {
            alias: 'metric_total',
            type: 'metric',
            displayName: '指标总额',
            businessName: 'GMV',
            target: { kind: 'metric', datasetId: 7, id: '91' },
          },
          {
            alias: 'expr_alias',
            type: 'dimension',
            displayName: '表达式',
            target: { kind: 'unknown', datasetId: 7 },
          },
        ],
        [{ ignored: true }],
      ),
    ).toEqual([
      {
        alias: 'dim_total',
        type: 'dimension',
        displayName: '总额',
        businessName: '销售总额',
        target: { kind: 'field', datasetId: 7, id: '12' },
        index: 0,
      },
      {
        alias: 'metric_total',
        type: 'metric',
        displayName: '指标总额',
        businessName: 'GMV',
        target: { kind: 'field', datasetId: 7, id: '22' },
        index: 1,
      },
      {
        alias: 'expr_alias',
        type: 'dimension',
        displayName: '表达式',
        target: {
          kind: 'derived_dimension',
          datasetId: 7,
          key: 'expression:expr',
        },
        index: 2,
      },
    ]);

    expect(
      buildColumnMappings(
        dsl as any,
        7,
        [],
        [{ total: 9, city: '深圳', expr: 'x', gmv: 10, mom: 0.2 }],
      ),
    ).toEqual([
      {
        alias: 'total',
        type: 'dimension',
        displayName: 'total',
        businessName: 'total',
        index: 0,
        target: { kind: 'field', datasetId: 7, id: '12' },
      },
      {
        alias: 'city',
        type: 'dimension',
        displayName: 'city',
        businessName: 'city',
        index: 1,
        target: { kind: 'field', datasetId: 7, id: '22' },
      },
      {
        alias: 'expr',
        type: 'dimension',
        displayName: 'expr',
        businessName: 'expr',
        index: 2,
        target: {
          kind: 'derived_dimension',
          datasetId: 7,
          key: 'expression:expr',
        },
      },
      {
        alias: 'gmv',
        type: 'metric',
        displayName: 'gmv',
        businessName: 'gmv',
        index: 3,
        target: { kind: 'metric', datasetId: 7, id: '91' },
      },
      {
        alias: 'mom',
        type: 'dimension',
        displayName: 'mom',
        businessName: 'mom',
        index: 4,
        target: {
          kind: 'temp_metric',
          datasetId: 7,
          id: 'tmp1',
          key: '91:month_over_month:percentage',
        },
      },
    ]);
  });

  it('执行逻辑：缓存命中、待处理执行和默认客户端都会按分支处理', async () => {
    const cachedResponse = {
      sql: 'cached',
      results: { header: ['a'], rows: [[1]] },
      executionTime: 1,
      columnMappings: [],
    };

    (service as any).executionCache.set('cached-q', {
      expiresAt: Date.now() + 1000,
      response: cachedResponse,
    });
    await expect(service.execute('cached-q')).resolves.toBe(cachedResponse);

    (service as any).pendingExecutions.set(
      'pending-q',
      Promise.resolve(cachedResponse),
    );
    await expect(service.execute('pending-q')).resolves.toEqual(cachedResponse);

    (service as any).executionCache.set('expired-q', {
      expiresAt: Date.now() - 1,
      response: cachedResponse,
    });
    expect((service as any).getCachedExecution('expired-q')).toBeUndefined();
    expect((service as any).executionCache.has('expired-q')).toBe(false);

    queryRepository.findOne.mockResolvedValue({
      id: 'q-default',
      datasetId: 7,
      dsl: {
        datasetId: 7,
        dimensions: [
          12,
          { fieldId: 22 },
          { derivedKind: 'expression', alias: 'expr', expression: 'a+b' },
        ],
        metrics: [{ id: 91 }],
        tempMetrics: [{ id: 'tmp1', baseMetricId: 91 }],
      },
    });
    datasetService.findOne.mockResolvedValue({
      id: 7,
      datasource: { id: 3, name: 'warehouse' },
      tables: [{ id: 1, tableName: 'orders' }],
      fields: [
        { id: 12, tableId: 1, name: 'total', type: 'number' },
        { id: 22, tableId: 1, name: 'city', type: 'string' },
      ],
      metrics: [{ id: 91, name: 'gmv' }],
      joins: [],
    });
    datasourceRepository.findOne.mockResolvedValue({
      id: 3,
      type: 'sqlite',
      config: { host: '127.0.0.1', database: 'demo' },
    });
    const raw = jest.fn().mockResolvedValue(null);
    const destroy = jest.fn().mockResolvedValue(undefined);
    knexConnectionFactory.createConnection.mockReturnValue({
      raw,
      destroy,
    });
    mockTransformV2.mockReturnValue({ from: { table: 'orders', alias: 't1' } });
    mockBuild.mockReturnValue({
      sql: 'select 1',
      bindings: [],
      columnMappings: undefined,
    });

    const result = await service.execute('q-default');

    expect(mockSetClient).toHaveBeenCalledWith('sqlite');
    expect(result.results).toEqual({ header: [], rows: [] });
    expect(result.columnMappings).toEqual([]);
    expect(raw).toHaveBeenCalledWith('select 1', []);
    expect(destroy).toHaveBeenCalledTimes(1);
  });
});
