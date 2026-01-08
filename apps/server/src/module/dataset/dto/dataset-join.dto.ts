import { JoinType } from '../dataset.types';

/**
 * 创建数据集时定义join关系的请求DTO
 */
export class CreateDatasetJoinRequest {
  /**
   * 左表ID（相对于datasourceTableIds中的索引）
   */
  leftTableId: number;

  /**
   * 左表的连接列ID
   */
  leftColumnId: number;

  /**
   * 右表ID（相对于datasourceTableIds中的索引）
   */
  rightTableId: number;

  /**
   * 右表的连接列ID
   */
  rightColumnId: number;

  /**
   * Join类型，默认为INNER
   */
  joinType?: JoinType = JoinType.INNER;
}
