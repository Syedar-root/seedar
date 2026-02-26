import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Query } from './entities/query.entity';
import { CreateQueryRequest } from './dto/create-query.request';
import { UpdateQueryRequest } from './dto/update-query.request';
import { ExecuteQueryResponse } from './dto/execute-query.response';
import { QueryStatus } from './query-status.enum';
import { DSLTransformer } from './dsl-transformer';
import { KnexSQLGenerator, Table, Field } from '@metric-engine/core';
import { Datasource } from '@/module/datasource/entities/datasource.entity';
import { DatasetService } from '@/module/dataset/services/dataset.service';
import { KnexConnectionFactory } from '@/module/datasource/knex-connection.factory';
import { configDecryption } from '@/module/datasource/service/helper';
import { MySqlConfig } from '@/module/datasource/datasource.types';
import { DataSourceType } from '@/module/datasource/datasource.types';
import { DatasetResponse } from '@/module/dataset/dataset.types';
import { console } from 'inspector';

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

    // 从数据集获取表结构信息
    const tables = this.getTablesFromDataset(dataset);

    // 检查 DSL 是否存在
    if (!query.dsl) {
      throw new Error('Query DSL is required for execution');
    }

    // 转换DSL
    const metricQuery = DSLTransformer.transform(query.dsl, dataset, tables);

    // 创建动态数据库连接
    const knexConnection =
      this.knexConnectionFactory.createConnection(datasourceEntity);

    try {
      // 初始化KnexSQLGenerator
      KnexSQLGenerator.initializeKnex({
        client:
          datasourceEntity.type === DataSourceType.MYSQL
            ? 'mysql2'
            : datasourceEntity.type,
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

      console.log('hcs result', results);

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
