# Filter 支持 Metric 筛选 - 产品需求文档

## Overview
- **Summary**: 扩展 Filter 类，使其能够支持对 Metric（指标）类型进行筛选，而不仅限于 Field（字段）类型。
- **Purpose**: 解决当前 Filter 类只能对字段进行筛选的限制，实现对计算指标的筛选能力，增强查询引擎的灵活性。
- **Target Users**: 使用 Metric Engine 构建数据分析查询的开发者。

## Goals
- 扩展 Filter 类，支持 Metric 类型作为筛选条件的目标
- 确保生成的 SQL 语法正确，能够正确处理指标表达式
- 保持向后兼容性，不影响现有基于 Field 的筛选功能
- 支持各种类型指标的筛选，包括行级指标、聚合指标等

## Non-Goals (Out of Scope)
- 不修改现有的 Field 类实现
- 不修改 SQL 生成器的核心逻辑
- 不添加新的运算符类型
- 不处理复杂的子查询嵌套筛选

## Background & Context
- 当前 Filter 类的构造函数只接受 Field 类型参数
- Filter.toSQL() 方法调用 field.getFullName() 获取字段名
- Metric 类是抽象基类，有多种实现，都有 toSQL() 方法但没有 getFullName() 方法
- 指标可以是简单的字段运算，也可以是复杂的聚合计算或子查询

## Functional Requirements
- **FR-1**: 修改 Filter 类构造函数，使其能够接受 Field 或 Metric 类型
- **FR-2**: 修改 Filter.toSQL() 方法，根据类型生成正确的 SQL 表达式
- **FR-3**: 确保 TimeFilter 类的兼容性，保持其功能不变
- **FR-4**: 支持所有 Metric 子类的筛选，包括 RowLevelMetric、AggregateMetric 等

## Non-Functional Requirements
- **NFR-1**: 保持向后兼容性，现有基于 Field 的筛选代码无需修改
- **NFR-2**: 生成的 SQL 语法正确，能够在主流数据库中执行
- **NFR-3**: 代码改动最小化，只修改必要的部分

## Constraints
- **Technical**: 保持与现有 Metric 类和 Field 类的接口兼容
- **Dependencies**: 依赖 metric-classes.ts 中的 Metric 类定义

## Assumptions
- 所有 Metric 子类都正确实现了 toSQL() 方法
- 筛选条件中的指标表达式在 SQL 语法上是有效的
- 数据库支持对计算表达式的筛选

## Acceptance Criteria

### AC-1: Filter 构造函数支持 Metric 类型
- **Given**: 开发者创建 Filter 实例时传入 Metric 对象
- **When**: 调用构造函数 new Filter(metric, operator, value)
- **Then**: 构造函数成功执行，创建 Filter 实例
- **Verification**: `programmatic`

### AC-2: 生成正确的 SQL 表达式
- **Given**: Filter 实例包含 Metric 对象
- **When**: 调用 filter.toSQL() 方法
- **Then**: 返回包含指标表达式的正确 SQL 字符串
- **Verification**: `programmatic`

### AC-3: 保持 Field 类型的向后兼容性
- **Given**: Filter 实例包含 Field 对象
- **When**: 调用 filter.toSQL() 方法
- **Then**: 返回与之前相同的 SQL 字符串格式
- **Verification**: `programmatic`

### AC-4: 支持各种运算符
- **Given**: Filter 实例包含 Metric 对象和不同运算符
- **When**: 调用 filter.toSQL() 方法
- **Then**: 所有运算符都能正确处理，包括等于、不等于、大于、小于、LIKE、IN 等
- **Verification**: `programmatic`

### AC-5: TimeFilter 功能不受影响
- **Given**: 创建 TimeFilter 实例
- **When**: 调用 timeFilter.toSQL() 方法
- **Then**: 返回与之前相同的时间范围筛选 SQL
- **Verification**: `programmatic`

## Open Questions
- [ ] 是否需要对某些复杂指标（如子查询指标）的筛选做特殊处理？
- [ ] 指标筛选在性能方面是否需要考虑优化？