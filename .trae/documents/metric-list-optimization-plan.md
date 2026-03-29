# 指标展示优化实施计划

## 📋 任务概述

优化 `MetricList` 组件的指标展示：
1. 移除指标类型展示
2. 展示 `expression` 内容，无则显示 `-`
3. 将 `#Fxxx` / `#Mxxx` 替换为对应的业务名称/原始名称
4. 添加切换按钮支持业务名称/原始名称切换

---

## 🔄 任务拆分与依赖关系

```
┌─────────────────────────────────────────────────────────────┐
│                    Phase 1: 类型同步                         │
│  [Task-1] 同步 DatasetMetricResponse 类型定义                │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Phase 2: 组件改造                         │
│  [Task-2] 改造 MetricList 组件                              │
│  [Task-3] 更新 MetricList 样式                              │
│  (Task-2 和 Task-3 可并行执行)                               │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Phase 3: 父组件调整                       │
│  [Task-4] 更新 datasetDetailPage 调用                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    Phase 4: 验证                            │
│  [Task-5] 类型检查与构建验证                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 详细任务说明

### Task-1: 同步类型定义
**文件**: `packages/types/src/dataset/dataset.types.ts`

**操作**:
- 在 `DatasetMetricResponse` 接口中添加 `expression?: string;` 字段

**依赖**: 无（可立即执行）

---

### Task-2: 改造 MetricList 组件
**文件**: `apps/web-client/src/modules/dataset/components/MetricList/MetricList.tsx`

**操作**:
1. 新增 `fields` prop
2. 新增 `displayMode` 状态 (`'business' | 'original'`)，默认 `'business'`
3. 新增 `resolveExpression` 函数：
   - 正则匹配 `#F(\d+)` 替换为字段名称
   - 正则匹配 `#M(\d+)` 替换为指标名称
   - 根据 `displayMode` 决定使用业务名称还是原始名称
   - 业务名称：`businessName`，无则 fallback 到原始名称
   - 原始名称：字段用 `name`，指标用 `alias`
4. 删除 `getMetricTypeLabel`、`getAggregateLabel`、`getMetricFormula` 函数
5. 删除类型 badge 展示
6. 改用 `expression` 展示（无则显示 `-`）
7. 添加头部切换按钮区域

**依赖**: Task-1 完成

---

### Task-3: 更新 MetricList 样式
**文件**: `apps/web-client/src/modules/dataset/components/MetricList/MetricList.module.scss`

**操作**:
1. 添加 `.header` 样式（flex 布局，包含数量 + 切换按钮）
2. 添加 `.toggle` 切换按钮组样式
3. 添加 `.toggleButton` 单个按钮样式（含 active 状态）
4. 调整 `.metricItem` 移除类型相关样式
5. 确保 `.metricFormula` 改名为 `.expression` 或复用

**依赖**: 无（可与 Task-2 并行执行）

---

### Task-4: 更新父组件调用
**文件**: `apps/web-client/src/modules/dataset/pages/datasetDetailPage.tsx`

**操作**:
- 修改 `<MetricList metrics={dataset.metrics || []} />` 
- 改为 `<MetricList metrics={dataset.metrics || []} fields={dataset.fields || []} />`

**依赖**: Task-2 完成

---

### Task-5: 验证构建
**操作**:
- 运行 TypeScript 类型检查
- 运行构建验证

**依赖**: Task-1 ~ Task-4 全部完成

---

## ⚡ 并行执行策略

| 批次 | 任务 | 说明 |
|------|------|------|
| Batch 1 | Task-1 | 类型同步，必须先完成 |
| Batch 2 | Task-2, Task-3 | 组件逻辑与样式可并行 |
| Batch 3 | Task-4 | 父组件调整 |
| Batch 4 | Task-5 | 最终验证 |

---

## 📁 涉及文件清单

| 文件路径 | 操作类型 |
|----------|----------|
| `packages/types/src/dataset/dataset.types.ts` | 编辑 |
| `apps/web-client/src/modules/dataset/components/MetricList/MetricList.tsx` | 编辑 |
| `apps/web-client/src/modules/dataset/components/MetricList/MetricList.module.scss` | 编辑 |
| `apps/web-client/src/modules/dataset/pages/datasetDetailPage.tsx` | 编辑 |
