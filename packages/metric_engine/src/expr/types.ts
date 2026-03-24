/**
 * 表达式类型枚举
 * 用于标识不同类型的表达式节点
 */
export enum ExprKind {
  /** 字面量表达式，表示常量值如数字、字符串等 */
  Literal = 'Literal',
  /** 字段引用表达式，引用数据表中的字段 */
  FieldRef = 'FieldRef',
  /** 指标引用表达式，引用已定义的业务指标 */
  MetricRef = 'MetricRef',
  /** 函数调用表达式，表示函数调用如聚合函数、标量函数等 */
  Call = 'Call',
  /** 二元运算表达式，表示两个操作数之间的运算如加减乘除 */
  Binary = 'Binary',
  /** 一元运算表达式，表示单个操作数的运算如取负、逻辑非等 */
  Unary = 'Unary',
  /** 条件表达式，表示条件判断逻辑如 CASE WHEN 或三元运算符 */
  Conditional = 'Conditional',
  /** 选择表达式，表示从多个值中选择一个 */
  Select = 'Select'
}

/**
 * 聚合级别枚举
 * 用于标识表达式的聚合状态
 */
export enum AggLevel {
  /** 无聚合，表示表达式未经过任何聚合操作 */
  None = 'None',
  /** 部分聚合，表示表达式经过了部分聚合，可能需要进一步聚合 */
  Partial = 'Partial',
  /** 完全聚合，表示表达式已经完成聚合，结果为标量值 */
  Full = 'Full'
}

/**
 * 表达式元数据接口
 * 包含表达式的业务相关信息
 */
export interface ExprMeta {
  /** 表达式别名，用于在查询结果中标识该表达式 */
  alias?: string;
  /** 业务名称，用于展示和文档说明 */
  businessName?: string;
  /** 表达式描述，详细说明表达式的用途和含义 */
  description?: string;
}

/**
 * 聚合函数类型
 * 支持的聚合函数名称（大写格式，用于表达式 AST）
 */
export type AggFuncName = 'SUM' | 'COUNT' | 'AVG' | 'MAX' | 'MIN' | 'DISTINCT_COUNT';

/**
 * 二元运算符类型
 * 支持的算术运算符
 */
export type BinaryOperator = '+' | '-' | '*' | '/';

/**
 * 比较运算符类型
 * 支持的比较运算符
 */
export type ComparisonOperator = '=' | '==' | '!=' | '<>' | '>' | '<' | '>=' | '<=';
