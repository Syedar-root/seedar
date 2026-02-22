import { DataSourceType, DataSourceConfig } from '../datasource.types';

  MySqlConfig,
  CsvConfig,
  ExcelConfig,
 * 更新数据源请求
 * 所有字段都是可选的
 */
export class UpdateDatasourceRequest {
  name?: string;
  type?: DataSourceType;
  config?: DataSourceConfig;
}
