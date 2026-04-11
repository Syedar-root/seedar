import { PeriodOverPeriodType, PeriodCalculationMode } from "../dataset";
import { QueryStatus } from "./query.types";

/**
 * QueryDSL 类型定义
 */
export interface QueryDSL {
  datasetId: number;
  tableId: number;
  dimensions?: Array<number | { fieldId: number; alias?: string }>;
  metrics?: Array<{
    id: number;
    alias?: string;
  }>;
  filters?: Array<{
    fieldId: number;
    op: string;
    value?: any;
    raw?: boolean;
  }>;
  tempMetrics?: Array<{
    id: string;
    type?: "period_comparison";
    alias?: string;
    businessName?: string;
    baseMetricId: number;
    timeFieldId?: number;
    periodType?: PeriodOverPeriodType;
    calculationMode?: PeriodCalculationMode;
  }>;
  limit?: number;
  offset?: number;
}

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
  queryId: string;
}

/**
 * 执行临时查询请求接口
 */
export interface ExecuteTempQueryRequest {
  dsl: QueryDSL;
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
