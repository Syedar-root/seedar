/**
 * 数据源类型枚举
 */
export enum DataSourceType {
  MYSQL = 'mysql',
  CSV = 'csv',
  EXCEL = 'excel',
  POSTGRES = 'postgres',
  CLICKHOUSE = 'clickhouse',
}

/**
 * MySQL 数据源配置
 */
export class MySqlConfig {
  host!: string;
  port?: string = '3306';
  database!: string;
  username!: string;
  password!: string;
  iv?: string;
}

/**
 * PostgreSQL 数据源配置
 */
export class PgConfig {
  host!: string;
  port?: string = '5432';
  database!: string;
  username!: string;
  password!: string;
  iv?: string;
}

/**
 * ClickHouse 数据源配置
 */
export class ClickHouseConfig {
  host!: string;
  port?: string = '8123';
  database!: string;
  username!: string;
  password!: string;
  iv?: string;
}

/**
 * CSV 数据源配置
 */
export class CsvConfig {
  filePath!: string;
  delimiter?: string = ',';
  encoding?: string = 'utf-8';
}

/**
 * Excel 数据源配置
 */
export class ExcelConfig {
  filePath!: string;
  sheetName?: string;
}

/**
 * 数据源状态
 */
export enum DataSourceStatus {
  ACTIVE = 'active',
  INVALID = 'invalid',
  DELETED = 'deleted',
}

/**
 * 数据源配置类型
 */
export type DataSourceConfig =
  | MySqlConfig
  | PgConfig
  | ClickHouseConfig
  | CsvConfig
  | ExcelConfig
  | Record<string, any>;

/**
 * 系统内部统一字段类型
 * @deprecated 请使用 FieldType (import { FieldType } from '@/module/dataset/dataset.types')
 */
export enum NormalizedDataType {
  STRING = 'string',
  NUMBER = 'number',
  DATE = 'date',
  BOOLEAN = 'boolean',
}
