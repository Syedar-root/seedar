import { PeriodOverPeriodType, PeriodCalculationMode } from "../dataset";
import { QueryStatus } from "./query.types";

/**
 * QueryDSL 类型定义
 */
export type TimeGrain = "day" | "week" | "month" | "quarter" | "year";

export type BaseDimensionDSL = {
  fieldId: number;
  alias?: string;
  derivedKind?: undefined;
};

export type TimeGrainDimensionDSL = {
  derivedKind: "time_grain";
  fieldId: number;
  grain: TimeGrain;
  alias: string;
};

export type BucketRangeDSL = {
  lt: number;
  label: string;
};

export type BucketDimensionDSL = {
  derivedKind: "bucket";
  fieldId: number;
  ranges: BucketRangeDSL[];
  defaultLabel?: string;
  alias: string;
};

export type MappingRuleDSL = {
  in: Array<string | number | boolean>;
  label: string;
};

export type MappingDimensionDSL = {
  derivedKind: "mapping";
  fieldId: number;
  rules: MappingRuleDSL[];
  defaultLabel?: string;
  alias: string;
};

export type ExpressionDimensionDSL = {
  derivedKind: "expression";
  expression: string;
  alias: string;
};

export type DerivedDimensionDSL =
  | TimeGrainDimensionDSL
  | BucketDimensionDSL
  | MappingDimensionDSL
  | ExpressionDimensionDSL;

export type QueryDimensionDSL = number | BaseDimensionDSL | DerivedDimensionDSL;

export type QueryOrderDirection = "asc" | "desc";

export type QueryOrderByDSL = {
  fieldId?: number;
  metricId?: number;
  tempMetricId?: string;
  alias?: string;
  field?: string;
  dir?: QueryOrderDirection;
  direction?: QueryOrderDirection;
};

export interface QueryDSL {
  datasetId: number;
  tableId?: number;
  dimensions?: QueryDimensionDSL[];
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
  orderBy?: QueryOrderByDSL[];
  topN?: number;
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

export type QueryColumnMappingRole = "dimension" | "metric";

export type QueryColumnMappingTargetKind =
  | "field"
  | "metric"
  | "derived_dimension"
  | "temp_metric"
  | "unknown";

export interface QueryColumnMappingTarget {
  kind: QueryColumnMappingTargetKind;
  datasetId?: number;
  id?: string;
  key?: string;
}

export interface QueryColumnMapping {
  alias: string;
  type: QueryColumnMappingRole;
  displayName: string;
  businessName?: string;
  index?: number;
  target?: QueryColumnMappingTarget;
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
  columnMappings?: QueryColumnMapping[];
}
