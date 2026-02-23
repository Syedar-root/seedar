import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Query } from './entities/query.entity';
import { CreateQueryRequest } from './dto/create-query.request';
import { UpdateQueryRequest } from './dto/update-query.request';
import { ExecuteQueryResponse } from './dto/execute-query.response';
import { QueryStatus } from './query-status.enum';
import { DSLTransformer, QueryDSL } from './dsl-transformer';
import { KnexSQLGenerator } from '@metric-engine/core';
import knex from 'knex';
import type { Knex } from 'knex';

@Injectable()
export class QueryService {
  private readonly knex: Knex;

  constructor(
    @InjectRepository(Query)
    private readonly queryRepository: Repository<Query>,
    private readonly configService: ConfigService,
  ) {
    // 初始化knex连接
    this.knex = knex({
      client: this.configService.get<string>('DB_TYPE', 'mysql'),
      connection: {
        host: this.configService.get<string>('DB_HOST', 'localhost'),
        port: this.configService.get<number>('DB_PORT', 3306),
        user: this.configService.get<string>('DB_USERNAME', 'root'),
        password: this.configService.get<string>('DB_PASSWORD', '2586603nnj'),
        database: this.configService.get<string>('DB_DATABASE', 'seedar_db'),
      },
    });
  }

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

    // 从数据库获取表结构信息（这里简化处理，实际应该从dataset模块获取）
    const tables = await this.getTablesFromDataset(query.datasetId);

    // 转换DSL
    const metricQuery = DSLTransformer.transform(query.dsl as QueryDSL, tables);

    // 初始化KnexSQLGenerator
    KnexSQLGenerator.initializeKnex({
      client: this.configService.get<string>('DB_TYPE', 'mysql'),
      connection: {
        host: this.configService.get<string>('DB_HOST', 'localhost'),
        port: this.configService.get<number>('DB_PORT', 3306),
        user: this.configService.get<string>('DB_USERNAME', 'root'),
        password: this.configService.get<string>('DB_PASSWORD', '2586603nnj'),
        database: this.configService.get<string>('DB_DATABASE', 'seedar_db'),
      },
    });

    // 生成SQL
    const startTime = Date.now();
    const sqlResult = KnexSQLGenerator.generateSQLWithBindings(metricQuery);

    // 执行SQL
    const results = await this.knex.raw(sqlResult.sql, sqlResult.bindings);
    const executionTime = Date.now() - startTime;

    // 构建响应
    return {
      sql: sqlResult.sql,
      results: results.rows || [],
      executionTime,
    };
  }

  /**
   * 从数据集获取表结构信息
   * @param datasetId 数据集ID
   * @returns 表定义数组
   */
  private async getTablesFromDataset(datasetId: number): Promise<any[]> {
    // 这里简化处理，实际应该从dataset模块获取表结构信息
    // 暂时返回空数组，实际实现需要根据datasetId查询数据库获取表结构
    return [];
  }
}
