import { DataSourceConfig, DataSourceType } from '../datasource.types';

export class TestDatasourceConnectionRequest {
  type!: DataSourceType;
  config!: DataSourceConfig;
}
