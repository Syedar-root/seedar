import {
  DataSourceType,
  MySqlConfig,
  CsvConfig,
  ExcelConfig,
  DataSourceConfig,
  DataSourceStatus,
} from './datasource.types';

/**
 * 创建数据源请求
 */
export class CreateDatasourceRequest {
  name: string;
  type: DataSourceType;
  config: MySqlConfig | CsvConfig | ExcelConfig | Record<string, any>;
}

/**
 * 更新数据源请求
 * 所有字段都是可选的
 */
export class UpdateDatasourceRequest {
  name?: string;
  type?: DataSourceType;
  config?: DataSourceConfig;
}

/**
 * 外键关系响应
 */
export interface ForeignKeyResponse {
  fkName: string;
  sourceTableName: string;
  sourceColumnName: string;
  targetTableName: string;
  targetColumnName: string;
}

/**
 * 数据源响应
 */
export class DatasourceResponse {
  id: number;
  name: string;
  type: DataSourceType;
  config: Record<string, any>;
  status: DataSourceStatus;
  lastValidateAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  tables?: Array<{
    tableName: string;
    columns: Array<{
      columnName: string;
      rawDataType: string;
      normalizedType: any;
      nullable: boolean;
      isPrimaryKey: boolean;
    }>;
  }>;
  foreignKeys?: ForeignKeyResponse[];
}
