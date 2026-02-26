# Query Service Fix - 实施计划

## 问题分析
1. `getTablesFromDataset` 方法返回的类型不是 `Table` 类型，而是使用了类型断言
2. 代码中存在重复调用 `datasetService.findOne` 的问题，影响性能

## 任务分解与优先级

### [x] 任务 1: 修复类型不匹配问题
- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 修改 `getTablesFromDataset` 方法，使其返回正确的 `Table` 类型数组
  - 导入 `Field` 类并使用它创建字段对象
  - 移除 `execute` 方法中的类型断言
- **Success Criteria**:
  - `getTablesFromDataset` 方法的返回类型为 `Promise<Table[]>`
  - 方法返回的是真正的 `Table` 类型对象数组
  - `execute` 方法中不再需要类型断言
- **Test Requirements**:
  - `programmatic` TR-1.1: 代码编译通过，无类型错误
  - `programmatic` TR-1.2: 运行时测试通过，DSL 转换正常工作
  - `human-judgement` TR-1.3: 代码结构清晰，类型使用正确
- **Status**: 已完成
  - 导入了 `Field` 类
  - 修改了 `getTablesFromDataset` 方法返回类型为 `Promise<Table[]>`
  - 使用 `Field` 和 `Table` 构造函数创建正确的对象
  - 移除了 `execute` 方法中的类型断言

### [x] 任务 2: 消除重复调用问题
- **Priority**: P1
- **Depends On**: 任务 1
- **Description**:
  - 修改 `getTablesFromDataset` 方法，使其接受一个已有的 dataset 对象作为参数
  - 移除方法内部的数据库查询逻辑
  - 更新 `execute` 方法中的调用，传递已获取的 dataset 对象
- **Success Criteria**:
  - `getTablesFromDataset` 方法不再查询数据库
  - `execute` 方法中只查询一次数据库
  - 代码性能得到提升
- **Test Requirements**:
  - `programmatic` TR-2.1: 代码编译通过，无语法错误
  - `programmatic` TR-2.2: 运行时测试通过，功能正常
  - `human-judgement` TR-2.3: 代码逻辑清晰，无重复查询
- **Status**: 已完成
  - 修改了 `getTablesFromDataset` 方法参数为 dataset 对象
  - 移除了方法内部的数据库查询逻辑
  - 更新了 `execute` 方法中的调用，传递已获取的 dataset 对象

## 实施步骤
1. 完成任务 1：修复类型不匹配问题
2. 完成任务 2：消除重复调用问题
3. 运行测试验证修复效果
4. 提交代码变更

## 预期成果
- 代码类型使用正确，无类型断言
- 消除重复数据库查询，提高性能
- 代码结构更清晰，维护性更好