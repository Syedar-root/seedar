import { createLoggerMock, createRepositoryMock } from '../../../../test/test-utils';
import { ExceptionType } from '@/common/exceptions';
import { FieldType } from '@/module/dataset/dataset.types';
import { DataSourceType } from '../datasource.types';
import { DatasourceService } from './datasource.service';
import { validateDataSourceConfig } from '../datasource.validation';
import { configEncryption, configDecryption } from './helper';

jest.mock('../datasource.validation', () => ({
  validateDataSourceConfig: jest.fn(),
}));

jest.mock('./helper', () => ({
  configEncryption: jest.fn((config) => ({
    ...config,
    password: 'encrypted-password',
    iv: 'encrypted-iv',
  })),
  configDecryption: jest.fn((config) => ({
    ...config,
    password: 'plain-password',
  })),
}));

describe('数据源服务', () => {
  const logger = createLoggerMock();
  const datasourceRepository = createRepositoryMock();
  const knexFactory = {
    testConnection: jest.fn(),
    createConnection: jest.fn(),
  } as any;
  const configService = {
    get: jest.fn(),
  } as any;
  const datasourceTableService = {
    deleteByDataSourceId: jest.fn(),
    create: jest.fn(),
    findByDataSourceId: jest.fn(),
    updatePrimaryFieldId: jest.fn(),
  } as any;
  const datasourceColumnService = {
    create: jest.fn(),
    findByTableId: jest.fn(),
    findOne: jest.fn(),
  } as any;
  const foreignKeyService = {
    deleteByDataSourceId: jest.fn(),
    createMany: jest.fn(),
    findByDataSourceId: jest.fn(),
  } as any;

  let service: DatasourceService;

  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.clearAllMocks();

    service = new DatasourceService(
      logger,
      datasourceTableService,
      datasourceColumnService,
      foreignKeyService,
    );
    (service as any).datasourceRepository = datasourceRepository;
    (service as any).knexFactory = knexFactory;
    (service as any).configService = configService;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('正常流程：创建数据源并持久化元数据', async () => {
    (validateDataSourceConfig as jest.Mock).mockImplementation(() => undefined);
    knexFactory.testConnection.mockResolvedValue({
      success: true,
      message: 'ok',
    });
    datasourceRepository.save.mockResolvedValue({
      id: 1,
      name: 'warehouse',
      type: DataSourceType.MYSQL,
      config: { host: '127.0.0.1', database: 'seedar' },
      status: 'active',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    });
    (service as any).getTableSchemas = jest.fn().mockResolvedValue([
      {
        tableName: 'orders',
        columns: [
          {
            columnName: 'id',
            rawDataType: 'int',
            normalizedType: FieldType.NUMBER,
            nullable: false,
            isPrimaryKey: true,
          },
        ],
      },
    ]);
    (service as any).getForeignKeySchemas = jest.fn().mockResolvedValue([
      {
        fkName: 'fk_orders_users',
        sourceTableName: 'orders',
        sourceColumnName: 'user_id',
        targetTableName: 'users',
        targetColumnName: 'id',
      },
    ]);
    datasourceTableService.create.mockResolvedValue({ id: 11, tableName: 'orders' });
    datasourceColumnService.findByTableId.mockResolvedValue([
      { id: 21, isPrimaryKey: true },
    ]);

    const result = await service.create({
      name: 'warehouse',
      type: DataSourceType.MYSQL,
      config: { host: '127.0.0.1', database: 'seedar', username: 'root', password: 'pwd' },
    } as any);

    expect(result).toMatchObject({
      id: 1,
      name: 'warehouse',
      config: { host: '127.0.0.1', database: 'seedar' },
    });
    expect(knexFactory.testConnection).toHaveBeenCalledTimes(1);
    expect(datasourceTableService.deleteByDataSourceId).toHaveBeenCalledWith(1);
    expect(datasourceTableService.create).toHaveBeenCalledWith({
      dataSourceId: 1,
      tableName: 'orders',
    });
    expect(datasourceColumnService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        tableId: 11,
        columnName: 'id',
        isPrimaryKey: true,
      }),
    );
    expect(foreignKeyService.createMany).toHaveBeenCalledWith([
      expect.objectContaining({
        dataSourceId: 1,
        fkName: 'fk_orders_users',
      }),
    ]);
    expect(configEncryption).toHaveBeenCalled();
  });

  it('正常与异常：连接测试返回失败信息并处理配置错误', async () => {
    (validateDataSourceConfig as jest.Mock).mockImplementation(() => undefined);
    knexFactory.testConnection.mockResolvedValue({
      success: false,
      message: 'connect failed',
      error: new Error('boom'),
    });

    await expect(
      service.testConnection({
        type: DataSourceType.MYSQL,
        config: { host: 'x' },
      } as any),
    ).resolves.toEqual({
      success: false,
      message: 'connect failed',
    });

    (validateDataSourceConfig as jest.Mock).mockImplementation(() => {
      throw new Error('bad config');
    });
    await expect(
      service.testConnection({
        type: DataSourceType.MYSQL,
        config: { host: 'x' },
      } as any),
    ).resolves.toEqual({
      success: false,
      message: 'bad config',
    });
  });

  it('正常流程：查询读取并删除数据源', async () => {
    datasourceRepository.find.mockResolvedValue([
      {
        id: 1,
        name: 'warehouse',
        type: DataSourceType.MYSQL,
        config: { host: '127.0.0.1', database: 'seedar' },
        status: 'active',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      },
    ]);
    datasourceRepository.findOne.mockResolvedValue({
      id: 1,
      name: 'warehouse',
      type: DataSourceType.MYSQL,
      config: { host: '127.0.0.1', database: 'seedar', password: 'cipher', iv: 'iv' },
      status: 'active',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    });
    datasourceTableService.findByDataSourceId.mockResolvedValue([
      {
        id: 11,
        tableName: 'orders',
      },
    ]);
    datasourceColumnService.findByTableId.mockResolvedValue([
      {
        id: 21,
        columnName: 'id',
        rawDataType: 'int',
        normalizedType: FieldType.NUMBER,
        nullable: false,
        isPrimaryKey: true,
      },
    ]);
    foreignKeyService.findByDataSourceId.mockResolvedValue([
      {
        fkName: 'fk_orders_users',
        sourceTableName: 'orders',
        sourceColumnName: 'user_id',
        targetTableName: 'users',
        targetColumnName: 'id',
      },
    ]);

    await expect(service.findAll()).resolves.toEqual([
      expect.objectContaining({ id: 1, name: 'warehouse' }),
    ]);
    await expect(service.findOne(1)).resolves.toEqual(
      expect.objectContaining({
        id: 1,
        config: { host: '127.0.0.1', database: 'seedar' },
        tables: [
          {
            tableId: 11,
            tableName: 'orders',
            columns: [
              expect.objectContaining({
                columnId: 21,
                columnName: 'id',
              }),
            ],
          },
        ],
        foreignKeys: [
          {
            fkName: 'fk_orders_users',
            sourceTableName: 'orders',
            sourceColumnName: 'user_id',
            targetTableName: 'users',
            targetColumnName: 'id',
          },
        ],
      }),
    );

    await expect(service.remove(1)).resolves.toBeUndefined();
    expect(datasourceRepository.softDelete).toHaveBeenCalledWith(1);
  });

  it('正常流程：更新配置并刷新元数据', async () => {
    (validateDataSourceConfig as jest.Mock).mockImplementation(() => undefined);
    datasourceRepository.findOne.mockResolvedValue({
      id: 1,
      name: 'warehouse',
      type: DataSourceType.MYSQL,
      config: {
        host: '127.0.0.1',
        database: 'seedar',
        username: 'root',
        password: 'cipher',
        iv: 'iv',
      },
      status: 'active',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    });
    knexFactory.testConnection.mockResolvedValue({
      success: true,
      message: 'ok',
    });
    datasourceRepository.save.mockResolvedValue({
      id: 1,
      name: 'warehouse-updated',
      type: DataSourceType.MYSQL,
      config: { host: '127.0.0.1', database: 'seedar', password: 'encrypted-password', iv: 'encrypted-iv' },
      status: 'active',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    });
    (service as any).getTableSchemas = jest.fn().mockResolvedValue([
      {
        tableName: 'orders',
        columns: [
          {
            columnName: 'id',
            rawDataType: 'int',
            normalizedType: FieldType.NUMBER,
            nullable: false,
            isPrimaryKey: true,
          },
        ],
      },
    ]);
    (service as any).getForeignKeySchemas = jest.fn().mockResolvedValue([]);
    datasourceTableService.create.mockResolvedValue({ id: 11, tableName: 'orders' });
    datasourceColumnService.findByTableId.mockResolvedValue([
      { id: 21, isPrimaryKey: true, columnName: 'id', rawDataType: 'int', normalizedType: FieldType.NUMBER, nullable: false },
    ]);
    datasourceTableService.findByDataSourceId.mockResolvedValue([
      { id: 11, tableName: 'orders', datasetName: 'warehouse-updated' },
    ]);
    foreignKeyService.findByDataSourceId.mockResolvedValue([]);

    const result = await service.update(1, {
      name: 'warehouse-updated',
      config: { password: 'new-password' },
    } as any);

    expect(result).toMatchObject({
      id: 1,
      name: 'warehouse-updated',
      tables: [{ tableId: 11, tableName: 'orders' }],
    });
    expect(validateDataSourceConfig).toHaveBeenCalled();
    expect(knexFactory.testConnection).toHaveBeenCalled();
    expect(datasourceRepository.save).toHaveBeenCalled();
    expect(configDecryption).toHaveBeenCalled();
    expect(configEncryption).toHaveBeenCalled();
  });

  it('异常流程：不存在的数据源操作报错', async () => {
    datasourceRepository.findOne.mockResolvedValue(null);
    await expect(service.findOne(999)).rejects.toMatchObject({
      response: expect.objectContaining({
        code: ExceptionType.DATASOURCE_NOT_FOUND,
      }),
    });
    await expect(service.update(999, {} as any)).rejects.toMatchObject({
      response: expect.objectContaining({
        code: ExceptionType.DATASOURCE_NOT_FOUND,
      }),
    });
    await expect(service.remove(999)).rejects.toMatchObject({
      response: expect.objectContaining({
        code: ExceptionType.NOT_FOUND,
      }),
    });
  });
});
