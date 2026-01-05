import { DataSourceType, NormalizedDataType } from '../datasource.types';
import { Datasource } from '../entities/datasource.entity';

/**
 * 数据源状态
 */
export enum DataSourceStatus {
  ACTIVE = 'active', // 可用
  INVALID = 'invalid', // 校验失败
  DELETED = 'deleted', // 逻辑删除
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
      normalizedType: NormalizedDataType;
      nullable: boolean;
    }>;
  }>;

  constructor(datasource: Datasource, tables?: Array<{
    tableName: string;
    columns: Array<{
      columnName: string;
      rawDataType: string;
      normalizedType: NormalizedDataType;
      nullable: boolean;
    }>;
  }>) {
    this.id = datasource.id;
    this.name = datasource.name;
    this.type = datasource.type;
    this.config = datasource.config;
    this.status = datasource.status;
    this.lastValidateAt = datasource.lastValidateAt;
    this.createdAt = datasource.createdAt;
    this.updatedAt = datasource.updatedAt;
    this.tables = tables;
  }
}
