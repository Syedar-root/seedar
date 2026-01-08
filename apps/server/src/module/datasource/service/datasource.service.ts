import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Datasource } from '../entities/datasource.entity';
import { DatasourceTable } from '../entities/datasource-table.entity';
import { DatasourceColumn } from '../entities/datasource-column.entity';
import { CreateDatasourceRequest } from '../dto/create-datasource.request';
import { validateDataSourceConfig } from '../datasource.validation';
import { UpdateDatasourceRequest } from '../dto/update-datasource.request';
import { DatasourceResponse } from '../dto/datasource.response';
import { ExceptionFactory } from '../../../common/exceptions';
import { LoggerService } from '@/logger/logger.service';
import { KnexConnectionFactory } from '../knex-connection.factory';
import { NormalizedDataType } from '../datasource.types';
import { DatasourceTableService } from './datasource-table.service';
import { DatasourceColumnService } from './datasource-column.service';
import * as knex from 'knex';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatasourceService {
  @InjectRepository(Datasource)
  private readonly datasourceRepository!: Repository<Datasource>;

  @Inject(KnexConnectionFactory)
  private readonly knexFactory!: KnexConnectionFactory;

  @Inject(ConfigService)
  private readonly configService!: ConfigService;

  private algorithm = 'aes-128-cbc';

  constructor(
    private readonly logger: LoggerService,
    private readonly datasourceTableService: DatasourceTableService,
    private readonly datasourceColumnService: DatasourceColumnService,
  ) {
    this.logger.setContext('DatasourceService');
  }

  private configEncryption(config: Record<string, any>) {
    // 创建配置对象的深拷贝，避免修改原对象
    const encryptedConfig = JSON.parse(JSON.stringify(config));

    console.log('password', encryptedConfig.password);
    if (encryptedConfig.password) {
      const base64Str = Buffer.from(encryptedConfig.password, 'utf8').toString(
        'base64',
      );
      const iv = encryptedConfig.iv
        ? Buffer.from(encryptedConfig.iv, 'hex')
        : crypto.randomBytes(16);
      try {
        // 获取密钥，确保为 Buffer 类型，且长度符合算法要求
        let key = this.configService.get<string>('AES_SECRET');
        if (!key) {
          throw new Error('未配置 AES_SECRET');
        }

        // 创建加密器（参数：算法、密钥、iv）
        const cipher = crypto.createCipheriv(this.algorithm, key, iv);
        // 加密（更新+最终），输出hex格式
        let encrypted = cipher.update(base64Str, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        encryptedConfig.password = encrypted;
        encryptedConfig.iv = iv.toString('hex');
        return encryptedConfig;
      } catch (error) {
        ExceptionFactory.internalError('AES加密失败', error);
      }
    }
    return encryptedConfig;
  }

  private configDecryption(config: Record<string, any>) {
    // 创建配置对象的深拷贝，避免修改原对象
    const decryptedConfig = JSON.parse(JSON.stringify(config));

    if (decryptedConfig.password && decryptedConfig.iv) {
      try {
        // 获取密钥
        let key = this.configService.get<string>('AES_SECRET');
        if (!key) {
          throw new Error('未配置 AES_SECRET');
        }

        // 将 iv 从 hex 转换为 Buffer
        const iv = Buffer.from(decryptedConfig.iv, 'hex');

        // 创建解密器（参数：算法、密钥、iv）
        const decipher = crypto.createDecipheriv(this.algorithm, key, iv);

        // 解密（更新+最终），输入hex格式，输出utf8
        let decrypted = decipher.update(
          decryptedConfig.password,
          'hex',
          'utf8',
        );
        decrypted += decipher.final('utf8');

        // 从 base64 转换回原始密码
        const originalPassword = Buffer.from(decrypted, 'base64').toString(
          'utf8',
        );
        decryptedConfig.password = originalPassword;

        return decryptedConfig;
      } catch (error) {
        ExceptionFactory.internalError('AES解密失败', error);
      }
    }
    return decryptedConfig;
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

    // config中密码加密
    datasource.config = this.configEncryption(datasource.config);

    this.logger.debug('数据库连接测试通过，开始保存数据源', 'SaveDatasource');
    const savedDatasource = await this.datasourceRepository.save(datasource);

    // 获取并存储表和列信息
    await this.saveTablesAndColumns({
      ...savedDatasource,
      config: createDatasourceRequest.config,
    });

    this.logger.log(
      `数据源创建成功: ${savedDatasource.name} (ID: ${savedDatasource.id})`,
      'CreateDatasourceSuccess',
    );

    return new DatasourceResponse(savedDatasource);
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

    // 解码datasource中的config
    datasource.config = this.configDecryption(datasource.config);

    // 获取表和列信息
    this.logger.debug('开始获取表和列信息', 'GetTablesStart');
    const tables = await this.getTables(datasource);
    this.logger.log(
      `数据源查询成功: ${datasource.name}, 表数量: ${tables.length}`,
      'FindOneDatasourceSuccess',
    );

    return new DatasourceResponse(datasource, tables);
  }

  /**
   * 修改数据源
   * @param id 数据源ID
   * @param updateDatasourceRequest 更新数据源请求
   * @returns 更新后的数据源响应
   */
  async update(
    id: number,
    updateDatasourceRequest: UpdateDatasourceRequest,
  ): Promise<DatasourceResponse> {
    this.logger.log(`开始更新数据源: ID ${id}`, 'UpdateDatasourceStart');

    // 查询现有的数据源
    const existingDatasource = await this.datasourceRepository.findOne({
      where: { id },
    });

    if (!existingDatasource) {
      this.logger.warn(`数据源未找到: ID ${id}`, 'DatasourceNotFound');
      ExceptionFactory.datasourceNotFound(id);
    }

    // 解密现有配置以便比较
    const existingDecryptedConfig = this.configDecryption(
      existingDatasource.config,
    );

    // 准备更新的数据源对象
    const updatedDatasource = { ...existingDatasource };

    // 更新基本属性
    if (updateDatasourceRequest.name !== undefined) {
      updatedDatasource.name = updateDatasourceRequest.name;
    }

    if (updateDatasourceRequest.type !== undefined) {
      updatedDatasource.type = updateDatasourceRequest.type;
    }

    // 处理配置更新
    let finalConfig = existingDecryptedConfig;
    if (updateDatasourceRequest.config !== undefined) {
      // 合并配置
      finalConfig = {
        ...existingDecryptedConfig,
        ...updateDatasourceRequest.config,
      };
      updatedDatasource.config = finalConfig;
    } else {
      // 如果没有提供新配置，使用现有解密后的配置
      updatedDatasource.config = existingDecryptedConfig;
    }

    // 验证配置（如果提供了类型）
    const configType = updateDatasourceRequest.type || existingDatasource.type;
    if (updateDatasourceRequest.config || updateDatasourceRequest.type) {
      try {
        validateDataSourceConfig(configType, finalConfig);
        this.logger.debug('数据源配置验证通过', 'ConfigValidation');
      } catch (error) {
        this.logger.error(
          `数据源配置验证失败: ${error.message}`,
          error.stack,
          'ConfigValidationError',
        );
        ExceptionFactory.datasourceConfigInvalid(configType, error.message);
      }
    }

    // 检查配置是否有变化，如果有变化则测试连接
    const configChanged =
      JSON.stringify(existingDecryptedConfig) !== JSON.stringify(finalConfig);
    if (configChanged) {
      this.logger.debug('配置发生变化，开始测试数据库连接', 'ConnectionTest');

      const testDatasource = { ...updatedDatasource, config: finalConfig };
      const testResult = await this.knexFactory.testConnection(testDatasource);

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

      this.logger.debug('数据库连接测试通过', 'ConnectionTestSuccess');
    }

    console.log('config', finalConfig);
    // 加密配置中的密码
    updatedDatasource.config = this.configEncryption(finalConfig);

    // 保存更新
    this.logger.debug('开始保存更新后的数据源', 'SaveUpdatedDatasource');
    const savedDatasource =
      await this.datasourceRepository.save(updatedDatasource);

    this.logger.log(
      `数据源更新成功: ${savedDatasource.name} (ID: ${savedDatasource.id})`,
      'UpdateDatasourceSuccess',
    );

    // 返回响应（包含解密后的配置和表信息）
    savedDatasource.config = finalConfig;
    return new DatasourceResponse(
      savedDatasource,
      await this.getTables(savedDatasource),
    );
  }

  async remove(id: number): Promise<void> {
    const datasource = await this.datasourceRepository.findOne({
      where: { id },
    });
    if (!datasource) {
      ExceptionFactory.notFound('数据源不存在');
    }

    // 使用软删除
    await this.datasourceRepository.softDelete(id);
    this.logger.log(`数据源已软删除: ${id}`);
  }

  /**
   * 保存数据源的表和列信息到数据库
   */
  private async saveTablesAndColumns(datasource: Datasource): Promise<void> {
    this.logger.debug('开始获取并保存表和列信息', 'SaveTablesAndColumnsStart');

    try {
      const tables = await this.getTableSchemas(datasource);

      for (const table of tables) {
        // 创建并保存表
        const savedTable = await this.datasourceTableService.create({
          dataSourceId: datasource.id,
          tableName: table.tableName,
        });

        // 创建并保存列
        for (const column of table.columns) {
          await this.datasourceColumnService.create({
            tableId: savedTable.id,
            columnName: column.columnName,
            rawDataType: column.rawDataType,
            normalizedType: column.normalizedType,
            nullable: column.nullable,
          });
        }
      }

      this.logger.debug(
        `表和列信息保存完成，共处理 ${tables.length} 个表`,
        'SaveTablesAndColumnsCompleted',
      );
    } catch (error) {
      this.logger.error(
        '保存表和列信息失败',
        error.stack,
        'SaveTablesAndColumnsError',
      );
      // 这里不抛出异常，因为数据源已经创建成功，只是元数据保存失败
      // 可以考虑后续通过其他方式重新获取元数据
    }
  }

  /**
   * 获取数据源中的表信息（从数据库schema）
   */
  private async getTableSchemas(datasource: Datasource): Promise<
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
      'GetTableSchemasStart',
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
      `表结构获取完成，共处理 ${tables.length} 个表`,
      'GetTableSchemasCompleted',
    );
    return tables;
  }

  /**
   * 获取数据源中的表信息（从数据库查询已保存的数据）
   */
  private async getTables(datasource: Datasource): Promise<
    Array<{
      tableId: number;
      tableName: string;
      columns: Array<{
        columnId: number;
        columnName: string;
        rawDataType: string;
        normalizedType: NormalizedDataType;
        nullable: boolean;
      }>;
    }>
  > {
    this.logger.debug(
      `开始获取数据源 ${datasource.id} 的表信息`,
      'GetTablesStart',
    );

    // 从数据库中查询已保存的表信息
    const savedTables = await this.datasourceTableService.findByDataSourceId(
      datasource.id,
    );

    const tables: Array<{
      tableId: number;
      tableName: string;
      columns: Array<{
        columnId: number;
        columnName: string;
        rawDataType: string;
        normalizedType: NormalizedDataType;
        nullable: boolean;
      }>;
    }> = [];

    for (const savedTable of savedTables) {
      this.logger.debug(
        `获取表 ${savedTable.tableName} 的列信息`,
        'GetTableColumns',
      );

      // 查询该表的列信息
      const savedColumns = await this.datasourceColumnService.findByTableId(
        savedTable.id,
      );

      const columns = savedColumns.map((savedColumn) => ({
        columnId: savedColumn.id, // 使用真实的数据库ID
        columnName: savedColumn.columnName,
        rawDataType: savedColumn.rawDataType,
        normalizedType: savedColumn.normalizedType,
        nullable: savedColumn.nullable,
      }));

      tables.push({
        tableId: savedTable.id, // 使用真实的数据库ID
        tableName: savedTable.tableName,
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
      columnId: number;
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
      columnId: number;
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

    return result.map((row, index) => ({
      columnId: index + 1,
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
      columnId: number;
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

    return result.map((row, index) => ({
      columnId: index + 1,
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
      columnId: number;
      columnName: string;
      rawDataType: string;
      normalizedType: NormalizedDataType;
      nullable: boolean;
    }>
  > {
    const result = await knexConnection.raw(`DESCRIBE TABLE ${tableName}`);

    return result.map((row: any, index: number) => ({
      columnId: index + 1,
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
