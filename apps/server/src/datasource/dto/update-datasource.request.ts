import { DataSourceType, MySqlConfig, CsvConfig, ExcelConfig } from './create-datasource.request';

/**
 * 更新数据源请求
 * 所有字段都是可选的
 */
export class UpdateDatasourceRequest {
  name?: string;
  type?: DataSourceType;
  config?: MySqlConfig | CsvConfig | ExcelConfig | Record<string, any>;
}
