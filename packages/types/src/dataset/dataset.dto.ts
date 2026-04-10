import { DatasetType, JoinType } from './dataset.types';

/**
 * 实体操作请求
 * 用于统一处理字段、指标、Join、表的增删改操作
 */
export class EntityActionRequest<T, S = T> {
  /** 新增的实体 */
  added?: Partial<T>[];
  /** 更新的实体（带 id） */
  updated?: Partial<S>[];
  /** 删除的实体 ID 列表 */
  deletedIds?: number[];
}

/**
 * 创建数据集字段请求
 */
export class CreateDatasetFieldRequest {
  dataSourceColumnId!: number;
  tableId!: number;
  name!: string;
  description?: string;
  businessName?: string;
  /** 是否为主键字段 */
  isPrimaryKey?: boolean;
}

/**
 * 创建数据集时定义join关系的请求DTO
 */
export class CreateDatasetJoinRequest {
  /**
   * 左表ID（datasource_table 表的主键 ID）
   */
  leftTableId!: number;

  /**
   * 左表的连接列ID（datasource_column 表的主键 ID）
   */
  leftColumnId!: number;

  /**
   * 右表ID（datasource_table 表的主键 ID）
   */
  rightTableId!: number;

  /**
   * 右表的连接列ID（datasource_column 表的主键 ID）
   */
  rightColumnId!: number;

  /**
   * Join类型，默认为INNER
   */
  joinType?: JoinType = JoinType.INNER;
}

/**
 * 创建数据集请求
 */
export class CreateDatasetRequest {
  name!: string;
  datasourceId!: number;
  datasourceTableIds!: number[];
  description!: string;
  type!: DatasetType;
  wideTableConfig?: Record<string, any>;

  /**
   * 主表 ID（关联到 datasource_tables 表）
   */
  mainTableId?: number;

  /*
   * 字段定义
   */
  fields?: CreateDatasetFieldRequest[];

  /**
   * 表之间的join关系定义
   */
  joins?: CreateDatasetJoinRequest[];
}

/**
 * 添加字段类型
 */
export type AddField = {
  dataSourceColumnId?: number;
  businessName?: string;
};

/**
 * 更新字段类型
 */
export type UpdateField = {
  id?: number;
  businessName?: string;
  description?: string;
};

/**
 * 添加指标类型
 */
export type AddMetric = {
  metricType?: string;
  name?: string;
  alias?: string;
  description?: string;
  businessName?: string;
  expression?: string;
  dataSourceColumnId?: number;
  leftOperand?: number;
  rowOperator?: string;
  rightOperand?: number;
  aggregateFunction?: string;
  distinct?: boolean;
  aggregateCondition?: any;
  sourceMetricId?: number;
  leftMetricId?: number;
  arithmeticOperator?: string;
  rightMetricOperand?: number;
  baseMetricId?: number;
  timeDataSourceColumnId?: number;
  periodType?: string;
  calculationMode?: string;
};

/**
 * 更新指标类型
 */
export type UpdateMetric = {
  id?: number;
  name?: string;
  alias?: string;
  description?: string;
  businessName?: string;
  dataSourceColumnId?: number;
  leftOperand?: number;
  rowOperator?: string;
  rightOperand?: number;
  aggregateFunction?: string;
  distinct?: boolean;
  aggregateCondition?: any;
  sourceMetricId?: number;
  leftMetricId?: number;
  arithmeticOperator?: string;
  rightMetricOperand?: number;
  baseMetricId?: number;
  timeDataSourceColumnId?: number;
  periodType?: string;
  calculationMode?: string;
};

/**
 * 添加Join类型
 */
export type AddJoin = {
  joinType?: string;
  leftTableId?: number;
  leftField?: string;
  rightTableId?: number;
  rightField?: string;
  operator?: string;
};

/**
 * 更新Join类型
 */
export type UpdateJoin = {
  id?: number;
  joinType?: string;
  leftTableId?: number;
  leftField?: string;
  rightTableId?: number;
  rightField?: string;
  operator?: string;
};

/**
 * 添加表类型
 */
export type AddTable = {
  datasourceTableId?: number;
  datasetName?: string;
  tableName?: string;
  description?: string;
  primaryFieldId?: number;
};

/**
 * 更新表类型
 */
export type UpdateTable = {
  id?: number;
  datasetName?: string;
  tableName?: string;
  description?: string;
  primaryFieldId?: number;
};

/**
 * 数据集更新请求
 */
export class UpdateDatasetRequest {
  dataSetId!: number;
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
