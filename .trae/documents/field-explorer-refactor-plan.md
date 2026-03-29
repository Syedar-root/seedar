# FieldExplorer 组件重构计划

## 项目概述

将 FieldExplorer 组件从单表格形式重构为使用 baseUI Accordion 组件的折叠式卡片形式，按表分组展示字段。

## 核心变更点

| 项目 | 当前状态 | 目标状态 |
|------|----------|----------|
| 展示形式 | 单表格 | 折叠式卡片（Accordion） |
| 表名来源 | `datasetName`（错误） | `tableName`（正确） |
| 主表标识 | 无 | 显示"主表"标签 |
| 分组方式 | 无分组 | 按表分组 |

## 任务分解与依赖关系

### 阶段一：数据层准备（无依赖，可并行）

| 任务ID | 任务名称 | 依赖 | 可并行 | 预估复杂度 |
|--------|----------|------|--------|------------|
| T1.1 | 分析现有 FieldExplorer 数据流 | 无 | ✅ | 低 |
| T1.2 | 确认 mainTableId 传递路径 | 无 | ✅ | 低 |
| T1.3 | 设计字段分组数据结构 | 无 | ✅ | 低 |

### 阶段二：组件重构（依赖阶段一）

| 任务ID | 任务名称 | 依赖 | 可并行 | 预估复杂度 |
|--------|----------|------|--------|------------|
| T2.1 | 重构 FieldExplorer 组件主体 | T1.1-T1.3 | ❌ | 中 |
| T2.2 | 创建 TableFieldGroup 子组件 | T2.1 | ✅ | 中 |
| T2.3 | 重写 FieldExplorer 样式文件 | T2.1 | ✅ | 中 |
| T2.4 | 更新详情页传递 mainTableId | T2.1 | ✅ | 低 |

### 阶段三：验证与优化（依赖阶段二）

| 任务ID | 任务名称 | 依赖 | 可并行 | 预估复杂度 |
|--------|----------|------|--------|------------|
| T3.1 | 构建验证 | T2.1-T2.4 | ❌ | 低 |
| T3.2 | 样式微调 | T3.1 | ✅ | 低 |

## 并行执行策略

### 第一波并行（Subagent 1: 数据分析）

```
┌─────────────────────────────────────────────────────────────┐
│                    Subagent 1: 数据分析                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   T1.1      │ │   T1.2      │ │   T1.3      │           │
│  │ 分析数据流   │ │ 确认ID传递  │ │ 设计分组结构 │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### 第二波并行（Subagent 分组执行）

```
┌──────────────────────┐  ┌──────────────────────┐
│   Subagent 2: 核心    │  │  Subagent 3: 样式    │
│  ┌────────────────┐  │  │  ┌────────────────┐  │
│  │ T2.1 主体重构   │  │  │  │ T2.3 样式重写   │  │
│  │ T2.2 子组件    │  │  │  │                │  │
│  │ T2.4 传递ID    │  │  │  │                │  │
│  └────────────────┘  │  │  └────────────────┘  │
└──────────────────────┘  └──────────────────────┘
```

### 第三波串行（主线程执行）

```
T3.1 构建验证 → T3.2 样式微调
```

## 详细任务描述

### T1.1 分析现有 FieldExplorer 数据流

**目标**: 理解当前组件的数据来源和流向

**执行内容**:
1. 读取 FieldExplorer.tsx 分析 props
2. 读取 datasetDetailPage.tsx 确认数据传递
3. 确认 DatasetFieldResponse 和 DatasetTableResponse 类型定义

**输出**: 数据流分析报告

---

### T1.2 确认 mainTableId 传递路径

**目标**: 确认主表 ID 如何传递到 FieldExplorer

**执行内容**:
1. 检查 DatasetResponse 是否包含 mainTableId
2. 确认 datasetDetailPage 是否可以获取 mainTableId
3. 设计 props 扩展方案

**输出**: mainTableId 传递方案

---

### T1.3 设计字段分组数据结构

**目标**: 设计按表分组的数据结构

**执行内容**:
1. 定义 TableFieldGroup 接口
2. 设计分组函数逻辑
3. 确定排序规则（主表优先）

**输出**: 数据结构定义

```typescript
interface TableFieldGroup {
  tableId: number;
  tableName: string;
  isMainTable: boolean;
  fields: DatasetFieldResponse[];
}
```

---

### T2.1 重构 FieldExplorer 组件主体

**目标**: 使用 baseUI Accordion 重构组件

**执行内容**:
1. 导入 Accordion 组件
2. 实现字段分组逻辑
3. 渲染 Accordion 结构
4. 处理空状态

**关键代码结构**:
```tsx
import { Accordion } from '@base-ui/react/accordion';

export const FieldExplorer = ({ fields, tables, mainTableId }: FieldExplorerProps) => {
  const groupedFields = groupFieldsByTable(fields, tables, mainTableId);
  
  return (
    <Accordion.Root multiple defaultValue={[mainTableId?.toString()]}>
      {groupedFields.map((group) => (
        <Accordion.Item key={group.tableId} value={group.tableId.toString()}>
          ...
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
};
```

---

### T2.2 创建 TableFieldGroup 子组件

**目标**: 创建表字段组展示组件

**执行内容**:
1. 创建 Trigger 部分（表名 + 主表标签 + 字段数 + 展开图标）
2. 创建 Panel 部分（字段表格）
3. 处理展开/折叠动画

---

### T2.3 重写 FieldExplorer 样式文件

**目标**: 重写样式以适配 Accordion 结构

**执行内容**:
1. 定义 Accordion.Root 样式
2. 定义 Accordion.Item 样式
3. 定义 Accordion.Trigger 样式（包含主表标签样式）
4. 定义 Accordion.Panel 样式
5. 定义字段表格样式
6. 添加展开/折叠动画

**关键样式**:
```scss
.item {
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-base);
  margin-bottom: var(--spacing-sm);
  
  &[data-open] {
    .chevron {
      transform: rotate(180deg);
    }
  }
}

.trigger {
  display: flex;
  align-items: center;
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-elevated);
  border: none;
  cursor: pointer;
}

.mainTableBadge {
  background: var(--primary-light);
  color: var(--primary);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--font-xs);
  margin-left: var(--spacing-xs);
}
```

---

### T2.4 更新详情页传递 mainTableId

**目标**: 在 datasetDetailPage 中传递 mainTableId 给 FieldExplorer

**执行内容**:
1. 从 dataset 中获取 mainTableId
2. 更新 FieldExplorer 组件调用

**修改位置**: `datasetDetailPage.tsx`

```tsx
<FieldExplorer
  fields={dataset.fields || []}
  tables={dataset.tables || []}
  mainTableId={dataset.mainTableId}
/>
```

---

### T3.1 构建验证

**目标**: 验证代码构建成功

**执行内容**:
1. 运行 `npm run build`
2. 检查是否有类型错误
3. 检查是否有样式错误

---

### T3.2 样式微调

**目标**: 微调样式细节

**执行内容**:
1. 检查展开/折叠动画是否流畅
2. 检查主表标签位置是否正确
3. 检查响应式布局

## 文件变更清单

| 文件路径 | 操作 | 说明 |
|----------|------|------|
| `components/FieldExplorer/FieldExplorer.tsx` | 重写 | 使用 Accordion 重构 |
| `components/FieldExplorer/FieldExplorer.module.scss` | 重写 | 适配 Accordion 样式 |
| `pages/datasetDetailPage.tsx` | 修改 | 传递 mainTableId |

## 验收清单

- [ ] 字段按表分组展示
- [ ] 使用 tableName 作为表名
- [ ] 主表显示"主表"标签
- [ ] 主表默认展开
- [ ] 支持同时展开多个表
- [ ] 展开/折叠动画流畅
- [ ] 构建成功无错误
- [ ] 样式符合项目设计规范

## 风险与注意事项

1. **baseUI Accordion 导入**: 确认 `@base-ui/react/accordion` 路径正确
2. **mainTableId 可能为空**: 需要处理 mainTableId 不存在的情况
3. **字段无所属表**: 需要处理 fields 中 tableId 不在 tables 中的情况
4. **动画性能**: 使用 CSS 变量 `--accordion-panel-height` 实现平滑动画

## 执行时间估算

| 阶段 | 预估时间 | 并行加速后 |
|------|----------|-----------|
| 阶段一 | 10分钟 | 5分钟 |
| 阶段二 | 25分钟 | 15分钟 |
| 阶段三 | 10分钟 | 10分钟 |
| **总计** | **45分钟** | **30分钟** |
