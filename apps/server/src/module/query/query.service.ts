import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Query } from './entities/query.entity';
import { CreateQueryRequest } from './dto/create-query.request';
import { UpdateQueryRequest } from './dto/update-query.request';
import {
  ExecuteQueryResponse,
  type QueryColumnMapping,
  type QueryColumnMappingTarget,
} from './dto/execute-query.response';
import { QueryStatus } from './query-status.enum';
import { DSLTransformer } from './dsl-transformer/dsl-transformer';
import {
  KnexQueryBuilder,
  QueryAdapter,
  Table,
  Field,
  DatabaseDialect,
} from '@metric-engine/core';
import { Datasource } from '@/module/datasource/entities/datasource.entity';
import { DatasetService } from '@/module/dataset/services/dataset.service';
import { KnexConnectionFactory } from '@/module/datasource/knex-connection.factory';
import { configDecryption } from '@/module/datasource/service/helper';
import { MySqlConfig } from '@/module/datasource/datasource.types';
import { DataSourceType } from '@/module/datasource/datasource.types';
import { DatasetResponse } from '@/module/dataset/dataset.types';
import { LoggerService } from '@/logger/logger.service';
import {
  DSLTransformerV2,
  QueryDSL,
  QueryDimensionDSL,
} from './dsl-transformer/dsl-transformer.v2';

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

    const knexConnection =
      this.knexConnectionFactory.createConnection(datasourceEntity);

    try {
      const knexClientMap: Record<string, string> = {
        [DataSourceType.MYSQL]: 'mysql2',
        [DataSourceType.POSTGRES]: 'pg',
        [DataSourceType.CLICKHOUSE]: 'clickhouse',
      };

      const clientType =
        knexClientMap[datasourceEntity.type] || datasourceEntity.type;

      DatabaseDialect.setClient(clientType as any);

      const startTime = Date.now();

      // v1 的使用方法
      // const metricQuery = DSLTransformer.transform(dsl, dataset, tables);
      // const querySpec = QueryAdapter.toQuerySpec(metricQuery);

      const querySpec = DSLTransformerV2.transform(dsl, dataset, tables);

      const builder = new KnexQueryBuilder(knexConnection);

      const sqlResult = builder.build(querySpec);

      const results = await knexConnection.raw<any[][]>(
        sqlResult.sql,
        sqlResult.bindings,
      );
      const executionTime = Date.now() - startTime;

      let rawRows: any[] = [];
      if (Array.isArray(results)) {
        rawRows = Array.isArray(results[0]) ? results[0] : results;
      } else if (results && typeof results === 'object' && 'rows' in results) {
        rawRows = (results as unknown as any).rows;
      } else {
        rawRows = [];
      }

      const rawColumnMappings = this.normalizeColumnMappings(
        (sqlResult as any).columnMappings,
      );
      const columnMappings = this.buildColumnMappings(
        dsl,
        datasetId,
        rawColumnMappings,
        rawRows,
      );

      let header: string[];
      let columnAliases: string[];

      if (columnMappings.length > 0) {
        header = columnMappings.map(
          (mapping) => mapping.businessName || mapping.displayName,
        );
        columnAliases = columnMappings.map((mapping) => mapping.alias);
      } else {
        header = Object.keys(rawRows[0] || {});
        columnAliases = header;
      }

      const rows = rawRows.map((row: Record<string, unknown>) => {
        return columnAliases.map((alias: string) => {
          const key = alias.split('.').at(-1) || alias;
          const value = row[key] ?? row[alias];
          return value ?? null;
        });
      });

      return {
        sql: sqlResult.sql,
        results: {
          header,
          rows,
        },
        executionTime,
        columnMappings,
      };
    } finally {
      await knexConnection.destroy();
    }
  }

  private normalizeColumnMappings(value: unknown): QueryColumnMapping[] {
    if (!Array.isArray(value)) {
      return [];
    }

    const normalized: QueryColumnMapping[] = [];

    value.forEach((item, index) => {
      if (!item || typeof item !== 'object') {
        return;
      }

      const entry = item as Record<string, unknown>;
      const alias =
        typeof entry.alias === 'string' ? entry.alias : `column_${index + 1}`;
      const type =
        entry.type === 'dimension' || entry.type === 'metric'
          ? entry.type
          : 'dimension';
      const displayName =
        typeof entry.displayName === 'string' && entry.displayName.trim()
          ? entry.displayName
          : alias;
      const businessName =
        typeof entry.businessName === 'string' && entry.businessName.trim()
          ? entry.businessName
          : undefined;

      normalized.push({
        alias,
        type,
        displayName,
        businessName,
        index,
      });
    });

    return normalized;
  }

  private buildColumnMappings(
    dsl: QueryDSL,
    datasetId: number,
    rawColumnMappings: QueryColumnMapping[],
    rawRows: unknown[],
  ): QueryColumnMapping[] {
    const expectedTargets: QueryColumnMappingTarget[] = [
      ...(dsl.dimensions || []).map((dimension, index) =>
        this.buildDimensionTarget(dimension, datasetId, index),
      ),
      ...(dsl.metrics || []).map((metric) => ({
        kind: 'metric' as const,
        datasetId,
        id: String(metric.id),
      })),
      ...(dsl.tempMetrics || []).map((tempMetric) => ({
        kind: 'temp_metric' as const,
        datasetId,
        id: tempMetric.id,
        key: `${tempMetric.baseMetricId}:${tempMetric.periodType || 'month_over_month'}:${tempMetric.calculationMode || 'percentage'}`,
      })),
    ];

    if (rawColumnMappings.length > 0) {
      return rawColumnMappings.map((mapping, index) => ({
        ...mapping,
        index,
        target: expectedTargets[index] || mapping.target,
      }));
    }

    const fallbackAliases = Object.keys((rawRows[0] as Record<string, unknown>) || {});
    return fallbackAliases.map((alias, index) => ({
      alias,
      type: expectedTargets[index]?.kind === 'metric' ? 'metric' : 'dimension',
      displayName: alias,
      businessName: alias,
      index,
      target: expectedTargets[index] || { kind: 'unknown', datasetId },
    }));
  }

  private buildDimensionTarget(
    dimension: QueryDimensionDSL,
    datasetId: number,
    index: number,
  ): QueryColumnMappingTarget {
    if (typeof dimension === 'number') {
      return { kind: 'field', datasetId, id: String(dimension) };
    }

    if (!dimension || typeof dimension !== 'object') {
      return { kind: 'unknown', datasetId, key: `dimension:${index}` };
    }

    if (!('derivedKind' in dimension) || dimension.derivedKind === undefined) {
      const fieldId =
        'fieldId' in dimension ? (dimension.fieldId as number | undefined) : undefined;
      return {
        kind: 'field',
        datasetId,
        id: fieldId !== undefined ? String(fieldId) : undefined,
      };
    }

    const key = this.buildDerivedDimensionKey(dimension, index);
    return { kind: 'derived_dimension', datasetId, key };
  }

  private buildDerivedDimensionKey(
    dimension: Exclude<QueryDimensionDSL, number>,
    index: number,
  ): string {
    const alias =
      'alias' in dimension && typeof dimension.alias === 'string'
        ? dimension.alias
        : `dimension_${index + 1}`;

    if (!('derivedKind' in dimension) || !dimension.derivedKind) {
      return `base:${alias}`;
    }

    switch (dimension.derivedKind) {
      case 'time_grain':
        return `time_grain:${dimension.fieldId}:${dimension.grain}:${alias}`;
      case 'bucket':
        return `bucket:${dimension.fieldId}:${alias}`;
      case 'mapping':
        return `mapping:${dimension.fieldId}:${alias}`;
      case 'expression':
      return `expression:${alias}`;
      default:
        return `${(dimension as { derivedKind: string }).derivedKind}:${alias}`;
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
