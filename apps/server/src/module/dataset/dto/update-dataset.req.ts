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
  metrics?: EntityActionRequest<DatasetMetric>;

  /**
   * Join 操作（新增/更新/删除）
   */
  joins?: EntityActionRequest<DatasetJoin>;

  /**
   * 表操作（新增/更新/删除）
   */
  tables?: EntityActionRequest<DatasetTable>;
}
