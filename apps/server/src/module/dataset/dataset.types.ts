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

/**
 * 字段数据类型枚举
 */
export enum FieldType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  DATETIME = 'datetime',
  DECIMAL = 'decimal'
}

/**
 * 指标类型枚举
 */
export enum MetricType {
  ROW_LEVEL = 'row_level',       // 行级指标
  AGGREGATE = 'aggregate',       // 聚合指标
  POST_AGGREGATE = 'post_aggregate', // 后聚合指标
  ARITHMETIC = 'arithmetic',     // 算术运算指标
  PERIOD_OVER_PERIOD = 'period_over_period', // 同环比指标
}

/**
 * 聚合函数枚举
 */
export enum MetricAggregateFunction {
  SUM = 'sum',
  COUNT = 'count',
  AVG = 'avg',
  MAX = 'max',
  MIN = 'min',
  DISTINCT_COUNT = 'distinct_count',
}

/**
 * 算术运算符枚举
 */
export enum MetricOperator {
  ADD = '+',
  SUBTRACT = '-',
  MULTIPLY = '*',
  DIVIDE = '/',
}

/**
 * 同环比类型枚举
 */
export enum PeriodOverPeriodType {
  DAY_OVER_DAY = 'day_over_day',
  WEEK_OVER_WEEK = 'week_over_week',
  MONTH_OVER_MONTH = 'month_over_month',
  QUARTER_OVER_QUARTER = 'quarter_over_quarter',
  YEAR_OVER_YEAR = 'year_over_year',
}

/**
 * 同环比计算模式枚举
 */
export enum PeriodCalculationMode {
  PERCENTAGE = 'percentage',  // 百分比
  ABSOLUTE = 'absolute',      // 绝对值
  BOTH = 'both',             // 两者都返回
}

/**
 * 聚合条件配置
 */
export interface AggregateConditionConfig {
  /** 时间字段ID */
  timeFieldId?: number;
  /** 时间范围类型 */
  timeRange?: 'recent_days' | 'recent_weeks' | 'recent_months' | 'custom_date_range';
  /** 时间范围值 */
  timeValue?: number;
  /** 自定义日期范围 - 开始日期 */
  startDate?: string;
  /** 自定义日期范围 - 结束日期 */
  endDate?: string;
  /** CASE WHEN 条件表达式 */
  caseCondition?: string;
  /** 额外的WHERE条件 */
  additionalFilter?: string;
  /** 自定义SQL模板 */
  sqlTemplate?: string;
}