/**
 * 查询状态枚举
 * - DRAFT: 草稿状态
 * - ACTIVE: 使用状态
 * - STOPPED: 停止状态
 */
export enum QueryStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  STOPPED = 'stopped',
}

/**
 * 查询响应接口
 */
export interface QueryResponse {
  id: number;
  name: string;
  datasetId: number;
  dsl: any;
  status: QueryStatus;
  createdAt: Date;
  updatedAt: Date;
}
