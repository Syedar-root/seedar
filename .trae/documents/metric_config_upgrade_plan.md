
# MetricConfigStep - 升级方案（集成 FormulaEditor

## 概述

本计划将 `metricEditor` 组件复制到 `MetricConfigStep`，提供与 panel 模块一致的指标编辑体验。

---

## [x] 任务 1：更新类型定义 (editor.types.ts)
- **优先级：P0
- **依赖**：无
- **描述**：为 `MetricConfig` 接口新增 `businessName` 字段
- **成功标准**：
  - `MetricConfig` 类型包含 `businessName?: string`
- **测试要求**：
  - `programmatic` TR-1.1: 类型检查通过
  - `human-judgement` TR-1.2: 代码可编译成功

---

## [ ] 任务 2：复制 useFormulaParser.ts
- **优先级**：P0
- **依赖**：任务 1
- **描述**：复制 `useFormulaParser.ts` 到 MetricConfigStep 目录
- **成功标准**：文件复制完成
- **测试要求**：
  - `programmatic` TR-2.1: 文件存在
  - `human-judgement` TR-2.2: 无 TypeScript 错误
- **注意**：需要处理 id 类型兼容性（当前 FormField.id 是 string，DatasetFieldResponse.id 是 number）

---

## [ ] 任务 3：复制 FormulaSuggestion.tsx
- **优先级**：P0
- **依赖**：任务 2
- **描述**：复制 `FormulaSuggestion.tsx` 到 MetricConfigStep 目录
- **成功标准**：文件复制完成
- **测试要求**：
  - `programmatic` TR-3.1: 文件存在
  - `human-judgement` TR-3.2: 无 TypeScript 错误

---

## [ ] 任务 4：复制 FormulaEditor.tsx
- **优先级**：P0
- **依赖**：任务 3
- **描述**：复制 `FormulaEditor.tsx` 到 MetricConfigStep 目录
- **成功标准**：文件复制完成
- **测试要求**：
  - `programmatic` TR-4.1: 文件存在
  - `human-judgement` TR-4.2: 无 TypeScript 错误

---

## [ ] 任务 5：复制样式文件
- **优先级**：P0
- **依赖**：任务 4
- **描述**：复制所有样式文件到 MetricConfigStep 目录
- **文件列表**：
  - `formulaEditor.module.scss`
  - `formulaSuggestion.module.scss`
  - `metricEditorDialog.module.scss` (重命名为 `metricDialog.module.scss`)
- **成功标准**：所有样式文件复制完成
- **测试要求**：
  - `programmatic` TR-5.1: 所有样式文件存在
  - `human-judgement` TR-5.2: 样式导入路径正确

---

## [ ] 任务 6：创建 MetricDialog.tsx
- **优先级**：P0
- **依赖**：任务 5
- **描述**：基于 `metricEditorDialog.tsx` 改造为 `MetricDialog.tsx`
- **主要改动**：
  - 移除 `useUpdateDataset` 和实时保存逻辑
  - 改为通过 props 接收 `onSave` 回调
  - 支持新建和编辑两种模式
  - 适配 `FormField[]` 和 `MetricConfig[]` 类型
- **成功标准**：
  - Dialog 组件能正常打开/关闭
  - 表单验证正确
  - onSave 回调正确返回数据
- **测试要求**：
  - `programmatic` TR-6.1: 类型检查通过
  - `human-judgement` TR-6.2: UI 呈现正常

---

## [ ] 任务 7：修改 MetricConfigStep.tsx
- **优先级**：P0
- **依赖**：任务 6
- **描述**：集成 Dialog 和 FormulaEditor
- **主要改动**：
  - 移除内联编辑 UI
  - 点击"新建指标"打开 Dialog（新建模式）
  - 点击"编辑"图标打开 Dialog（编辑模式）
  - 传入 `formData.fields` 作为 fields
  - 传入 `formData.metrics` 作为 metrics
- **成功标准**：
  - 新建/编辑指标功能正常
  - 数据正确保存到 `formData.metrics`
- **测试要求**：
  - `programmatic` TR-7.1: 类型检查通过
  - `human-judgement` TR-7.2: 交互流畅

---

## [ ] 任务 8：类型适配 useFormulaParser - 处理 id 类型兼容
- **优先级**：P0
- **依赖**：任务 4
- **描述**：修改 useFormulaParser，支持 string 类型 id
- **主要改动**：
  - 将 id 类型从 `number` 改为 `string | number
  - 更新相关接口类型定义
  - 确保 toDisplay/toStorage 兼容两种格式
- **成功标准**：公式编辑功能正常
- **测试要求**：
  - `programmatic` TR-8.1: 类型检查通过
  - `human-judgement` TR-8.2: 公式自动补全功能正常

---

## [ ] 任务 9：运行类型检查
- **优先级**：P0
- **依赖**：任务 8
- **描述**：运行 TypeScript 类型检查确保没有错误
- **成功标准**：无类型错误
- **测试要求**：
  - `programmatic` TR-9.1: tsc 检查通过
  - `human-judgement` TR-9.2: 无 lint 检查通过

---

## 依赖关系图

```
任务 1 (类型定义)
    ↓
任务 2 (useFormulaParser) → 任务 8 (id 类型兼容)
    ↓                                    ↓
任务 3 (FormulaSuggestion)              |
    ↓                                    |
任务 4 (FormulaEditor)                 |
    ↓                                    |
任务 5 (样式文件)                       |
    ↓                                    |
任务 6 (MetricDialog) ←───────────────┘
    ↓
任务 7 (MetricConfigStep)
    ↓
任务 9 (类型检查)
```

---

## 并行执行

以下任务可并行：
- 任务 2-5（文件复制）可按顺序串行执行
- 任务 8 在任务 2 完成后立即开始
