import type { QueryDSL } from "./query.dto";

/**
 * 查询状态枚�?
 * - DRAFT: 草稿状�?
 * - ACTIVE: 使用状�?
 * - STOPPED: 停止状�?
 */
export enum QueryStatus {
  DRAFT = "draft",
  ACTIVE = "active",
  STOPPED = "stopped",
}

/**
 * 查询响应接口
 */
export interface QueryResponse {
  id: string;
  name: string;
  datasetId: number;
  dsl: QueryDSL | null;
  status: QueryStatus;
  createdAt: Date;
  updatedAt: Date;
}
