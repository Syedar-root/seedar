export type QueryColumnMappingRole = 'dimension' | 'metric';

export type QueryColumnMappingTargetKind =
  | 'field'
  | 'metric'
  | 'derived_dimension'
  | 'temp_metric'
  | 'unknown';

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

export class ExecuteQueryResponse {
  sql: string;
  results: {
    header: string[];
    rows: any[];
  };
  executionTime: number;
  columnMappings?: QueryColumnMapping[];
}
