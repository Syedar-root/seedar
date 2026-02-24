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
import { KnexSQLGenerator, Table } from '@metric-engine/core';
import { Datasource } from '@/module/datasource/entities/datasource.entity';
import { DatasetService } from '@/module/dataset/services/dataset.service';
import { KnexConnectionFactory } from '@/module/datasource/knex-connection.factory';
import { configDecryption } from '@/module/datasource/service/helper';
import { MySqlConfig } from '@/module/datasource/datasource.types';

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

  async findOne(id: number): Promise<Query> {
    const query = await this.queryRepository.findOne({ where: { id } });
    if (!query) {
      throw new NotFoundException(`Query with ID ${id} not found`);
    }
    return query;
  }

  async update(
    id: number,
    updateQueryRequest: UpdateQueryRequest,
  ): Promise<Query> {
    const query = await this.findOne(id);
    Object.assign(query, updateQueryRequest);
    return this.queryRepository.save(query);
  }

  async remove(id: number): Promise<void> {
    const result = await this.queryRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Query with ID ${id} not found`);
    }
  }

  async execute(queryId: number): Promise<ExecuteQueryResponse> {
    // 查找查询
    const query = await this.findOne(queryId);

    // 获取数据集
    const dataset = await this.datasetService.findOne(query.datasetId);
    if (!dataset || !dataset.datasource) {
      throw new NotFoundException(
        `DataSource not found for Dataset ${query.datasetId}`,
      );
    }

    // 从数据库获取原始的Datasource实体
    const datasourceEntity = await this.datasourceRepository.findOne({
      where: { id: dataset.datasource.id },
    });

    if (!datasourceEntity) {
      throw new NotFoundException(
        `DataSource with ID ${dataset.datasource.id} not found`,
      );
    }

    // 解密配置
    datasourceEntity.config = configDecryption(
      datasourceEntity.config as MySqlConfig,
      this.configService,
    );

    // 从数据库获取表结构信息
    const tables = await this.getTablesFromDataset(query.datasetId);

    // 转换DSL
    const metricQuery = DSLTransformer.transform(
      query.dsl as QueryDSL,
      tables as Table[],
    );

    // 创建动态数据库连接
    const knexConnection =
      this.knexConnectionFactory.createConnection(datasourceEntity);

    try {
      // 初始化KnexSQLGenerator
      KnexSQLGenerator.initializeKnex({
        client: datasourceEntity.type,
        connection: datasourceEntity.config,
      });

      // 生成SQL
      const startTime = Date.now();
      const sqlResult = KnexSQLGenerator.generateSQLWithBindings(metricQuery);

      // 执行SQL
      const results = await knexConnection.raw<{ rows: any[] }>(
        sqlResult.sql,
        sqlResult.bindings,
      );
      const executionTime = Date.now() - startTime;

      // 构建响应
      return {
        sql: sqlResult.sql,
        results: results.rows || [],
        executionTime,
      };
    } finally {
      // 确保连接正确关闭
      await knexConnection.destroy();
    }
  }

  /**
   * 从数据集获取表结构信息
   * @param datasetId 数据集ID
   * @returns 表定义数组
   */
  private async getTablesFromDataset(datasetId: number): Promise<any[]> {
    const dataset = await this.datasetService.findOne(datasetId);
    if (!dataset) {
      throw new NotFoundException(`Dataset with ID ${datasetId} not found`);
    }

    // 转换表结构信息为所需格式
    return dataset.tables.map((table) => ({
      name: table.tableName,
      alias: table.datasetName,
      getField: (fieldName: string) => {
        const field = dataset.fields.find(
          (f) => f.tableId === table.id && f.name === fieldName,
        );
        if (!field) return null;
        return {
          name: field.name,
          type: field.type,
          isPrimaryKey: field.isPrimaryKey,
        };
      },
    }));
  }
}
