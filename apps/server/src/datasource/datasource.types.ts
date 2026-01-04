/**
 * 数据源类型枚举
 */
export enum DataSourceType {
  MYSQL = 'mysql',
  CSV = 'csv',
  EXCEL = 'excel',
  // 预留扩展
  POSTGRES = 'postgres',
  CLICKHOUSE = 'clickhouse',
}

/**
 * MySQL 数据源配置
 */
export class MySqlConfig {
  host: string;
  port?: string = '3306';
  database: string;
  username: string;
  password: string;
}

/**
 * CSV 数据源配置
 */
export class CsvConfig {
  filePath: string;
  delimiter?: string = ',';
  encoding?: string = 'utf-8';
}

/**
 * Excel 数据源配置
 */
export class ExcelConfig {
  filePath: string;
  sheetName?: string;
}
