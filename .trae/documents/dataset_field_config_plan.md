# 数据集字段配置改造 - 实现计划

## 概述
将数据集编辑器中的字段配置从简单的 string[] 改造为完整的对象结构，支持业务名称编辑，并适配表格多选式UI。

---

## [ ] 任务 1: 修改类型定义（editor.types.ts）
- **Priority**: P0
- **Depends On**: None
- **Description**: 
  - 新增 FormField 接口定义
  - 修改 DatasetFormData 中的 fields 类型从 string[] 改为 FormField[]
- **Success Criteria**:
  - 类型定义正确，没有 TypeScript 错误
- **Test Requirements**:
  - `programmatic` TR-1.1: 类型检查通过，无 TS 错误
- **Notes**: 确保 FormField 包含所有必要字段

---

## [ ] 任务 2: 改造 useDatasetForm Hook（第一部分）
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 修改 createEmptyFormData，将 fields 初始化为空数组
  - 修改 updateFormData 相关逻辑
  - 修改 getLockedFields，适配新的 FormField[] 结构
  - 修改 canGoNext 中对 fields 的判断
- **Success Criteria**:
  - 基本的 formData 状态管理正常工作
- **Test Requirements**:
  - `programmatic` TR-2.1: TypeScript 类型检查通过
  - `programmatic` TR-2.2: 代码 lint 检查通过

---

## [ ] 任务 3: 改造 useDatasetForm Hook（第二部分 - 字段操作）
- **Priority**: P0
- **Depends On**: Task 2
- **Description**: 
  - 修改 toggleField，改为操作 FormField 对象数组
  - 新增 updateFieldBusinessName 方法
  - 修改自动添加锁定字段的 useEffect
  - 更新所有相关依赖项
- **Success Criteria**:
  - 字段选择、取消选择、业务名称更新功能正常
- **Test Requirements**:
  - `programmatic` TR-3.1: TypeScript 类型检查通过
  - `programmatic` TR-3.2: 代码 lint 检查通过

---

## [ ] 任务 4: 改造 FieldConfigStep 组件（结构和逻辑）
- **Priority**: P0
- **Depends On**: Task 3
- **Description**: 
  - 修改组件 Props，新增 onUpdateFieldBusinessName
  - 修改 fieldsByTable 构建逻辑，适配 FormField
  - 将网格布局改为表格布局
  - 实现表格行的渲染逻辑
- **Success Criteria**:
  - 组件结构改造完成，UI 框架搭建完毕
- **Test Requirements**:
  - `programmatic` TR-4.1: TypeScript 类型检查通过
  - `programmatic` TR-4.2: 代码 lint 检查通过

---

## [ ] 任务 5: 改造 FieldConfigStep 组件（样式）
- **Priority**: P1
- **Depends On**: Task 4
- **Description**: 
  - 创建或修改 SCSS 样式文件
  - 实现表格样式（thead、tbody、tr、th、td）
  - 实现业务名称输入框样式
  - 保持原有的选中/锁定状态视觉反馈
- **Success Criteria**:
  - UI 样式美观，交互反馈清晰
- **Test Requirements**:
  - `human-judgment` TR-5.1: UI 布局合理，表格清晰易读
  - `human-judgment` TR-5.2: 选中/锁定状态视觉反馈正确
  - `programmatic` TR-5.3: 代码 lint 检查通过

---

## [ ] 任务 6: 修改 datasetEditPage.tsx（初始数据转换）
- **Priority**: P0
- **Depends On**: Task 1
- **Description**: 
  - 将后端返回的 DatasetFieldResponse 转换为 FormField 格式
  - 确保 backendId、dataSourceColumnId 等字段正确赋值
- **Success Criteria**:
  - 编辑模式下初始数据正确加载
- **Test Requirements**:
  - `programmatic` TR-6.1: TypeScript 类型检查通过
  - `programmatic` TR-6.2: 代码 lint 检查通过

---

## [ ] 任务 7: 修改 datasetCreatePage.tsx（提交逻辑）
- **Priority**: P0
- **Depends On**: Task 3
- **Description**: 
  - 将 FormField[] 转换为 CreateDatasetFieldRequest[] 格式
  - 将 JoinConfig[] 转换为 CreateDatasetJoinRequest[] 格式
  - 完整提交到后端
- **Success Criteria**:
  - 创建数据集时字段和 join 关系正确提交
- **Test Requirements**:
  - `programmatic` TR-7.1: TypeScript 类型检查通过
  - `programmatic` TR-7.2: 代码 lint 检查通过

---

## [ ] 任务 8: 修改 datasetEditPage.tsx（提交逻辑）
- **Priority**: P0
- **Depends On**: Task 3, Task 6
- **Description**: 
  - 对比 initialData 和当前 formData，计算 added/updated/deleted
  - 构建 EntityActionRequest&lt;AddField, UpdateField&gt; 格式
  - 完整提交到后端
- **Success Criteria**:
  - 编辑数据集时字段变更正确提交
- **Test Requirements**:
  - `programmatic` TR-8.1: TypeScript 类型检查通过
  - `programmatic` TR-8.2: 代码 lint 检查通过

---

## [ ] 任务 9: 整体测试和验证
- **Priority**: P0
- **Depends On**: Tasks 5, 7, 8
- **Description**: 
  - 测试创建数据集流程
  - 测试编辑数据集流程
  - 测试字段选择/取消选择
  - 测试业务名称编辑（包括清空自动恢复）
  - 测试锁定字段逻辑
  - 检查所有 TypeScript 和 lint 错误
- **Success Criteria**:
  - 所有功能正常工作，无错误
- **Test Requirements**:
  - `programmatic` TR-9.1: TypeScript 编译无错误
  - `programmatic` TR-9.2: ESLint 检查无错误
  - `human-judgment` TR-9.3: 所有功能按预期工作

---

## 并行执行策略
- Task 1 完成后，Task 2 和 Task 6 可以并行执行
- Task 2 完成后，Task 3 开始，同时 Task 6 可以继续
- Task 3 完成后，Task 4、Task 7 可以并行执行
- Task 4 完成后，Task 5 开始
- 所有任务完成后，Task 9 进行最终验证
