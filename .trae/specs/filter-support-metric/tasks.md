# Filter 支持 Metric 筛选 - 实现计划

## [x] Task 1: 修改 Filter 类构造函数和类型定义

- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 修改 Filter 类的构造函数参数类型，使其接受 Field 或 Metric 类型
  - 更新 field 属性的类型定义，使其支持两种类型
  - 导入 Metric 类型
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `programmatic` TR-1.1: 能够使用 Metric 对象创建 Filter 实例
  - `programmatic` TR-1.2: 能够使用 Field 对象创建 Filter 实例（向后兼容）
- **Notes**: 需要确保类型定义正确，支持联合类型

## [x] Task 2: 修改 Filter.toSQL() 方法生成逻辑

- **Priority**: P0
- **Depends On**: Task 1
- **Description**:
  - 修改 toSQL() 方法中的 fieldExpr 生成逻辑
  - 根据 field 属性的实际类型调用相应的方法
  - 对于 Field 类型，调用 getFullName()
  - 对于 Metric 类型，调用 toSQL() 并添加括号
- **Acceptance Criteria Addressed**: AC-2, AC-3
- **Test Requirements**:
  - `programmatic` TR-2.1: Field 类型生成正确的字段名表达式
  - `programmatic` TR-2.2: Metric 类型生成正确的指标表达式（带括号）
  - `programmatic` TR-2.3: 所有运算符都能正确处理
- **Notes**: 注意添加括号确保指标表达式的优先级正确

## [x] Task 3: 验证 TimeFilter 类的兼容性

- **Priority**: P1
- **Depends On**: Task 1, Task 2
- **Description**:
  - 检查 TimeFilter 类是否受影响
  - 确保 TimeFilter 的功能保持不变
  - 验证时间范围筛选仍然正常工作
- **Acceptance Criteria Addressed**: AC-5
- **Test Requirements**:
  - `programmatic` TR-3.1: TimeFilter 实例创建正常
  - `programmatic` TR-3.2: TimeFilter.toSQL() 生成正确的时间筛选 SQL
- **Notes**: TimeFilter 只使用 Field 类型，应该不受影响

## [x] Task 4: 测试各种 Metric 类型的筛选

- **Priority**: P1
- **Depends On**: Task 1, Task 2
- **Description**:
  - 测试 RowLevelMetric 的筛选
  - 测试 AggregateMetric 的筛选
  - 测试 ArithmeticMetric 的筛选
  - 确保所有指标类型都能正确生成 SQL
- **Acceptance Criteria Addressed**: AC-4, FR-4
- **Test Requirements**:
  - `programmatic` TR-4.1: RowLevelMetric 生成正确的 SQL 表达式
  - `programmatic` TR-4.2: AggregateMetric 生成正确的 SQL 表达式
  - `programmatic` TR-4.3: ArithmeticMetric 生成正确的 SQL 表达式
- **Notes**: 测试不同复杂度的指标表达式

## [x] Task 5: 运行现有测试确保向后兼容

- **Priority**: P1
- **Depends On**: Task 1, Task 2
- **Description**:
  - 运行项目现有的测试用例
  - 确保基于 Field 的筛选功能仍然正常
  - 修复可能出现的兼容性问题
- **Acceptance Criteria Addressed**: AC-3, NFR-1
- **Test Requirements**:
  - `programmatic` TR-5.1: 所有现有测试用例通过
  - `human-judgment` TR-5.2: 代码改动最小且合理
- **Notes**: 确保不破坏现有功能
