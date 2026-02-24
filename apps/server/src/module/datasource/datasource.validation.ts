import { z } from 'zod';
import { DataSourceType, DataSourceConfig } from './datasource.types';

/**
 * Zod schemas for runtime validation
 */
export const MySqlConfigSchema = z.object({
  host: z.string().min(1, 'Host is required'),
  port: z.string().default('3306'),
  database: z.string().min(1, 'Database name is required'),
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export const CsvConfigSchema = z.object({
  filePath: z.string().min(1, 'File path is required'),
  delimiter: z.string().default(','),
  encoding: z.string().default('utf-8'),
});

export const ExcelConfigSchema = z.object({
  filePath: z.string().min(1, 'File path is required'),
  sheetName: z.string().optional(),
});

/**
 * Union schema for all config types
 */
export const DataSourceConfigSchema = z.union([
  MySqlConfigSchema,
  CsvConfigSchema,
  ExcelConfigSchema,
]);

/**
 * 根据数据源类型验证配置
 */
export function validateDataSourceConfig(
  type: DataSourceType,
  config: DataSourceConfig,
): DataSourceConfig {
  let schema: z.ZodSchema<DataSourceConfig> = DataSourceConfigSchema;

  switch (type) {
    case DataSourceType.MYSQL:
    case DataSourceType.POSTGRES:
    case DataSourceType.CLICKHOUSE:
      schema = MySqlConfigSchema;
      break;
    case DataSourceType.CSV:
      schema = CsvConfigSchema;
      break;
    case DataSourceType.EXCEL:
      throw new Error(`Unsupported data source type: ${type}`);
      break;
    default:
      return schema.parse(config);
  }
  return schema.parse(config);
}
