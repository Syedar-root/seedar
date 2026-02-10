import { DatasetType } from '../dataset.types';
import { CreateDatasetJoinRequest } from './dataset-join.dto';
import { CreateDatasetFieldRequest } from './dataset-field.dto';

export class CreateDatasetRequest {
  name: string;
  datasourceId: number;
  datasourceTableIds: number[];
  description: string;
  type: DatasetType;
  wideTableConfig?: Record<string, any>;

  /*
   * 字段定义
   */
  fields?: CreateDatasetFieldRequest[];

  /**
   * 表之间的join关系定义
   */
  joins?: CreateDatasetJoinRequest[];
}
