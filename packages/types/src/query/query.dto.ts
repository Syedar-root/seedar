import { QueryStatus } from './query.types';

/**
 * QueryDSL 类型定义
 */
export type QueryDSL = any;

/**
 * 创建查询请求接口
 */
export interface CreateQueryRequest {
  name: string;
  datasetId: number;
  dsl?: QueryDSL;
  status?: QueryStatus;
}

/**
 * 更新查询请求接口
 */
export interface UpdateQueryRequest extends Partial<CreateQueryRequest> {}

/**
 * 执行查询请求接口
 */
export interface ExecuteQueryRequest {
  queryId: number;
}

/**
 * 执行查询响应接口
 */
export interface ExecuteQueryResponse {
  sql: string;
  results: {
    header: string[];
    rows: any[];
  };
  executionTime: number;
  columnMappings?: any[];
}
