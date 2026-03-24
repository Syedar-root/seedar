import { Field } from '../../core/field';
import { Metric, PeriodOverPeriodMetric } from '../metrics/metric-classes';
import { Table } from '../../core/table';
import { Join } from '../../core/join';
import { Filter, TimeFilter, TimeRange } from './filter';
import { AliasRegistry } from './alias-registry';

/**
 * 维度类
 * 表示查询中的分组维度
 */
export class Dimension {
  /**
   * 维度字段
   */
  public readonly field: Field;

  /**
   * 维度别名（可选）
   */
  public readonly alias?: string;

  constructor(field: Field, alias?: string) {
    this.field = field;
    this.alias = alias;
  }

  toSQL(): string {
    const fieldExpr = this.field.getFullName();
    return this.alias ? `${fieldExpr} AS ${this.alias}` : fieldExpr;
  }
}

/**
 * 查询构建器类
 * 构建完整的查询JSON Schema
 */
export class Query {
  /**
   * 主表
   */
  public readonly mainTable: Table;

  /**
   * 连接列表
   */
  public readonly joins: Join[];

  /**
   * 维度列表
   */
  public readonly dimensions: Dimension[];

  /**
   * 指标列表
   */
  public readonly metrics: Metric[];

  /**
   * 筛选条件列表
   */
  public readonly filters: Filter[];

  /**
   * 限制返回的记录数（可选）
   */
  public readonly limit?: number;

  /**
   * 偏移量（用于分页，可选）
   */
  public readonly offset?: number;

  constructor(
    mainTable: Table,
    dimensions: Dimension[],
    metrics: Metric[],
    filters: Filter[] = [],
    joins: Join[] = [],
    limit?: number,
    offset?: number
  ) {
    this.mainTable = mainTable;
    this.dimensions = dimensions;
    this.metrics = metrics;
    this.filters = filters;
    this.joins = joins;
    this.limit = limit;
    this.offset = offset;
  }

  /**
   * 添加连接
   */
  addJoin(join: Join): Query {
    return new Query(
      this.mainTable,
      this.dimensions,
      this.metrics,
      this.filters,
      [...this.joins, join],
      this.limit,
      this.offset
    );
  }

  /**
   * 设置分页参数
   * @param limit 每页记录数
   * @param offset 偏移量（可选，默认为0）
   */
  withPagination(limit: number, offset: number = 0): Query {
    return new Query(
      this.mainTable,
      this.dimensions,
      this.metrics,
      this.filters,
      this.joins,
      limit,
      offset
    );
  }

  /**
   * 设置限制条数
   * @param limit 限制的记录数
   */
  withLimit(limit: number): Query {
    return new Query(
      this.mainTable,
      this.dimensions,
      this.metrics,
      this.filters,
      this.joins,
      limit,
      this.offset
    );
  }

  /**
   * 设置偏移量
   * @param offset 偏移量
   */
  withOffset(offset: number): Query {
    return new Query(
      this.mainTable,
      this.dimensions,
      this.metrics,
      this.filters,
      this.joins,
      this.limit,
      offset
    );
  }
}

/**
 * 查询构建器类
 * 负责将Query对象转换为SQL字符串
 */
export class QueryBuilder {
  /**
   * 构建SELECT子句
   */
  private static buildSelectClause(query: Query): string {
    const parts: string[] = [];

    // 添加维度
    query.dimensions.forEach(dimension => {
      parts.push(dimension.toSQL());
    });

    // 添加指标
    query.metrics.forEach(metric => {
      parts.push(metric.toSQL());
    });

    return parts.length > 0 ? parts.join(', ') : '*';
  }

  /**
   * 构建FROM子句
   */
  private static buildFromClause(query: Query): string {
    return query.mainTable.getFullName();
  }

  /**
   * 构建JOIN子句
   */
  private static buildJoinClause(query: Query): string {
    if (query.joins.length === 0) {
      return '';
    }

    return query.joins.map(join => join.toSQL()).join('\n');
  }

  /**
   * 构建WHERE子句
   */
  private static buildWhereClause(query: Query): string {
    if (query.filters.length === 0) {
      return '';
    }

    const filterSQLs = query.filters.map(filter => filter.toSQL());
    return filterSQLs.join(' AND ');
  }

  /**
   * 构建GROUP BY子句
   */
  private static buildGroupByClause(query: Query): string {
    if (query.dimensions.length === 0) {
      return '';
    }

    const groupByFields = query.dimensions.map(dimension => dimension.field.getFullName());
    return groupByFields.join(', ');
  }

  /**
   * 生成完整的SQL查询
   */
  static build(query: Query): string {
    const selectClause = this.buildSelectClause(query);
    const fromClause = this.buildFromClause(query);
    const joinClause = this.buildJoinClause(query);
    const whereClause = this.buildWhereClause(query);
    const groupByClause = this.buildGroupByClause(query);

    let sql = `SELECT ${selectClause}\nFROM ${fromClause}`;

    if (joinClause) {
      sql += `\n${joinClause}`;
    }

    if (whereClause) {
      sql += `\nWHERE ${whereClause}`;
    }

    if (groupByClause) {
      sql += `\nGROUP BY ${groupByClause}`;
    }

    return sql;
  }

  /**
   * 为查询中的所有表分配别名
   * 在构建 Query 时调用，确保所有表都有明确的别名
   */
  static assignTableAliases(query: Query): Query {
    const aliasRegistry = new AliasRegistry();

    // 为主表分配别名
    const mainTable = query.mainTable;
    const mainAlias = aliasRegistry.ensureTableAlias(mainTable.name, undefined, mainTable.name);
    const newMainTable = mainTable.withAlias(mainAlias);

    // 为JOIN表分配别名
    const newJoins = query.joins.map(join => {
      const rightAlias = aliasRegistry.ensureTableAlias(join.rightTable.name, undefined, join.rightTable.name);
      return new Join({
        type: join.type,
        leftTable: newMainTable,
        rightTable: new Table({
          name: join.rightTable.name,
          fields: join.rightTable.fields,
          alias: rightAlias,
          description: join.rightTable.description
        }),
        conditions: join.conditions
      });
    });

    // 返回带别名的Query
    return new Query(
      newMainTable,
      query.dimensions,
      query.metrics,
      query.filters,
      newJoins,
      query.limit,
      query.offset
    );
  }
}