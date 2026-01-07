/**
 * 数据集类型枚举
 * - SEMANTIC：语义型
 * - WIDE：宽表型
 */
export enum DatasetType {
  SEMANTIC = 'semantic',
  WIDE = 'wide',
}

/**
 * 数据集状态枚举
 * - ACTIVE：启用
 * - DISABLED：禁用
 * - DELETED：已删除
 */
export enum DatasetStatus {
  ACTIVE = 'active',
  DISABLED = 'disabled',
  DELETED = 'deleted',
}

export enum JoinType {
  INNER = 'inner',
  LEFT = 'left',
  RIGHT = 'right',
}

export enum FieldRole {
  DIMENSION = 'dimension',
  MEASURE = 'measure',
  RAW = 'raw',
}

export enum Aggregation {
  SUM = 'sum',
  COUNT = 'count',
  AVG = 'avg',
  MAX = 'max',
  MIN = 'min',
}
