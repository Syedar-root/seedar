import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Datasource } from '../entities/datasource.entity';
import { CreateDatasourceRequest } from '../dto/create-datasource.request';
import { validateDataSourceConfig } from '../datasource.validation';
import { UpdateDatasourceRequest } from '../dto/update-datasource.request';
import { DatasourceResponse } from '../dto/datasource.response';
import { ExceptionFactory } from '../../common/exceptions';
import { LoggerService } from 'src/logger/logger.service';
import { KnexConnectionFactory } from '../knex-connection.factory';
import { NormalizedDataType } from '../datasource.types';
import * as knex from 'knex';

@Injectable()
export class DatasourceService {
  @InjectRepository(Datasource)
  private readonly datasourceRepository!: Repository<Datasource>;

  @Inject(KnexConnectionFactory)
  private readonly knexFactory!: KnexConnectionFactory;

  constructor(private readonly logger: LoggerService) {
    this.logger.setContext('DatasourceService');
  }

  /**
   * 创建数据源
   * @param createDatasourceRequest 创建数据源请求
   * @returns 创建数据源响应
   */
  async create(
    createDatasourceRequest: CreateDatasourceRequest,
  ): Promise<DatasourceResponse> {
    this.logger.log(
      `开始创建数据源: ${createDatasourceRequest.name} (${createDatasourceRequest.type})`,
      'CreateDatasourceStart',
    );

    // 运行时验证配置
    try {
      validateDataSourceConfig(
        createDatasourceRequest.type,
        createDatasourceRequest.config,
      );
      this.logger.debug('数据源配置验证通过', 'ConfigValidation');
    } catch (error) {
      this.logger.error(
        `数据源配置验证失败: ${error.message}`,
        error.stack,
        'ConfigValidationError',
      );
      ExceptionFactory.datasourceConfigInvalid(
        createDatasourceRequest.type,
        error.message,
      );
    }

    // TODO: 使用this.datasourceRepository实现数据源创建逻辑
    const datasource = new Datasource();
    datasource.name = createDatasourceRequest.name;
    datasource.type = createDatasourceRequest.type;
    datasource.config = createDatasourceRequest.config;

    //验证是否可以连接成功
    this.logger.debug('开始测试数据库连接', 'ConnectionTest');
    const testResult = await this.knexFactory.testConnection(datasource);

    if (!testResult.success) {
      this.logger.error(
        `数据库连接测试失败: ${testResult.message}`,
        testResult.error,
        'ConnectionTestFailed',
      );
      ExceptionFactory.datasourceConnectionFailed(
        testResult.message,
        testResult.error,
      );
    }

    this.logger.debug('数据库连接测试通过，开始保存数据源', 'SaveDatasource');
    const savedDatasource = await this.datasourceRepository.save(datasource);
    this.logger.log(
      `数据源创建成功: ${savedDatasource.name} (ID: ${savedDatasource.id})`,
      'CreateDatasourceSuccess',
    );

    return new DatasourceResponse(savedDatasource);
  }

  findAll(): Promise<DatasourceResponse[]> {
    // TODO: 使用this.datasourceRepository实现获取所有数据源逻辑
    ExceptionFactory.methodNotImplemented('findAll');
  }

  async findOne(id: number): Promise<DatasourceResponse> {
    this.logger.log(`开始查询数据源: ID ${id}`, 'FindOneDatasourceStart');

    const datasource = await this.datasourceRepository.findOne({
      where: { id },
    });

    if (!datasource) {
      this.logger.warn(`数据源未找到: ID ${id}`, 'DatasourceNotFound');
      ExceptionFactory.datasourceNotFound(id);
    }

    this.logger.debug(
      `找到数据源: ${datasource.name} (${datasource.type})`,
      'DatasourceFound',
    );

    // 获取表和列信息
    this.logger.debug('开始获取表和列信息', 'GetTablesStart');
    const tables = await this.getTables(datasource);
    this.logger.log(
      `数据源查询成功: ${datasource.name}, 表数量: ${tables.length}`,
      'FindOneDatasourceSuccess',
    );

    return new DatasourceResponse(datasource, tables);
  }

  update(
    id: number,
    updateDatasourceRequest: UpdateDatasourceRequest,
  ): Promise<DatasourceResponse> {
    // 如果提供了配置，验证配置
    if (updateDatasourceRequest.config && updateDatasourceRequest.type) {
      try {
        validateDataSourceConfig(
          updateDatasourceRequest.type,
          updateDatasourceRequest.config,
        );
      } catch (error) {
        ExceptionFactory.datasourceConfigInvalid(
          updateDatasourceRequest.type,
          error.message,
        );
      }
    }

    // TODO: 使用this.datasourceRepository实现数据源更新逻辑
    ExceptionFactory.methodNotImplemented('update');
  }

  remove(id: number): Promise<void> {
    // TODO: 使用this.datasourceRepository实现数据源删除逻辑
    ExceptionFactory.methodNotImplemented('remove');
  }

  /**
   * 获取数据源中的表信息
   */
  private async getTables(datasource: Datasource): Promise<
    Array<{
      tableName: string;
      columns: Array<{
        columnName: string;
        rawDataType: string;
        normalizedType: NormalizedDataType;
        nullable: boolean;
      }>;
    }>
  > {
    this.logger.debug(
      `开始获取 ${datasource.type} 数据库表信息`,
      'GetTablesStart',
    );
    const knexConnection = this.getKnexConnection(datasource);
    const tableNames = await this.getTableNames(datasource);
    this.logger.debug(`找到 ${tableNames.length} 个表`, 'TableNamesRetrieved');

    const tables: Array<{
      tableName: string;
      columns: Array<{
        columnName: string;
        rawDataType: string;
        normalizedType: NormalizedDataType;
        nullable: boolean;
      }>;
    }> = [];

    for (const tableName of tableNames) {
      this.logger.debug(`获取表 ${tableName} 的列信息`, 'GetTableColumns');
      const columns = await this.getTableColumns(
        datasource,
        tableName,
        knexConnection,
      );
      tables.push({
        tableName,
        columns,
      });
    }

    this.logger.debug(
      `表信息获取完成，共处理 ${tables.length} 个表`,
      'GetTablesCompleted',
    );
    return tables;
  }

  /**
   * 获取数据源连接
   */
  private getKnexConnection(datasource: Datasource): knex.Knex {
    return this.knexFactory.createConnection(datasource);
  }

  /**
   * 获取表名列表
   */
  private async getTableNames(datasource: Datasource): Promise<string[]> {
    const knexConnection = this.getKnexConnection(datasource);

    switch (datasource.type) {
      case 'mysql':
        const mysqlResult = await knexConnection.raw('SHOW TABLES');
        return mysqlResult[0].map(
          (row: any) => Object.values(row)[0] as string,
        );

      case 'postgres':
        const postgresResult = await knexConnection
          .select('table_name')
          .from('information_schema.tables')
          .where('table_schema', 'public')
          .andWhere('table_type', 'BASE TABLE');
        return postgresResult.map((row) => row.table_name);

      case 'clickhouse':
        const clickhouseResult = await knexConnection.raw('SHOW TABLES');
        return clickhouseResult.map((row: any) => row.name || row);

      default:
        throw new Error(`Unsupported data source type: ${datasource.type}`);
    }
  }

  /**
   * 获取表的列信息
   */
  private async getTableColumns(
    datasource: Datasource,
    tableName: string,
    knexConnection: knex.Knex,
  ): Promise<
    Array<{
      columnName: string;
      rawDataType: string;
      normalizedType: NormalizedDataType;
      nullable: boolean;
    }>
  > {
    switch (datasource.type) {
      case 'mysql':
        return await this.getMySqlColumns(knexConnection, tableName);
      case 'postgres':
        return await this.getPostgresColumns(knexConnection, tableName);
      case 'clickhouse':
        return await this.getClickHouseColumns(knexConnection, tableName);
      default:
        throw new Error(`Unsupported data source type: ${datasource.type}`);
    }
  }

  /**
   * 获取 MySQL 表的列信息
   */
  private async getMySqlColumns(
    knexConnection: knex.Knex,
    tableName: string,
  ): Promise<
    Array<{
      columnName: string;
      rawDataType: string;
      normalizedType: NormalizedDataType;
      nullable: boolean;
    }>
  > {
    const result = await knexConnection
      .select('COLUMN_NAME', 'DATA_TYPE', 'IS_NULLABLE')
      .from('information_schema.COLUMNS')
      .where('TABLE_NAME', tableName)
      .andWhere('TABLE_SCHEMA', knexConnection.client.database());

    return result.map((row) => ({
      columnName: row.COLUMN_NAME,
      rawDataType: row.DATA_TYPE,
      normalizedType: this.normalizeDataType(row.DATA_TYPE),
      nullable: row.IS_NULLABLE === 'YES',
    }));
  }

  /**
   * 获取 PostgreSQL 表的列信息
   */
  private async getPostgresColumns(
    knexConnection: knex.Knex,
    tableName: string,
  ): Promise<
    Array<{
      columnName: string;
      rawDataType: string;
      normalizedType: NormalizedDataType;
      nullable: boolean;
    }>
  > {
    const result = await knexConnection
      .select('column_name', 'data_type', 'is_nullable')
      .from('information_schema.columns')
      .where('table_name', tableName)
      .andWhere('table_schema', 'public');

    return result.map((row) => ({
      columnName: row.column_name,
      rawDataType: row.data_type,
      normalizedType: this.normalizeDataType(row.data_type),
      nullable: row.is_nullable === 'YES',
    }));
  }

  /**
   * 获取 ClickHouse 表的列信息
   */
  private async getClickHouseColumns(
    knexConnection: knex.Knex,
    tableName: string,
  ): Promise<
    Array<{
      columnName: string;
      rawDataType: string;
      normalizedType: NormalizedDataType;
      nullable: boolean;
    }>
  > {
    const result = await knexConnection.raw(`DESCRIBE TABLE ${tableName}`);

    return result.map((row: any) => ({
      columnName: row.name || row.column,
      rawDataType: row.type,
      normalizedType: this.normalizeDataType(row.type),
      nullable: !row.type?.includes('NOT NULL'),
    }));
  }

  /**
   * 标准化数据类型
   */
  private normalizeDataType(rawType: string): NormalizedDataType {
    const type = rawType.toLowerCase();

    // 字符串类型
    if (
      type.includes('char') ||
      type.includes('text') ||
      type.includes('varchar')
    ) {
      return NormalizedDataType.STRING;
    }

    // 数值类型
    if (
      type.includes('int') ||
      type.includes('decimal') ||
      type.includes('numeric') ||
      type.includes('float') ||
      type.includes('double') ||
      type.includes('real')
    ) {
      return NormalizedDataType.NUMBER;
    }

    // 日期时间类型
    if (
      type.includes('date') ||
      type.includes('time') ||
      type.includes('timestamp')
    ) {
      return NormalizedDataType.DATE;
    }

    // 布尔类型
    if (type.includes('bool')) {
      return NormalizedDataType.BOOLEAN;
    }

    // 默认当作字符串处理
    return NormalizedDataType.STRING;
  }
}
