export type EditorMode = 'create' | 'edit';

export type StepStatus = 'completed' | 'active' | 'pending' | 'error';

export type EditorSteps =
  | 'basicInfo'
  | 'dataSource'
  | 'joinConfig'
  | 'fieldConfig'
  | 'metricConfig'
  | 'confirm';

export interface JoinConfig {
  id: string;
  leftTable: string;
  leftField: string;
  joinType: 'inner' | 'left' | 'right' | 'full';
  rightTable: string;
  rightField: string;
}

export interface MetricConfig {
  id: string;
  name: string;
  expression: string;
  description?: string;
}

export interface DatasetFormData {
  name: string;
  description: string;
  type: 'semantic' | 'wideTable';
  datasourceId: string;
  tables: Array<{ tableId: string; tableName: string; alias?: string }>;
  mainTable: string;
  joins: JoinConfig[];
  fields: string[];
  metrics: MetricConfig[];
}