/**
 * SQL 查询构建相关类型定义
 */

/**
 * 连接类型
 * 用于指定表连接的方式
 */
export type JoinType = 'left' | 'inner' | 'right';

/**
 * 连接规格接口
 * 定义表连接的完整配置，包括连接类型、目标表、别名和连接条件
 */
export interface JoinSpec {
  /**
   * 连接类型
   * - 'left': 左连接，保留左表所有记录
   * - 'inner': 内连接，只保留匹配的记录
   * - 'right': 右连接，保留右表所有记录
   */
  type: JoinType;

  /**
   * 要连接的表名
   */
  table: string;

  /**
   * 表别名，用于在查询中引用该表
   */
  alias: string;

  /**
   * 连接条件表达式
   * 用于指定表之间的关联关系，如 'users.id = orders.user_id'
   */
  on: any;
}

/**
 * 排序规格接口
 * 定义查询结果的排序方式
 */
export interface OrderBySpec {
  /**
   * 排序表达式
   * 可以是字段名、别名或复杂的表达式
   */
  expr: any;

  /**
   * 排序方向
   * - 'asc': 升序排列（从小到大）
   * - 'desc': 降序排列（从大到小）
   */
  dir: 'asc' | 'desc';
}

/**
 * 查询规格接口
 * 定义完整的 SQL 查询结构，包括数据源、连接、维度、指标、过滤条件等
 */
export interface QuerySpec {
  /**
   * 主表信息
   * 指定查询的主表及其别名
   */
  from: {
    table: string;
    alias: string;
  };

  /**
   * 表连接配置数组
   * 定义需要关联的其他表及其连接方式
   */
  joins: JoinSpec[];

  /**
   * 维度表达式数组
   * 用于分组和展示的维度字段，如日期、类别等
   */
  dimensions: any[];

  /**
   * 指标表达式数组
   * 用于计算的聚合指标，如求和、计数等
   */
  metrics: any[];

  /**
   * 过滤条件表达式数组
   * 用于筛选数据的条件，多个条件之间通常为 AND 关系
   */
  filters: any[];

  /**
   * 排序配置数组（可选）
   * 指定查询结果的排序规则
   */
  orderBy?: OrderBySpec[];

  /**
   * 返回记录数量限制（可选）
   * 限制查询结果的最大行数
   */
  limit?: number;

  /**
   * 结果偏移量（可选）
   * 用于分页查询，指定跳过的记录数
   */
  offset?: number;
}

/**
 * SQL 执行结果接口
 * 包含生成的 SQL 语句和参数绑定数组
 */
export interface SQLResult {
  /**
   * 生成的 SQL 语句字符串
   * 使用占位符（如 ? 或 $1）表示参数位置
   */
  sql: string;

  /**
   * 参数绑定数组
   * 按顺序存储需要绑定到 SQL 语句中的参数值
   * 用于防止 SQL 注入，提高安全性
   */
  bindings: readonly any[];
}
