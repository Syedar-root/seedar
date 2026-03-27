# 数据源模块错误修复计划

## 发现的问题

### 1. 导入路径不一致
- `datasource/index.ts` 中有些导出路径不完整
- 部分组件的 index.ts 文件导出路径不正确

### 2. 类型定义导出问题
- `DatasourceType` 类型定义在 `DatasourceTypeSelector.tsx` 中
- `ConnectionForm` 中需要导入这个类型

## 修复步骤

### Step 1: 修复 datasource/index.ts 导出路径
- 确保所有组件的导出路径完整且正确
- 检查是否所有组件都有对应的导出

### Step 2: 修复 ConnectionForm 的类型导入
- 确保 `DatasourceType` 类型正确导入
- 检查导入路径是否正确

### Step 3: 验证所有组件的导入
- 检查 `DatasourceList.tsx` 中的导入
- 检查 `CreateDatasourceDialog.tsx` 中的导入
- 检查 `DeleteConfirmDialog.tsx` 中的导入

### Step 4: 测试所有组件
- 确保没有编译错误
- 确保所有组件可以正确导入和使用

## 预期结果
- 所有 linter 错误修复
- 所有导入路径正确
- 所有组件可以正常工作
