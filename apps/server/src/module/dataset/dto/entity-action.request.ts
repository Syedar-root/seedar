/**
 * 实体操作请求
 * 用于统一处理字段、指标、Join、表的增删改操作
 */
export class EntityActionRequest<T> {
  /** 新增的实体 */
  added?: Partial<T>[];
  /** 更新的实体（带 id） */
  updated?: Partial<T>[];
  /** 删除的实体 ID 列表 */
  deletedIds?: number[];
}
