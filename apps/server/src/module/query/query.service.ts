import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Query } from './entities/query.entity';
import { CreateQueryRequest } from './dto/create-query.request';
import { UpdateQueryRequest } from './dto/update-query.request';
import { ExecuteQueryResponse } from './dto/execute-query.response';
import { QueryStatus } from './query-status.enum';
import { DSLTransformer, QueryDSL } from './dsl-transformer';
import { KnexSQLGenerator, Table, Field } from '@metric-engine/core';
import { Datasource } from '@/module/datasource/entities/datasource.entity';
import { DatasetService } from '@/module/dataset/services/dataset.service';
import { KnexConnectionFactory } from '@/module/datasource/knex-connection.factory';
import { configDecryption } from '@/module/datasource/service/helper';
import { MySqlConfig } from '@/module/datasource/datasource.types';
import { DataSourceType } from '@/module/datasource/datasource.types';
import { DatasetResponse } from '@/module/dataset/dataset.types';
import { LoggerService } from '@/logger/logger.service';

@Injectable()
export class QueryService {
  constructor(
    @InjectRepository(Query)
    private readonly queryRepository: Repository<Query>,
    @InjectRepository(Datasource)
    private readonly datasourceRepository: Repository<Datasource>,
    @Inject(DatasetService)
    private readonly datasetService: DatasetService,
    @Inject(KnexConnectionFactory)
    private readonly knexConnectionFactory: KnexConnectionFactory,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  async create(createQueryRequest: CreateQueryRequest): Promise<Query> {
    const query = this.queryRepository.create({
      ...createQueryRequest,
      status: createQueryRequest.status || QueryStatus.DRAFT,
    });
    return this.queryRepository.save(query);
  }

  async findAll(status?: QueryStatus): Promise<Query[]> {
    if (status) {
      return this.queryRepository.find({ where: { status } });
    }
    return this.queryRepository.find();
  }

  async findOne(id: string): Promise<Query> {
    const query = await this.queryRepository.findOne({ where: { id } });
    if (!query) {
      throw new NotFoundException(`Query with ID ${id} not found`);
    }
    return query;
  }

  async update(
    id: string,
    updateQueryRequest: UpdateQueryRequest,
  ): Promise<Query> {
    const query = await this.findOne(id);
    Object.assign(query, updateQueryRequest);
    return this.queryRepository.save(query);
  }

  async remove(id: string): Promise<void> {
    const result = await this.queryRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Query with ID ${id} not found`);
    }
  }

  async execute(queryId: string): Promise<ExecuteQueryResponse> {
    const query = await this.findOne(queryId);

    if (!query.dsl) {
      throw new Error('Query DSL is required for execution');
    }

    return this.executeDSL(query.dsl, query.datasetId);
  }

  async executeTemp(dsl: QueryDSL): Promise<ExecuteQueryResponse> {
    return this.executeDSL(dsl, dsl.datasetId);
  }

  private async executeDSL(
    dsl: QueryDSL,
    datasetId: number,
  ): Promise<ExecuteQueryResponse> {
    const dataset = await this.datasetService.findOne(datasetId);
    if (!dataset || !dataset.datasource) {
      throw new NotFoundException(
        `DataSource not found for Dataset ${datasetId}`,
      );
    }

    const datasourceEntity = await this.datasourceRepository.findOne({
      where: { id: dataset.datasource.id },
    });

    if (!datasourceEntity) {
      throw new NotFoundException(
        `DataSource with ID ${dataset.datasource.id} not found`,
      );
    }

    datasourceEntity.config = configDecryption(
      datasourceEntity.config as MySqlConfig,
      this.configService,
    );

    const tables = this.getTablesFromDataset(dataset);
    const metricQuery = DSLTransformer.transform(dsl, dataset, tables);
    const knexConnection =
      this.knexConnectionFactory.createConnection(datasourceEntity);

    try {
      const knexClientMap: Record<string, string> = {
        [DataSourceType.MYSQL]: 'mysql2',
        [DataSourceType.POSTGRES]: 'pg',
        [DataSourceType.CLICKHOUSE]: 'clickhouse',
      };

      KnexSQLGenerator.initializeKnex({
        client: knexClientMap[datasourceEntity.type] || datasourceEntity.type,
        connection: datasourceEntity.config,
      });

      const startTime = Date.now();
      const sqlResult = KnexSQLGenerator.generateSQLWithBindings(metricQuery);

      console.log(sqlResult);
      const results = await knexConnection.raw<any[][]>(
        sqlResult.sql,
        sqlResult.bindings,
      );
      const executionTime = Date.now() - startTime;

      let rawRows: any[] = [];
      if (Array.isArray(results)) {
        // MySQL: knex.raw() returns [rows, fields]
        rawRows = Array.isArray(results[0]) ? results[0] : results;
      } else if (results && typeof results === 'object' && 'rows' in results) {
        // PostgreSQL: knex.raw() returns { command, rowCount, rows, ... }
        rawRows = (results as unknown as any).rows;
      } else {
        rawRows = [];
      }

      const columnMappings = sqlResult.columnMappings || [];
      const header = columnMappings.map(
        (mapping) => mapping.businessName || mapping.displayName,
      );
      const columnAliases = columnMappings.map((mapping) => mapping.alias);

      const rows = rawRows.map((row: Record<string, unknown>) => {
        return columnAliases.map((alias: string) => {
          const value = row[alias];
          return typeof value === 'number' ? value : String(value);
        });
      });

      return {
        sql: sqlResult.sql,
        results: {
          header,
          rows,
        },
        executionTime,
      };
    } finally {
      await knexConnection.destroy();
    }
  }

  /**
   * 从数据集获取表结构信息
   * @param dataset 数据集对象
   * @returns 表定义数组
   */
  private getTablesFromDataset(dataset: DatasetResponse): Table[] {
    // 转换表结构信息为 Table 类型
    return dataset.tables.map((table) => {
      // 为当前表创建字段列表
      const fields = dataset.fields
        .filter((f) => f.tableId === table.id)
        .map(
          (field) =>
            new Field({
              name: field.name,
              type: field.type,
              alias: field.alias,
              description: field.description,
              businessName: field.businessName,
            }),
        );

      // 创建并返回 Table 对象
      return new Table({
        name: table.tableName,
        fields,
      });
    });
  }
}
