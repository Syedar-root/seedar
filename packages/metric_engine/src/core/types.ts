/**
 * 数据库类型
 */
export type DatabaseClient = 'mysql2' | 'pg' | 'postgres' | 'postgresql' | 'clickhouse' | 'sqlite3' | 'oracledb' | 'mssql';

/**
 * 数据库方言配置（静态全局配置）
 */
export class DatabaseDialect {
  private static currentClient: DatabaseClient = 'mysql2';

  static setClient(client: DatabaseClient): void {
    this.currentClient = client;
  }

  static getClient(): DatabaseClient {
    return this.currentClient;
  }

  static isPostgres(): boolean {
    return this.currentClient === 'pg' || this.currentClient === 'postgres' || this.currentClient === 'postgresql';
  }

  static isMySQL(): boolean {
    return this.currentClient === 'mysql2';
  }

  static isClickHouse(): boolean {
    return this.currentClient === 'clickhouse';
  }
}

/**
 * 字段数据类型枚举
 */
export enum FieldType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  DATETIME = 'datetime',
  DECIMAL = 'decimal'
}

/**
 * 聚合函数类型
 */
export enum AggregateFunction {
  COUNT = 'count',
  SUM = 'sum',
  AVG = 'avg',
  MAX = 'max',
  MIN = 'min',
  DISTINCT_COUNT = 'distinct_count'
}

/**
 * 运算符类型
 */
export enum Operator {
  // 比较运算符
  EQUALS = '=',
  NOT_EQUALS = '!=',
  GREATER_THAN = '>',
  LESS_THAN = '<',
  GREATER_EQUAL = '>=',
  LESS_EQUAL = '<=',
  LIKE = 'like',
  IN = 'in',
  NOT_IN = 'not_in',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null',

  // 逻辑运算符
  AND = 'and',
  OR = 'or',

  // 算术运算符
  PLUS = '+',
  MINUS = '-',
  MULTIPLY = '*',
  DIVIDE = '/'
}

/**
 * 连接类型
 */
export enum JoinType {
  INNER = 'inner',
  LEFT = 'left',
  RIGHT = 'right',
  FULL = 'full'
}

/**
 * 时间周期类型
 */
export enum TimePeriod {
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year'
}

/**
 * 同环比计算类型
 */
export enum PeriodOverPeriodType {
  MONTH_OVER_MONTH = 'mom',        // 环比（月）
  YEAR_OVER_YEAR = 'yoy',          // 同比
  WEEK_OVER_WEEK = 'wow',          // 周环比
  QUARTER_OVER_QUARTER = 'qoq',    // 季环比
  DAY_OVER_DAY = 'dod'             // 日环比
}

/**
 * 同环比计算模式
 */
export enum PeriodCalculationMode {
  PERCENTAGE = 'percentage',       // 百分比变化
  ABSOLUTE = 'absolute',          // 绝对值变化
  BOTH = 'both'                   // 同时显示绝对值和百分比
}