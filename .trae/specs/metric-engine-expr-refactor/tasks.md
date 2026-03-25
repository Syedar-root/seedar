# Metric Engine 表达式层重构 - 任务列表

## Phase 1: 基础设施（不影响现有代码）

### [x] Task 1: 安装 jsep 依赖并配置类型

- **优先级**: P0
- **依赖**: None
- **描述**:
  - 在 `packages/metric_engine` 目录下安装 jsep 包
  - 安装 @types/jsep 类型定义（如果存在）
  - 验证 jsep 可以正常导入和使用
- **验收标准**: jsep 成功安装，可以解析简单表达式
- **测试要求**:
  - `programmatic` TR-1.1: `import jsep from 'jsep'` 不报错
  - `programmatic` TR-1.2: `jsep('1 + 2')` 返回正确的 AST

### [x] Task 2: 创建表达式类型定义

- **优先级**: P0
- **依赖**: Task 1
- **描述**:
  - 创建 `packages/metric_engine/src/expr/` 目录
  - 创建 `expr/types.ts`，定义 `ExprKind` 枚举和 `AggLevel` 枚举
  - 定义 `ExprMeta` 接口（alias、businessName、description）
  - 添加详细的中文注释说明每个类型的作用
- **验收标准**: 类型定义完整，注释清晰
- **测试要求**:
  - `programmatic` TR-2.1: `ExprKind` 包含 Literal、FieldRef、Call、Binary、Unary、Conditional、Select
  - `programmatic` TR-2.2: `AggLevel` 包含 None、Partial、Full
  - `human-judgment` TR-2.3: 每个类型都有中文注释说明

### [x] Task 3: 实现表达式 AST 基类和核心子类

- **优先级**: P0
- **依赖**: Task 2
- **描述**:
  - 创建 `expr/ast.ts`
  - 实现 `Expr` 抽象基类，包含 `toSQL()`、`toKnex(knex)`、`getAggLevel()` 抽象方法
  - 实现 `LiteralExpr` 类（字面量表达式，如数字、字符串）
  - 实现 `FieldRefExpr` 类（字段引用表达式，如 `o.amount`）
  - 实现 `AggExpr` 类（聚合函数表达式，如 `SUM(amount)`）
  - 实现 `BinaryExpr` 类（二元运算表达式，如 `a + b`）
  - 每个类都要添加详细的中文注释
- **验收标准**: 所有表达式类可以正确生成 SQL 和 Knex 片段
- **测试要求**:
  - `programmatic` TR-3.1: `LiteralExpr(42).toSQL()` 返回 `'42'`
  - `programmatic` TR-3.2: `FieldRefExpr('orders', 'amount', 'o').toSQL()` 返回 `'o.amount'`
  - `programmatic` TR-3.3: `AggExpr('SUM', fieldRef).toSQL()` 返回 `'SUM(o.amount)'`
  - `programmatic` TR-3.4: `BinaryExpr(left, '*', right).toSQL()` 返回正确的括号表达式
  - `programmatic` TR-3.5: `getAggLevel()` 对各类表达式返回正确的层级

### [x] Task 4: 实现表达式解析器

- **优先级**: P0
- **依赖**: Task 3
- **描述**:
  - 创建 `expr/parser.ts`
  - 实现 `ParseContext` 接口，包含 tables、fields、metrics 映射
  - 实现 `ExprParser` 类，使用 jsep 解析表达式字符串
  - 支持解析标识符（字段名）、字面量、二元运算、函数调用、成员访问
  - 添加详细的中文注释说明解析逻辑
- **验收标准**: 可以解析各种表达式字符串为 AST
- **测试要求**:
  - `programmatic` TR-4.1: `parser.parse('amount')` 返回 `FieldRefExpr`
  - `programmatic` TR-4.2: `parser.parse('o.amount')` 返回带表别名的 `FieldRefExpr`
  - `programmatic` TR-4.3: `parser.parse('SUM(amount)')` 返回 `AggExpr`
  - `programmatic` TR-4.4: `parser.parse('a + b * c')` 返回正确的嵌套 `BinaryExpr`

### [x] Task 5: 实现聚合层级分析器

- **优先级**: P1
- **依赖**: Task 3
- **描述**:
  - 创建 `expr/analyzer.ts`
  - 实现 `ExprAnalyzer` 类，分析表达式的聚合层级
  - 实现混合层级检测逻辑
  - 实现聚合表达式提取逻辑（用于 CTE 生成）
  - 添加详细的中文注释
- **验收标准**: 可以正确分析任意表达式的聚合层级
- **测试要求**:
  - `programmatic` TR-5.1: 纯字段表达式返回 `AggLevel.None`
  - `programmatic` TR-5.2: 纯聚合表达式返回 `AggLevel.Full`
  - `programmatic` TR-5.3: 混合表达式返回 `AggLevel.Partial`
  - `programmatic` TR-5.4: 可以提取出需要放入 CTE 的聚合子表达式

### [x] Task 6: 创建 expr 模块导出

- **优先级**: P1
- **依赖**: Task 3, Task 4, Task 5
- **描述**:
  - 创建 `expr/index.ts`
  - 导出所有表达式类、类型、解析器
  - 添加模块级别的中文注释说明
- **验收标准**: 可以通过 `from '../expr'` 导入所有必要类型

## Phase 2: SQL 构建层

### [x] Task 7: 创建 QuerySpec 类型定义

- **优先级**: P0
- **依赖**: Task 2
- **描述**:
  - 创建 `sql/` 目录
  - 创建 `sql/types.ts`，定义 `QuerySpec` 接口
  - `QuerySpec` 包含 from、joins、dimensions、metrics、filters、orderBy、limit、offset
  - 添加详细的中文注释
- **验收标准**: `QuerySpec` 可以完整描述一个查询

### [x] Task 8: 实现 Knex 查询构建器

- **优先级**: P0
- **依赖**: Task 7, Task 3
- **描述**:
  - 创建 `sql/knex-builder.ts`
  - 实现 `KnexQueryBuilder` 类
  - 实现 `build(spec: QuerySpec)` 方法，返回 `{ sql, bindings }`
  - 实现简单查询构建（无 CTE）
  - 使用 Knex 链式 API（select、from、join、where、groupBy、orderBy、limit）
  - 添加详细的中文注释
- **验收标准**: 可以构建正确的参数化 SQL
- **测试要求**:
  - `programmatic` TR-8.1: 简单 SELECT 查询生成正确的 SQL
  - `programmatic` TR-8.2: JOIN 查询生成正确的 SQL
  - `programmatic` TR-8.3: WHERE 条件正确参数化
  - `programmatic` TR-8.4: GROUP BY 正确生成

### [x] Task 9: 实现 CTE 构建器

- **优先级**: P1
- **依赖**: Task 8, Task 5
- **描述**:
  - 创建 `sql/cte-builder.ts`
  - 实现 `CTEBuilder` 类
  - 实现 `buildWithCTE(spec)` 方法，处理混合聚合层级
  - 自动分离 inner 层和 outer 层的表达式
  - 添加详细的中文注释
- **验收标准**: 混合聚合层级的查询自动生成 CTE
- **测试要求**:
  - `programmatic` TR-9.1: 混合层级查询生成 WITH 子句
  - `programmatic` TR-9.2: inner CTE 包含所有聚合子表达式
  - `programmatic` TR-9.3: outer 查询正确引用 CTE 列

### [x] Task 10: 创建 sql 模块导出

- **优先级**: P1
- **依赖**: Task 8, Task 9
- **描述**:
  - 创建 `sql/index.ts`
  - 导出 `QuerySpec`、`KnexQueryBuilder`、`CTEBuilder`
  - 添加模块级别的中文注释

## Phase 3: 兼容层

### [x] Task 11: 实现 Metric 适配器

- **优先级**: P0
- **依赖**: Task 3
- **描述**:
  - 创建 `compat/` 目录
  - 创建 `compat/metric-adapter.ts`
  - 实现 `MetricAdapter.toExpr(metric)` 静态方法
  - 支持 `AggregateMetric`、`RowLevelMetric`、`ArithmeticMetric`、`PostAggregateMetric` 转换
  - 添加详细的中文注释说明转换逻辑
- **验收标准**: 旧 Metric 对象可以转换为新的 Expr
- **测试要求**:
  - `programmatic` TR-11.1: `AggregateMetric` 正确转换为 `AggExpr`
  - `programmatic` TR-11.2: `RowLevelMetric` 正确转换为 `BinaryExpr`
  - `programmatic` TR-11.3: `ArithmeticMetric` 正确转换为 `BinaryExpr`

### [x] Task 12: 实现 Query 适配器

- **优先级**: P0
- **依赖**: Task 11, Task 7
- **描述**:
  - 创建 `compat/query-adapter.ts`
  - 实现 `QueryAdapter.toQuerySpec(query)` 静态方法
  - 将旧的 `Query` 对象转换为新的 `QuerySpec`
  - 添加详细的中文注释
- **验收标准**: 旧 Query 对象可以转换为新的 QuerySpec
- **测试要求**:
  - `programmatic` TR-12.1: 主表正确转换
  - `programmatic` TR-12.2: JOIN 正确转换
  - `programmatic` TR-12.3: 维度和指标正确转换
  - `programmatic` TR-12.4: 过滤条件正确转换

### [ ] Task 13: 重构 KnexSQLGenerator 内部实现

- **优先级**: P0
- **依赖**: Task 12, Task 8
- **描述**:
  - 修改 `query/knex-sql-generator.ts`
  - `generateSQLWithBindings` 内部使用 `QueryAdapter` 和 `KnexQueryBuilder`
  - 保持公共 API 不变
  - 添加注释说明新旧架构的关系
- **验收标准**: 现有代码无需修改即可使用新架构
- **测试要求**:
  - `programmatic` TR-13.1: 现有测试用例全部通过
  - `programmatic` TR-13.2: 生成的 SQL 与之前功能等效

### [x] Task 14: 创建 compat 模块导出

- **优先级**: P1
- **依赖**: Task 11, Task 12
- **描述**:
  - 创建 `compat/index.ts`
  - 导出所有适配器
  - 添加模块级别的中文注释

## Phase 4: DSL v2 和文档

### [ ] Task 15: 实现 DSL v2 解析器

- **优先级**: P1
- **依赖**: Task 4, Task 7
- **描述**:
  - 创建 `dsl/v2/` 目录
  - 创建 `dsl/v2/parser.ts`，实现新版 DSL 解析
  - 创建 `dsl/v2/validator.ts`，实现 DSL 校验
  - 添加详细的中文注释
- **验收标准**: 可以解析新版 DSL 格式

### [x] Task 16: 更新主入口导出

- **优先级**: P1
- **依赖**: Task 6, Task 10, Task 14
- **描述**:
  - 更新 `index.ts`
  - 导出新的 `expr`、`sql`、`compat` 模块
  - 为旧的 Metric 类添加 `@deprecated` 注释
  - 添加中文注释说明新旧 API 的关系
- **验收标准**: 新旧 API 都可以正常导入使用

### [ ] Task 17: 编写单元测试

- **优先级**: P1
- **依赖**: 所有任务
- **描述**:
  - 为表达式类编写单元测试
  - 为解析器编写单元测试
  - 为 SQL 构建器编写单元测试
  - 为兼容层编写单元测试
- **验收标准**: 测试覆盖率 > 80%

### [x] Task 18: 验证后端集成

- **优先级**: P0
- **依赖**: Task 13
- **描述**:
  - 运行 server 端的 query 模块测试
  - 验证 `dsl-transformer.ts` 仍然正常工作
  - 验证 `query.service.ts` 的查询执行功能
- **验收标准**: 后端功能不受影响
- **测试要求**:
  - `programmatic` TR-18.1: server 端测试全部通过
  - `human-judgment` TR-18.2: 实际查询执行结果正确

# Task Dependencies

```
Task 1 (jsep 安装)
  └── Task 2 (类型定义)
        ├── Task 3 (AST 类)
        │     ├── Task 4 (解析器)
        │     ├── Task 5 (分析器)
        │     └── Task 6 (expr 导出)
        └── Task 7 (QuerySpec)
              └── Task 8 (Knex 构建器)
                    └── Task 9 (CTE 构建器)
                          └── Task 10 (sql 导出)

Task 3 (AST 类)
  └── Task 11 (Metric 适配器)
        └── Task 12 (Query 适配器)
              └── Task 13 (重构 KnexSQLGenerator)
                    └── Task 18 (验证后端)

Task 6, Task 10, Task 14
  └── Task 16 (更新导出)

Task 4, Task 7
  └── Task 15 (DSL v2)

所有任务
  └── Task 17 (单元测试)
```

# Parallel Execution Opportunities

以下任务可以并行执行：
- Task 4 (解析器) 和 Task 5 (分析器) 可以并行
- Task 11 (Metric 适配器) 和 Task 7 (QuerySpec) 可以并行
- Task 15 (DSL v2) 可以在 Phase 2 完成后独立进行
