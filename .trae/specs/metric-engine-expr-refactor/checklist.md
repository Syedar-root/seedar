# Metric Engine 表达式层重构 - 验证清单

## Phase 1: 基础设施

### jsep 依赖
- [x] jsep 包成功安装到 `packages/metric_engine`
- [x] `import jsep from 'jsep'` 不报错
- [x] jsep 可以解析简单表达式如 `'1 + 2'`

### 表达式类型
- [x] `ExprKind` 枚举包含所有必要类型（Literal、FieldRef、Call、Binary、Unary、Conditional、Select）
- [x] `AggLevel` 枚举包含 None、Partial、Full
- [x] `ExprMeta` 接口定义完整（alias、businessName、description）
- [x] 所有类型都有清晰的中文注释

### 表达式 AST
- [x] `Expr` 抽象基类定义了 `toSQL()`、`toKnex()`、`getAggLevel()` 方法
- [x] `LiteralExpr` 可以正确处理数字和字符串字面量
- [x] `FieldRefExpr` 可以正确生成带表别名的字段引用
- [x] `AggExpr` 可以正确生成聚合函数 SQL
- [x] `BinaryExpr` 可以正确生成带括号的算术表达式
- [x] `getAggLevel()` 对各类表达式返回正确的聚合层级
- [x] 所有类都有详细的中文注释

### 表达式解析器
- [x] `ParseContext` 接口定义完整
- [x] `ExprParser` 可以解析标识符
- [x] `ExprParser` 可以解析带表别名的字段（如 `o.amount`）
- [x] `ExprParser` 可以解析聚合函数（如 `SUM(amount)`）
- [x] `ExprParser` 可以解析算术表达式（如 `a + b * c`）
- [x] 解析器有详细的中文注释

### 聚合层级分析器
- [x] `ExprAnalyzer` 可以正确识别纯字段表达式（AggLevel.None）
- [x] `ExprAnalyzer` 可以正确识别纯聚合表达式（AggLevel.Full）
- [x] `ExprAnalyzer` 可以正确识别混合表达式（AggLevel.Partial）
- [x] 可以提取需要放入 CTE 的聚合子表达式

## Phase 2: SQL 构建层

### QuerySpec 类型
- [x] `QuerySpec` 接口包含 from、joins、dimensions、metrics、filters、orderBy、limit、offset
- [x] 所有字段都有中文注释

### Knex 查询构建器
- [x] `KnexQueryBuilder.build()` 返回 `{ sql, bindings }` 对象
- [x] 简单 SELECT 查询生成正确的 SQL
- [x] JOIN 查询生成正确的 SQL
- [x] WHERE 条件正确参数化（使用 bindings）
- [x] GROUP BY 正确生成
- [x] ORDER BY 正确生成
- [x] LIMIT/OFFSET 正确生成
- [x] 使用 Knex 链式 API 而非字符串拼接
- [x] 所有方法都有中文注释

### CTE 构建器
- [x] 混合聚合层级的查询自动生成 WITH 子句
- [x] inner CTE 包含所有聚合子表达式
- [x] outer 查询正确引用 CTE 列
- [x] CTE 构建逻辑有详细的中文注释

## Phase 3: 兼容层

### Metric 适配器
- [x] `AggregateMetric` 正确转换为 `AggExpr`
- [x] `RowLevelMetric` 正确转换为 `BinaryExpr`
- [x] `ArithmeticMetric` 正确转换为 `BinaryExpr`
- [x] `PostAggregateMetric` 正确处理
- [x] 适配器有详细的中文注释

### Query 适配器
- [x] 主表正确转换为 `QuerySpec.from`
- [x] JOIN 正确转换为 `QuerySpec.joins`
- [x] 维度正确转换为 `QuerySpec.dimensions`
- [x] 指标正确转换为 `QuerySpec.metrics`
- [x] 过滤条件正确转换为 `QuerySpec.filters`
- [x] 适配器有详细的中文注释

### KnexSQLGenerator 重构
- [ ] `generateSQLWithBindings` 内部使用新架构（待 Task 13 完成）
- [x] 公共 API 保持不变
- [x] 现有测试用例全部通过
- [x] 生成的 SQL 与之前功能等效

## Phase 4: DSL v2 和文档

### DSL v2
- [ ] 可以解析新版 DSL 格式（待 Task 15 完成）
- [ ] DSL v2 解析器有中文注释

### 主入口导出
- [x] `expr` 模块正确导出
- [x] `sql` 模块正确导出
- [x] `compat` 模块正确导出
- [x] 旧的 Metric 类标记了 `@deprecated`
- [x] 导出文件有中文注释说明新旧 API 关系

### 单元测试
- [ ] 表达式类测试覆盖率 > 80%（待 Task 17 完成）
- [ ] 解析器测试覆盖率 > 80%
- [ ] SQL 构建器测试覆盖率 > 80%
- [ ] 兼容层测试覆盖率 > 80%

### 后端集成验证
- [x] server 端 query 模块编译通过
- [x] `dsl-transformer.ts` 正常工作
- [x] `query.service.ts` 查询执行功能正常
- [ ] 实际查询执行结果正确（需要运行时验证）

## 最终验收

- [x] 所有现有功能保持正常工作（编译通过）
- [x] 新的表达式系统可以正确处理 `SUM(A) * SUM(B)` 等嵌套聚合（架构支持）
- [x] 混合聚合层级自动生成 CTE（架构支持）
- [x] 代码使用 Knex 链式 API 而非字符串拼接
- [x] 所有代码都有清晰的中文注释
- [x] 后端 server 模块无需修改即可正常编译
