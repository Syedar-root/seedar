import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Datasource } from '../entities/datasource.entity';
import { DatasourceTable } from '../entities/datasource-table.entity';
import { DatasourceColumn } from '../entities/datasource-column.entity';
import { DatasourceForeignKey } from '../entities/datasource-foreign-key.entity';
import { CreateDatasourceRequest } from '../dto/create-datasource.request';
import { validateDataSourceConfig } from '../datasource.validation';
import { UpdateDatasourceRequest } from '../dto/update-datasource.request';
import { DatasourceResponse, ForeignKeyResponse } from '../dto/datasource.response';
import { ExceptionFactory } from '../../../common/exceptions';
import { LoggerService } from '@/logger/logger.service';
import { KnexConnectionFactory } from '../knex-connection.factory';
import { FieldType } from '../../dataset/dataset.types';
import { DatasourceTableService } from './datasource-table.service';
import { DatasourceColumnService } from './datasource-column.service';
import { DatasourceForeignKeyService } from './datasource-foreign-key.service';
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
    private readonly foreignKeyService: DatasourceForeignKeyService,
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

    // 获取外键关系
    this.logger.debug('开始获取外键关系', 'GetForeignKeysStart');
    const foreignKeys = await this.getForeignKeys(datasource);

    this.logger.log(
      `数据源查询成功: ${datasource.name}, 表数量: ${tables.length}, 外键数量: ${foreignKeys.length}`,
      'FindOneDatasourceSuccess',
    );

    return new DatasourceResponse(datasource, tables, foreignKeys);
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

    // 如果配置发生变化，重新获取并保存表、列和外键关系
    // if (configChanged) {
    //   this.logger.debug(
    //     '配置发生变化，重新获取表、列和外键关系',
    //     'RefreshMetadata',
    //   );
    //   await this.saveTablesAndColumns({
    //     ...savedDatasource,
    //     config: finalConfig,
    //   });
    // }

    await this.saveTablesAndColumns({
      ...savedDatasource,
      config: finalConfig,
    });

    // 返回响应（包含解密后的配置和表信息）
    savedDatasource.config = finalConfig;
    return new DatasourceResponse(
      savedDatasource,
      await this.getTables(savedDatasource),
      await this.getForeignKeys(savedDatasource),
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
   * 如果已有表信息会先删除再重新创建
   */
  private async saveTablesAndColumns(datasource: Datasource): Promise<void> {
    this.logger.debug('开始获取并保存表和列信息', 'SaveTablesAndColumnsStart');

    try {
      // 先删除已有的表和列信息（级联删除会自动删除列）
      await this.datasourceTableService.deleteByDataSourceId(datasource.id);
      this.logger.debug('已删除旧的表和列信息', 'DeleteOldTables');

      const tables = await this.getTableSchemas(datasource);

      // 第一步：创建所有表和列
      const savedTables: DatasourceTable[] = [];
      for (const table of tables) {
        // 创建表
        const savedTable = await this.datasourceTableService.create({
          dataSourceId: datasource.id,
          tableName: table.tableName,
        });
        savedTables.push(savedTable);

        // 创建列
        for (const column of table.columns) {
          await this.datasourceColumnService.create({
            tableId: savedTable.id,
            columnName: column.columnName,
            rawDataType: column.rawDataType,
            normalizedType: column.normalizedType,
            nullable: column.nullable,
            isPrimaryKey: column.isPrimaryKey,
          });
        }
      }

      // 第二步：更新每个表的 primaryFieldId
      for (const savedTable of savedTables) {
        // 获取该表的列
        const columns = await this.datasourceColumnService.findByTableId(
          savedTable.id,
        );
        // 找到主键列
        const primaryKeyColumn = columns.find((col) => col.isPrimaryKey);
        if (primaryKeyColumn) {
          await this.datasourceTableService.updatePrimaryFieldId(
            savedTable.id,
            primaryKeyColumn.id,
          );
        }
      }

      // 获取并保存外键关系
      await this.saveForeignKeys(datasource);

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
        normalizedType: FieldType;
        nullable: boolean;
        isPrimaryKey: boolean;
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
        normalizedType: FieldType;
        nullable: boolean;
        isPrimaryKey: boolean;
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
        normalizedType: FieldType;
        nullable: boolean;
        isPrimaryKey: boolean;
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
        normalizedType: FieldType;
        nullable: boolean;
        isPrimaryKey: boolean;
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
        isPrimaryKey: savedColumn.isPrimaryKey,
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
   * 获取数据源的外键关系
   */
  private async getForeignKeys(
    datasource: Datasource,
  ): Promise<ForeignKeyResponse[]> {
    this.logger.debug(
      `开始获取数据源 ${datasource.id} 的外键关系`,
      'GetForeignKeysStart',
    );

    const foreignKeys = await this.foreignKeyService.findByDataSourceId(
      datasource.id,
    );

    const result: ForeignKeyResponse[] = foreignKeys.map((fk) => ({
      fkName: fk.fkName,
      sourceTableName: fk.sourceTableName,
      sourceColumnName: fk.sourceColumnName,
      targetTableName: fk.targetTableName,
      targetColumnName: fk.targetColumnName,
    }));

    this.logger.debug(
      `外键关系获取完成，共 ${result.length} 个`,
      'GetForeignKeysCompleted',
    );

    return result;
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
      normalizedType: FieldType;
      nullable: boolean;
      isPrimaryKey: boolean;
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
      normalizedType: FieldType;
      nullable: boolean;
      isPrimaryKey: boolean;
    }>
  > {
    // 获取列信息
    const columnsResult = await knexConnection
      .select('COLUMN_NAME', 'DATA_TYPE', 'IS_NULLABLE')
      .from('information_schema.COLUMNS')
      .where('TABLE_NAME', tableName)
      .andWhere('TABLE_SCHEMA', knexConnection.client.database());

    // 获取主键列
    const primaryKeysResult = await knexConnection
      .select('kcu.COLUMN_NAME')
      .from('information_schema.KEY_COLUMN_USAGE AS kcu')
      .where('kcu.TABLE_NAME', tableName)
      .andWhere('kcu.TABLE_SCHEMA', knexConnection.client.database())
      .andWhere('kcu.CONSTRAINT_NAME', 'PRIMARY');

    const primaryKeyColumns = new Set(primaryKeysResult.map((row) => row.COLUMN_NAME));

    return columnsResult.map((row, index) => ({
      columnId: index + 1,
      columnName: row.COLUMN_NAME,
      rawDataType: row.DATA_TYPE,
      normalizedType: this.normalizeDataType(row.DATA_TYPE),
      nullable: row.IS_NULLABLE === 'YES',
      isPrimaryKey: primaryKeyColumns.has(row.COLUMN_NAME),
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
      normalizedType: FieldType;
      nullable: boolean;
      isPrimaryKey: boolean;
    }>
  > {
    // 获取列信息
    const columnsResult = await knexConnection
      .select('column_name', 'data_type', 'is_nullable')
      .from('information_schema.columns')
      .where('table_name', tableName)
      .andWhere('table_schema', 'public');

    // 获取主键列
    const primaryKeysResult = await knexConnection
      .select('att.attname as column_name')
      .from('pg_constraint as con')
      .join('pg_attribute as att', 'att.attrelid', 'con.conrelid')
      .join('pg_class as tco', 'tco.oid', 'con.conrelid')
      .where('tco.relname', tableName)
      .andWhere('con.contype', 'p')
      .andWhere('att.attnum', 'con.conkey[1]');

    const primaryKeyColumns = new Set(primaryKeysResult.map((row) => row.column_name));

    return columnsResult.map((row, index) => ({
      columnId: index + 1,
      columnName: row.column_name,
      rawDataType: row.data_type,
      normalizedType: this.normalizeDataType(row.data_type),
      nullable: row.is_nullable === 'YES',
      isPrimaryKey: primaryKeyColumns.has(row.column_name),
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
      normalizedType: FieldType;
      nullable: boolean;
      isPrimaryKey: boolean;
    }>
  > {
    const result = await knexConnection.raw(`DESCRIBE TABLE ${tableName}`);

    return result.map((row: any, index: number) => ({
      columnId: index + 1,
      columnName: row.name || row.column,
      rawDataType: row.type,
      normalizedType: this.normalizeDataType(row.type),
      nullable: !row.type?.includes('NOT NULL'),
      isPrimaryKey: row.is_in_primary_key === 1 || row.default_kind?.includes('MATERIALIZED'),
    }));
  }

  /**
   * 标准化数据类型
   */
  private normalizeDataType(rawType: string): FieldType {
    const type = rawType.toLowerCase();

    // 字符串类型
    if (
      type.includes('char') ||
      type.includes('text') ||
      type.includes('varchar')
    ) {
      return FieldType.STRING;
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
      return FieldType.NUMBER;
    }

    // 日期时间类型
    if (
      type.includes('date') ||
      type.includes('time') ||
      type.includes('timestamp')
    ) {
      return FieldType.DATE;
    }

    // 布尔类型
    if (type.includes('bool')) {
      return FieldType.BOOLEAN;
    }

    // 默认当作字符串处理
    return FieldType.STRING;
  }

  /**
   * 获取并保存数据源的外键关系
   */
  private async saveForeignKeys(datasource: Datasource): Promise<void> {
    this.logger.debug(
      `开始获取 ${datasource.type} 数据库外键关系`,
      'SaveForeignKeysStart',
    );

    try {
      const foreignKeys = await this.getForeignKeySchemas(datasource);

      if (foreignKeys.length > 0) {
        // 先删除已有的外键关系
        await this.foreignKeyService.deleteByDataSourceId(datasource.id);

        // 批量保存新的外键关系
        await this.foreignKeyService.createMany(
          foreignKeys.map((fk) => ({
            dataSourceId: datasource.id,
            fkName: fk.fkName,
            sourceTableName: fk.sourceTableName,
            sourceColumnName: fk.sourceColumnName,
            targetTableName: fk.targetTableName,
            targetColumnName: fk.targetColumnName,
          })),
        );

        this.logger.debug(
          `外键关系保存完成，共 ${foreignKeys.length} 个`,
          'SaveForeignKeysCompleted',
        );
      }
    } catch (error) {
      this.logger.warn(
        `获取或保存外键关系失败: ${error.message}`,
        'SaveForeignKeysWarning',
      );
      // 外键关系是辅助信息，获取失败不影响主流程
    }
  }

  /**
   * 从数据库获取外键关系信息
   */
  private async getForeignKeySchemas(datasource: Datasource): Promise<
    Array<{
      fkName: string;
      sourceTableName: string;
      sourceColumnName: string;
      targetTableName: string;
      targetColumnName: string;
    }>
  > {
    const knexConnection = this.getKnexConnection(datasource);

    switch (datasource.type) {
      case 'mysql':
        return await this.getMySqlForeignKeys(knexConnection);
      case 'postgres':
        return await this.getPostgresForeignKeys(knexConnection);
      case 'clickhouse':
        return await this.getClickHouseForeignKeys(knexConnection);
      default:
        this.logger.warn(
          `不支持的数据源类型: ${datasource.type}`,
          'UnsupportedDataSourceType',
        );
        return [];
    }
  }

  /**
   * 获取 MySQL 外键关系
   */
  private async getMySqlForeignKeys(
    knexConnection: knex.Knex,
  ): Promise<
    Array<{
      fkName: string;
      sourceTableName: string;
      sourceColumnName: string;
      targetTableName: string;
      targetColumnName: string;
    }>
  > {
    const database = knexConnection.client.database();

    // 使用原始 SQL 查询，避免 Knex 查询构建器的问题
    const result = await knexConnection.raw(
      `SELECT
        kc.CONSTRAINT_NAME as fk_name,
        kc.TABLE_NAME as source_table_name,
        kc.COLUMN_NAME as source_column_name,
        kc.REFERENCED_TABLE_NAME as target_table_name,
        kc.REFERENCED_COLUMN_NAME as target_column_name
      FROM information_schema.KEY_COLUMN_USAGE kc
      WHERE kc.TABLE_SCHEMA = ?
        AND kc.REFERENCED_TABLE_NAME IS NOT NULL`,
      [database],
    );

    return result[0].map((row: any) => ({
      fkName: row.fk_name,
      sourceTableName: row.source_table_name,
      sourceColumnName: row.source_column_name,
      targetTableName: row.target_table_name,
      targetColumnName: row.target_column_name,
    }));
  }

  /**
   * 获取 PostgreSQL 外键关系
   */
  private async getPostgresForeignKeys(
    knexConnection: knex.Knex,
  ): Promise<
    Array<{
      fkName: string;
      sourceTableName: string;
      sourceColumnName: string;
      targetTableName: string;
      targetColumnName: string;
    }>
  > {
    const result = await knexConnection
      .select(
        'con.conname as fk_name',
        'att.attname as source_column_name',
        'tco.relname as source_table_name',
        'fatt.attname as target_column_name',
        'ftco.relname as target_table_name',
      )
      .from('pg_constraint as con')
      .join('pg_attribute as att', 'att.attrelid', 'con.conrelid')
      .join('pg_class as tco', 'tco.oid', 'con.conrelid')
      .join('pg_attribute as fatt', 'fatt.attrelid', 'con.confrelid')
      .join('pg_class as ftco', 'ftco.oid', 'con.confrelid')
      .where('con.contype', 'f')
      .andWhere('att.attnum', 'con.conkey[1]')
      .andWhere('fatt.attnum', 'confkey[1]')
      .andWhere('tco.relname', '!=', 'datasource_tables')
      .andWhere('ftco.relname', '!=', 'datasource_tables');

    return result.map((row) => ({
      fkName: row.fk_name,
      sourceTableName: row.source_table_name,
      sourceColumnName: row.source_column_name,
      targetTableName: row.target_table_name,
      targetColumnName: row.target_column_name,
    }));
  }

  /**
   * 获取 ClickHouse 外键关系
   * ClickHouse 目前主要支持 Engine=MySQL 的外键查询
   * 标准 ClickHouse 表本身不强制外键约束
   */
  private async getClickHouseForeignKeys(
    knexConnection: knex.Knex,
  ): Promise<
    Array<{
      fkName: string;
      sourceTableName: string;
      sourceColumnName: string;
      targetTableName: string;
      targetColumnName: string;
    }>
  > {
    // ClickHouse 原生不支持查询外键关系
    // 对于使用 MySQL 引擎的表，可以尝试查询
    try {
      const result = await knexConnection
        .select(
          'name as fk_name',
          'expression',
        )
        .from('system.settings')
        .where('name', 'allow_system_settings');

      // 如果启用了系统设置，尝试查询 metadata
      // 注意：ClickHouse 本身不存储外键元数据
      this.logger.debug(
        'ClickHouse 不支持原生外键查询',
        'ClickHouseForeignKeys',
      );
    } catch (error) {
      this.logger.debug(
        `ClickHouse 外键查询失败: ${error.message}`,
        'ClickHouseForeignKeysError',
      );
    }

    return [];
  }
}
