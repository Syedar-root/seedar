import { DataSourceType, MySqlConfig } from '../datasource.types';
import { Datasource } from '../entities/datasource.entity';
import { FieldType } from '@/module/dataset/dataset.types';

/**
 * 数据源状态
 */
export enum DataSourceStatus {
  ACTIVE = 'active', // 可用
  INVALID = 'invalid', // 校验失败
  DELETED = 'deleted', // 逻辑删除
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
      columnId?: number;
      columnName: string;
      rawDataType: string;
      normalizedType: FieldType;
      nullable: boolean;
      isPrimaryKey: boolean;
    }>;
  }>;
  foreignKeys?: ForeignKeyResponse[];

  constructor(
    datasource: Datasource,
    tables?: Array<{
      tableName: string;
      columns: Array<{
        columnName: string;
        rawDataType: string;
        normalizedType: FieldType;
        nullable: boolean;
        isPrimaryKey: boolean;
        columnId?: number;
      }>;
    }>,
    foreignKeys?: ForeignKeyResponse[],
  ) {
    this.id = datasource.id;
    this.name = datasource.name;
    this.type = datasource.type;

    const {
      password: _password,
      iv: _iv,
      ...restConfig
    } = datasource.config as MySqlConfig;

    this.config = restConfig;
    this.status = datasource.status;
    this.lastValidateAt = datasource.lastValidateAt;
    this.createdAt = datasource.createdAt;
    this.updatedAt = datasource.updatedAt;
    this.tables = tables;
    this.foreignKeys = foreignKeys;
  }
}
