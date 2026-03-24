import { DatasetField } from '../entities/dataset-field.entity';
import { DatasetJoin } from '../entities/dataset-join.entity';
import { DatasetMetric } from '../entities/dataset-metric.entity';
import { DatasetTable } from '../entities/dataset-table.entity';
import { EntityActionRequest } from './entity-action.request';

export type AddField = Pick<
  DatasetField,
  'dataSourceColumnId' | 'businessName'
>;
export type UpdateField = Pick<
  DatasetField,
  'id' | 'businessName' | 'description'
>;

export type AddMetric = Pick<
  DatasetMetric,
  | 'metricType'
  | 'name'
  | 'alias'
  | 'description'
  | 'businessName'
  | 'dataSourceColumnId'
  | 'leftOperand'
  | 'rowOperator'
  | 'rightOperand'
  | 'aggregateFunction'
  | 'distinct'
  | 'aggregateCondition'
  | 'sourceMetricId'
  | 'leftMetricId'
  | 'arithmeticOperator'
  | 'rightMetricOperand'
  | 'baseMetricId'
  | 'timeDataSourceColumnId'
  | 'periodType'
  | 'calculationMode'
  | 'expression'
>;

export type UpdateMetric = Pick<
  DatasetMetric,
  | 'id'
  | 'name'
  | 'alias'
  | 'description'
  | 'businessName'
  | 'dataSourceColumnId'
  | 'leftOperand'
  | 'rowOperator'
  | 'rightOperand'
  | 'aggregateFunction'
  | 'distinct'
  | 'aggregateCondition'
  | 'sourceMetricId'
  | 'leftMetricId'
  | 'arithmeticOperator'
  | 'rightMetricOperand'
  | 'baseMetricId'
  | 'timeDataSourceColumnId'
  | 'periodType'
  | 'calculationMode'
  | 'expression'
>;

export type AddJoin = Pick<
  DatasetJoin,
  | 'joinType'
  | 'leftTableId'
  | 'leftField'
  | 'rightTableId'
  | 'rightField'
  | 'operator'
>;

export type UpdateJoin = Pick<
  DatasetJoin,
  | 'id'
  | 'joinType'
  | 'leftTableId'
  | 'leftField'
  | 'rightTableId'
  | 'rightField'
  | 'operator'
>;

export type AddTable = Pick<
  DatasetTable,
  | 'datasourceTableId'
  | 'datasetName'
  | 'tableName'
  | 'description'
  | 'primaryFieldId'
>;

export type UpdateTable = Pick<
  DatasetTable,
  'id' | 'datasetName' | 'tableName' | 'description' | 'primaryFieldId'
>;
/**
 * 数据集更新请求
 */
export class UpdateDatasetRequest {
  dataSetId: number;
  name?: string;
  description?: string;

  /**
   * 字段操作（新增/更新/删除）
   */
  fields?: EntityActionRequest<AddField, UpdateField>;

  /**
   * 指标操作（新增/更新/删除）
   */
  metrics?: EntityActionRequest<AddMetric, UpdateMetric>;

  /**
   * Join 操作（新增/更新/删除）
   */
  joins?: EntityActionRequest<AddJoin, UpdateJoin>;

  /**
   * 表操作（新增/更新/删除）
   */
  tables?: EntityActionRequest<AddTable, UpdateTable>;
}
