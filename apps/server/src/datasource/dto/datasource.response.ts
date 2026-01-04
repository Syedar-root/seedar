import { DataSourceType } from '../datasource.types';

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
}
