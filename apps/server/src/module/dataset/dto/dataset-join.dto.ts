import { JoinType } from '../dataset.types';

/**
 * 创建数据集时定义join关系的请求DTO
 */
export class CreateDatasetJoinRequest {
  /**
   * 左表ID（datasource_table 表的主键 ID）
   */
  leftTableId: number;

  /**
   * 左表的连接列ID（datasource_column 表的主键 ID）
   */
  leftColumnId: number;

  /**
   * 右表ID（datasource_table 表的主键 ID）
   */
  rightTableId: number;

  /**
   * 右表的连接列ID（datasource_column 表的主键 ID）
   */
  rightColumnId: number;

  /**
   * Join类型，默认为INNER
   */
  joinType?: JoinType = JoinType.INNER;
}
