# Metric Engine 表达式层重构 Spec

## Why

当前 metric_engine 存在以下问题：
1. 所有 `toSQL()` 方法使用字符串拼接，未充分利用 Knex 的链式 API，存在安全隐患
2. 指标类型设计混乱（RowLevelMetric、ArithmeticMetric、PostAggregateMetric 语义重叠）
3. 嵌套聚合计算支持不完整，如 `SUM(A) * SUM(B)` 无法正确处理
4. 缺少聚合层级自动推断，无法自动生成正确的 CTE

## What Changes

### 新增功能
- 引入 jsep 解析器，支持表达式字符串解析
- 新建 `expr/` 目录，实现统一的表达式 AST
- 新建 `sql/` 目录，实现 Knex 链式 SQL 构建器
- 新建 `compat/` 目录，提供新旧 API 兼容层
- 支持聚合层级自动分析（None/Partial/Full）
- 自动生成 CTE 处理混合聚合层级

### 重构内容
- 重构 `knex-sql-generator.ts`，内部使用新架构
- 重构 `sql-generator.ts`，内部使用新架构
- 标记旧 Metric 类为 `@deprecated`

### **BREAKING** 变更
- 新版 DSL v2 格式与 v1 不兼容（通过兼容层适配）

## Impact

- Affected specs: query-metric-engine, filter-support-metric
- Affected code:
  - `packages/metric_engine/src/` (核心重构)
  - `apps/server/src/module/query/dsl-transformer.ts` (兼容层适配)

## ADDED Requirements

### Requirement: 表达式 AST 系统

系统应提供统一的表达式抽象语法树（AST），支持字段引用、聚合函数、算术运算等。

#### Scenario: 字段引用表达式
- **WHEN** 用户创建 `FieldRefExpr('orders', 'amount', 'o')`
- **THEN** 系统生成 SQL `o.amount`
- **AND** `getAggLevel()` 返回 `AggLevel.None`

#### Scenario: 聚合表达式
- **WHEN** 用户创建 `AggExpr('SUM', fieldRefExpr)`
- **THEN** 系统生成 SQL `SUM(o.amount)`
- **AND** `getAggLevel()` 返回 `AggLevel.Full`

#### Scenario: 算术表达式 - 同层级
- **WHEN** 用户创建 `BinaryExpr(sumA, '*', sumB)` 其中 sumA 和 sumB 都是聚合表达式
- **THEN** 系统生成 SQL `(SUM(A) * SUM(B))`
- **AND** `getAggLevel()` 返回 `AggLevel.Full`

#### Scenario: 算术表达式 - 混合层级
- **WHEN** 用户创建 `BinaryExpr(fieldA, '/', sumB)` 其中 fieldA 是字段，sumB 是聚合
- **THEN** 系统生成 SQL `(A / SUM(B))`
- **AND** `getAggLevel()` 返回 `AggLevel.Partial`
- **AND** 系统自动生成 CTE 分层处理

### Requirement: jsep 表达式解析

系统应支持使用 jsep 解析表达式字符串为 AST。

#### Scenario: 解析简单字段
- **WHEN** 用户解析表达式 `"amount"`
- **THEN** 系统返回 `FieldRefExpr` 节点

#### Scenario: 解析带表别名的字段
- **WHEN** 用户解析表达式 `"o.amount"`
- **THEN** 系统返回 `FieldRefExpr('orders', 'amount', 'o')` 节点

#### Scenario: 解析聚合函数
- **WHEN** 用户解析表达式 `"SUM(amount)"`
- **THEN** 系统返回 `AggExpr('SUM', FieldRefExpr('amount'))` 节点

#### Scenario: 解析算术表达式
- **WHEN** 用户解析表达式 `"SUM(amount) * COUNT(id)"`
- **THEN** 系统返回 `BinaryExpr(AggExpr('SUM', ...), '*', AggExpr('COUNT', ...))` 节点

### Requirement: Knex 链式 SQL 构建

系统应使用 Knex 链式 API 构建 SQL，而非字符串拼接。

#### Scenario: 简单查询构建
- **WHEN** 用户构建包含 SELECT、FROM、WHERE 的查询
- **THEN** 系统使用 `knex.select().from().where()` 链式调用
- **AND** 返回参数化的 `{ sql, bindings }` 对象

#### Scenario: CTE 自动生成
- **WHEN** 查询包含混合聚合层级的指标
- **THEN** 系统自动生成 WITH 子句
- **AND** 内层 CTE 包含基础聚合
- **AND** 外层查询引用 CTE 列

### Requirement: 兼容层

系统应提供兼容层，使旧代码无需修改即可使用新架构。

#### Scenario: Metric 转 Expr
- **WHEN** 用户调用 `MetricAdapter.toExpr(oldMetric)`
- **THEN** 系统返回等效的新 `Expr` 节点

#### Scenario: Query 转 QuerySpec
- **WHEN** 用户调用 `QueryAdapter.toQuerySpec(oldQuery)`
- **THEN** 系统返回新架构的 `QuerySpec` 对象

#### Scenario: 旧 API 保持工作
- **WHEN** 用户继续使用 `KnexSQLGenerator.generateSQLWithBindings(query)`
- **THEN** 系统内部转换为新架构执行
- **AND** 返回结果格式不变

## MODIFIED Requirements

### Requirement: DSL 解析

系统应支持新版 DSL v2 格式，同时保持对 v1 的兼容。

#### v2 DSL 格式示例
```typescript
{
  version: 2,
  from: { table: 'orders', alias: 'o' },
  dimensions: ['o.user_id'],
  metrics: [
    { expr: 'SUM(o.amount)', alias: 'total' },
    { expr: 'SUM(o.amount) / COUNT(*)', alias: 'avg_amount' }
  ],
  filters: [{ expr: 'o.status = "completed"' }]
}
```

## REMOVED Requirements

### Requirement: 字符串拼接 SQL 生成
**Reason**: 存在安全隐患，无法利用 Knex 的参数化和方言适配能力
**Migration**: 所有 SQL 生成改用 Knex 链式 API

### Requirement: PostAggregateMetric 的 displayName 引用
**Reason**: 语义不清，只能引用列名而非表达式
**Migration**: 使用新的表达式系统，支持任意嵌套
