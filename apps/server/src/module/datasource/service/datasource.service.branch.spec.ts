import { createLoggerMock, createRepositoryMock } from '../../../../test/test-utils';
import { FieldType } from '../../dataset/dataset.types';
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

describe('数据源服务分支覆盖', () => {
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

  const makeQuery = (result: unknown) => {
    const query: any = {
      from: jest.fn(() => query),
      where: jest.fn(() => query),
      andWhere: jest.fn(() => query),
      andWhereRaw: jest.fn(() => query),
      join: jest.fn(() => query),
      then: (resolve: (value: unknown) => unknown) =>
        Promise.resolve(result).then(resolve),
    };
    return query;
  };

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

  it('逻辑辅助：表名分支覆盖三种数据库并拒绝未知类型', async () => {
    const mysqlKnex: any = {
      raw: jest.fn().mockResolvedValue([[{ TABLE_NAME: 'orders' }, { TABLE_NAME: 'users' }], undefined]),
      client: { database: jest.fn(() => 'demo') },
    };
    const postgresKnex: any = {
      raw: jest.fn(),
      select: jest.fn().mockImplementation((...args: unknown[]) => {
        const firstArg = args[0] as string | undefined;
        if (firstArg === 'table_name') {
          return makeQuery([{ table_name: 'orders' }, { table_name: 'users' }]);
        }
        if (firstArg === 'con.conname as fk_name') {
          return makeQuery([
            {
              fk_name: 'fk_orders_users',
              source_table_name: 'orders',
              source_column_name: 'user_id',
              target_table_name: 'users',
              target_column_name: 'id',
            },
          ]);
        }
        return makeQuery([]);
      }),
      client: { database: jest.fn(() => 'demo') },
    };
    const clickhouseKnex: any = {
      raw: jest
        .fn()
        .mockResolvedValueOnce([['archive'], undefined])
        .mockResolvedValueOnce([
          {
            name: 'id',
            type: 'Int32',
            is_in_primary_key: 1,
            default_kind: '',
          },
        ]),
      select: jest.fn().mockImplementation(() => makeQuery([])),
      client: { database: jest.fn(() => 'demo') },
    };

    knexFactory.createConnection.mockImplementation((datasource: any) => {
      switch (datasource.type) {
        case DataSourceType.MYSQL:
          return mysqlKnex;
        case DataSourceType.POSTGRES:
          return postgresKnex;
        case DataSourceType.CLICKHOUSE:
          return clickhouseKnex;
        default:
          return mysqlKnex;
      }
    });

    await expect(
      (service as any).getTableNames({ type: DataSourceType.MYSQL } as any),
    ).resolves.toEqual(['orders', 'users']);
    await expect(
      (service as any).getTableNames({ type: DataSourceType.POSTGRES } as any),
    ).resolves.toEqual(['orders', 'users']);
    await expect(
      (service as any).getTableNames({ type: DataSourceType.CLICKHOUSE } as any),
    ).resolves.toEqual(['archive']);
    await expect(
      (service as any).getTableNames({ type: 'sqlite' } as any),
    ).rejects.toThrow('Unsupported data source type: sqlite');

    await expect(
      (service as any).getTableColumns(
        { type: DataSourceType.MYSQL } as any,
        'orders',
        {
          client: { database: jest.fn(() => 'demo') },
          select: jest
            .fn()
            .mockImplementationOnce(() =>
              makeQuery([
                { COLUMN_NAME: 'id', DATA_TYPE: 'int', IS_NULLABLE: 'NO' },
                { COLUMN_NAME: 'title', DATA_TYPE: 'varchar', IS_NULLABLE: 'YES' },
              ]),
            )
            .mockImplementationOnce(() => makeQuery([{ COLUMN_NAME: 'id' }])),
        } as any,
      ),
    ).resolves.toEqual([
      {
        columnId: 1,
        columnName: 'id',
        rawDataType: 'int',
        normalizedType: FieldType.NUMBER,
        nullable: false,
        isPrimaryKey: true,
      },
      {
        columnId: 2,
        columnName: 'title',
        rawDataType: 'varchar',
        normalizedType: FieldType.STRING,
        nullable: true,
        isPrimaryKey: false,
      },
    ]);
    await expect(
      (service as any).getTableColumns(
        { type: DataSourceType.POSTGRES } as any,
        'orders',
        {
          client: { database: jest.fn(() => 'demo') },
          select: jest
            .fn()
            .mockImplementationOnce(() =>
              makeQuery([
                { column_name: 'id', data_type: 'integer', is_nullable: 'NO' },
                { column_name: 'title', data_type: 'text', is_nullable: 'YES' },
              ]),
            )
            .mockImplementationOnce(() => makeQuery([{ column_name: 'id' }])),
        } as any,
      ),
    ).resolves.toEqual([
      {
        columnId: 1,
        columnName: 'id',
        rawDataType: 'integer',
        normalizedType: FieldType.NUMBER,
        nullable: false,
        isPrimaryKey: true,
      },
      {
        columnId: 2,
        columnName: 'title',
        rawDataType: 'text',
        normalizedType: FieldType.STRING,
        nullable: true,
        isPrimaryKey: false,
      },
    ]);
    await expect(
      (service as any).getTableColumns(
        { type: DataSourceType.CLICKHOUSE } as any,
        'orders',
        clickhouseKnex,
      ),
    ).resolves.toEqual([
      {
        columnId: 1,
        columnName: 'id',
        rawDataType: 'Int32',
        normalizedType: FieldType.NUMBER,
        nullable: true,
        isPrimaryKey: true,
      },
    ]);
    await expect(
      (service as any).getTableColumns(
        { type: 'sqlite' } as any,
        'orders',
        clickhouseKnex,
      ),
    ).rejects.toThrow('Unsupported data source type: sqlite');
  });

  it('逻辑辅助：数据类型归一化覆盖所有分支', () => {
    const normalizeDataType = (service as any).normalizeDataType.bind(service);

    expect(normalizeDataType('varchar(32)')).toBe(FieldType.STRING);
    expect(normalizeDataType('decimal(10,2)')).toBe(FieldType.NUMBER);
    expect(normalizeDataType('timestamp')).toBe(FieldType.DATE);
    expect(normalizeDataType('bool')).toBe(FieldType.BOOLEAN);
    expect(normalizeDataType('json')).toBe(FieldType.STRING);
  });

  it('逻辑辅助：保存表和列时会更新主键并跳过无主键表', async () => {
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
          {
            columnName: 'name',
            rawDataType: 'varchar',
            normalizedType: FieldType.STRING,
            nullable: true,
            isPrimaryKey: false,
          },
        ],
      },
      {
        tableName: 'logs',
        columns: [
          {
            columnName: 'message',
            rawDataType: 'text',
            normalizedType: FieldType.STRING,
            nullable: true,
            isPrimaryKey: false,
          },
        ],
      },
    ]);
    (service as any).getForeignKeySchemas = jest.fn().mockResolvedValue([]);
    datasourceTableService.deleteByDataSourceId.mockResolvedValue(undefined);
    datasourceTableService.create
      .mockResolvedValueOnce({ id: 11, tableName: 'orders' })
      .mockResolvedValueOnce({ id: 12, tableName: 'logs' });
    datasourceColumnService.findByTableId
      .mockResolvedValueOnce([{ id: 101, isPrimaryKey: true }])
      .mockResolvedValueOnce([{ id: 201, isPrimaryKey: false }]);
    datasourceTableService.updatePrimaryFieldId.mockResolvedValue(undefined);

    await expect(
      (service as any).saveTablesAndColumns({ id: 1, type: DataSourceType.MYSQL }),
    ).resolves.toBeUndefined();

    expect(datasourceTableService.deleteByDataSourceId).toHaveBeenCalledWith(1);
    expect(datasourceTableService.create).toHaveBeenCalledTimes(2);
    expect(datasourceTableService.updatePrimaryFieldId).toHaveBeenCalledWith(
      11,
      101,
    );
  });

  it('逻辑辅助：外键查询和保存会覆盖空结果与异常降级', async () => {
    const mysqlKnex: any = {
      raw: jest.fn().mockResolvedValue([
        [
          {
            fk_name: 'fk_orders_users',
            source_table_name: 'orders',
            source_column_name: 'user_id',
            target_table_name: 'users',
            target_column_name: 'id',
          },
        ],
        undefined,
      ]),
      client: { database: jest.fn(() => 'demo') },
    };
    const postgresKnex: any = {
      raw: jest.fn(),
      select: jest.fn().mockImplementation(() =>
        makeQuery([
          {
            fk_name: 'fk_orders_users',
            source_table_name: 'orders',
            source_column_name: 'user_id',
            target_table_name: 'users',
            target_column_name: 'id',
          },
        ]),
      ),
      client: { database: jest.fn(() => 'demo') },
    };
    const clickhouseKnex: any = {
      raw: jest.fn(),
      select: jest.fn().mockImplementation(() =>
        makeQuery([
          {
            fk_name: 'fk_orders_users',
            source_table_name: 'orders',
            source_column_name: 'user_id',
            target_table_name: 'users',
            target_column_name: 'id',
          },
        ]),
      ),
      client: { database: jest.fn(() => 'demo') },
    };

    knexFactory.createConnection.mockImplementation((datasource: any) => {
      switch (datasource.type) {
        case DataSourceType.MYSQL:
          return mysqlKnex;
        case DataSourceType.POSTGRES:
          return postgresKnex;
        case DataSourceType.CLICKHOUSE:
          return clickhouseKnex;
        default:
          return mysqlKnex;
      }
    });

    await expect(
      (service as any).getForeignKeySchemas({ type: DataSourceType.MYSQL } as any),
    ).resolves.toEqual([
      {
        fkName: 'fk_orders_users',
        sourceTableName: 'orders',
        sourceColumnName: 'user_id',
        targetTableName: 'users',
        targetColumnName: 'id',
      },
    ]);
    await expect(
      (service as any).getForeignKeySchemas({
        type: DataSourceType.POSTGRES,
      } as any),
    ).resolves.toEqual([
      {
        fkName: 'fk_orders_users',
        sourceTableName: 'orders',
        sourceColumnName: 'user_id',
        targetTableName: 'users',
        targetColumnName: 'id',
      },
    ]);
    await expect(
      (service as any).getForeignKeySchemas({
        type: DataSourceType.CLICKHOUSE,
      } as any),
    ).resolves.toEqual([
      {
        fkName: 'fk_orders_users',
        sourceTableName: 'orders',
        sourceColumnName: 'user_id',
        targetTableName: 'users',
        targetColumnName: 'id',
      },
    ]);
    await expect(
      (service as any).getForeignKeySchemas({ type: 'sqlite' } as any),
    ).resolves.toEqual([]);

    (service as any).getForeignKeySchemas = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error('boom'));
    await expect(
      (service as any).saveForeignKeys({ id: 8, type: DataSourceType.MYSQL }),
    ).resolves.toBeUndefined();
    await expect(
      (service as any).saveForeignKeys({ id: 8, type: DataSourceType.MYSQL }),
    ).resolves.toBeUndefined();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('boom'),
      'SaveForeignKeysWarning',
    );
  });

  it('逻辑辅助：更新时配置未变化不会重复测试连接', async () => {
    (validateDataSourceConfig as jest.Mock).mockImplementation(() => undefined);
    datasourceRepository.findOne.mockResolvedValue({
      id: 1,
      name: 'warehouse',
      type: DataSourceType.MYSQL,
      config: {
        host: '127.0.0.1',
        database: 'seedar',
        password: 'cipher',
        iv: 'iv',
      },
      status: 'active',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    });
    datasourceRepository.save.mockResolvedValue({
      id: 1,
      name: 'warehouse-renamed',
      type: DataSourceType.MYSQL,
      config: {
        host: '127.0.0.1',
        database: 'seedar',
        password: 'encrypted-password',
        iv: 'encrypted-iv',
      },
      status: 'active',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
    });
    (service as any).getTableSchemas = jest.fn().mockResolvedValue([]);
    (service as any).getForeignKeySchemas = jest.fn().mockResolvedValue([]);
    datasourceTableService.findByDataSourceId.mockResolvedValue([]);
    datasourceColumnService.findByTableId.mockResolvedValue([]);
    foreignKeyService.findByDataSourceId.mockResolvedValue([]);

    await expect(
      service.update(1, {
        name: 'warehouse-renamed',
      } as any),
    ).resolves.toMatchObject({
      id: 1,
      name: 'warehouse-renamed',
    });

    expect(knexFactory.testConnection).not.toHaveBeenCalled();
    expect(configEncryption).toHaveBeenCalled();
    expect(datasourceTableService.deleteByDataSourceId).toHaveBeenCalledWith(1);
    expect(configDecryption).toHaveBeenCalled();
  });
});
