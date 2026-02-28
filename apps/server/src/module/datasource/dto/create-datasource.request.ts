import {
  DataSourceType,
  MySqlConfig,
  CsvConfig,
  ExcelConfig,
} from '../datasource.types';

/**
 * 创建数据源请求
 */
export class CreateDatasourceRequest {
  name: string;
  type: DataSourceType;
  config: MySqlConfig | CsvConfig | ExcelConfig | Record<string, any>;
}
