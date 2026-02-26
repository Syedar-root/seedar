# 类型标注优化计划 - DSL转换器

## 任务分析
当前问题：在 `dsl-transformer.ts` 文件中，映射表的类型标注使用了 `any` 类型，需要替换为更具体的类型定义，提高代码的类型安全性和可维护性。

## 计划步骤

### [x] 任务1：分析当前代码状态和类型定义
- **优先级**：P0
- **依赖**：无
- **描述**：
  - 检查 `dsl-transformer.ts` 文件中当前的类型标注
  - 分析 `dataset.types.ts` 文件中的相关类型定义
  - 确定需要使用的具体类型
- **成功标准**：
  - 明确所有映射表的正确类型定义
- **测试要求**：
  - `programmatic` TR-1.1: 确认 `dataset.types.ts` 中存在所需的类型定义
  - `human-judgement` TR-1.2: 验证类型定义与代码使用场景匹配

### [x] 任务2：更新导入语句
- **优先级**：P0
- **依赖**：任务1
- **描述**：
  - 在 `dsl-transformer.ts` 文件中添加所需的类型导入
  - 确保导入所有需要的类型定义
- **成功标准**：
  - 导入语句包含所有必要的类型
- **测试要求**：
  - `programmatic` TR-2.1: 编译无类型错误
  - `human-judgement` TR-2.2: 导入语句格式正确，无冗余导入

### [x] 任务3：更新映射表类型标注
- **优先级**：P0
- **依赖**：任务2
- **描述**：
  - 将 `tableMap` 的类型从 `Map<number, any>` 改为 `Map<number, DatasetTableResponse>`
  - 将 `fieldMap` 的类型从 `Map<number, any>` 改为 `Map<number, DatasetFieldResponse>`
  - 将 `metricMap` 的类型从 `Map<number, any>` 改为 `Map<number, DatasetMetricResponse>`
  - 保持 `joinMap` 的类型为 `Map<number, any>`（因为 `joins` 字段在 `DatasetResponse` 中类型为 `any[]`）
- **成功标准**：
  - 所有映射表都有正确的类型标注
- **测试要求**：
  - `programmatic` TR-3.1: 编译无类型错误
  - `human-judgement` TR-3.2: 类型标注与实际使用场景匹配

### [x] 任务4：验证修改
- **优先级**：P1
- **依赖**：任务3
- **描述**：
  - 运行类型检查命令验证修改
  - 确保代码能够正常编译
- **成功标准**：
  - 类型检查通过，无错误
- **测试要求**：
  - `programmatic` TR-4.1: `tsc --noEmit` 命令执行无错误
  - `human-judgement` TR-4.2: 代码逻辑保持不变，功能正常

## 预期结果
- 所有映射表都使用具体的类型标注，而不是 `any`
- 代码类型安全性提高，IDE 智能提示更准确
- 代码可维护性增强
- 编译无类型错误

## 风险评估
- **低风险**：修改仅涉及类型标注，不影响代码逻辑
- **注意事项**：确保导入所有必要的类型，避免类型错误