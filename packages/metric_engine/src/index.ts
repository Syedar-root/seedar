/**
 * Metric Engine - 指标计算和查询 DSL 库
 * 
 * 本库提供以下核心功能：
 * - 表达式 AST 系统（expr 模块）：统一的表达式抽象语法树
 * - SQL 构建器（sql 模块）：基于 Knex 的链式 SQL 构建
 * - 兼容层（compat 模块）：新旧 API 适配器
 * 
 * ## 架构说明
 * 
 * ### 新架构（推荐使用）
 * - `expr` 模块：表达式 AST，支持字段引用、聚合函数、算术运算
 * - `sql` 模块：Knex 链式 SQL 构建，自动处理 CTE
 * - `compat` 模块：兼容旧 API，无需修改现有代码
 * 
 * ### 旧架构（已废弃）
 * - `metrics/metric-classes.ts`：旧的指标类系统
 * - `query/query-builder.ts`：旧的查询构建器
 * 
 * @packageDocumentation
 */

// ============================================
// 新架构模块（推荐使用）
// ============================================

/**
 * 表达式模块
 * 
 * 提供统一的表达式抽象语法树（AST），支持：
 * - 字段引用表达式（FieldRefExpr）
 * - 聚合函数表达式（AggExpr）
 * - 算术运算表达式（BinaryExpr）
 * - 表达式解析（基于 jsep）
 * - 聚合层级分析
 */
export * from './expr';

/**
 * SQL 构建模块
 * 
 * 提供基于 Knex 的 SQL 构建功能：
 * - QuerySpec 查询规格定义
 * - KnexQueryBuilder 使用 Knex 链式 API 构建 SQL
 * - CTEBuilder 自动生成 CTE 处理混合聚合层级
 */
export * from './sql';

/**
 * 兼容层模块
 * 
 * 提供新旧 API 的兼容适配：
 * - MetricAdapter: 将旧 Metric 类转换为新 Expr 表达式
 * - QueryAdapter: 将旧 Query 对象转换为新 QuerySpec
 * 
 * 使用兼容层可以让现有代码无需修改即可使用新架构。
 */
export * from './compat';

// ============================================
// 核心类型（保留）
// ============================================

// 注意：core/types 中的部分类型与 expr/types 重复
// 这里显式导出需要的类型，避免冲突
export {
  DatabaseClient,
  DatabaseDialect,
  FieldType,
  Operator,
  JoinType,
  TimePeriod,
  PeriodOverPeriodType,
  PeriodCalculationMode,
  AggregateFunction,
} from './core/types';

export * from './core/field';
export * from './core/table';
export * from './core/join';

// ============================================
// 旧架构（已废弃，保留向后兼容）
// ============================================

/**
 * @deprecated 使用 `expr` 模块中的表达式类替代
 * 
 * 迁移指南：
 * - AggregateMetric → AggExpr
 * - RowLevelMetric → BinaryExpr
 * - ArithmeticMetric → BinaryExpr
 * - PostAggregateMetric → AggExpr
 * 
 * 使用 MetricAdapter.toExpr() 可以自动转换旧指标为新表达式
 */
export * from './metrics/metric-classes';

/**
 * @deprecated 使用 `sql` 模块中的 QuerySpec 和 KnexQueryBuilder 替代
 * 
 * 迁移指南：
 * - Query → QuerySpec
 * - Dimension → Expr（FieldRefExpr）
 * 
 * 使用 QueryAdapter.toQuerySpec() 可以自动转换旧查询为新规格
 */
export * from './query/query-builder';

/**
 * @deprecated 使用 `expr` 模块中的表达式系统替代
 */
export * from './query/filter';

/**
 * @deprecated 使用 `sql` 模块中的 KnexQueryBuilder 替代
 * 
 * 注意：KnexSQLGenerator 内部已使用新架构实现，
 * 现有代码无需修改即可使用新架构。
 */
export * from './query/knex-sql-generator';

/**
 * @deprecated 使用 `expr` 模块中的 ExprParser 替代
 */
export * from './dsl/parse-dsl';

// ============================================
// 便捷导出
// ============================================

export {
  PeriodOverPeriodMetric,
} from './metrics/metric-classes';
