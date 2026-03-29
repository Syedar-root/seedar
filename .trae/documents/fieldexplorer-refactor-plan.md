# FieldExplorer 组件重构计划

## 项目概述

使用 baseUI Accordion 组件重构 FieldExplorer，实现字段按表分组展示，使用 `tableName` 作为表名，并标识主表。

## 技术栈

- **组件库**: baseUI Accordion (`@base-ui/react/accordion`)
- **图标**: Lucide React (`Table2`, `ChevronDown`, `Key`)
- **样式**: SCSS Modules + CSS Variables

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
| T2.2 | 重写 FieldExplorer 样式文件 | T2.1 | ✅ | 中 |
| T2.3 | 更新详情页传递 mainTableId | T2.1 | ✅ | 低 |

### 阶段三：验证与优化（依赖阶段二）

| 任务ID | 任务名称 | 依赖 | 可并行 | 预估复杂度 |
|--------|----------|------|--------|------------|
| T3.1 | 构建验证 | T2.1-T2.3 | ❌ | 低 |
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

### 第二波串行 + 并行

```
T2.1 主体重构（串行）
    ↓
┌──────────────────────┐  ┌──────────────────────┐
│   Subagent 2: 样式    │  │  Subagent 3: 页面    │
│  ┌────────────────┐  │  │  ┌────────────────┐  │
│  │ T2.2 样式重写   │  │  │  │ T2.3 传递ID    │  │
│  └────────────────┘  │  │  └────────────────┘  │
└──────────────────────┘  └──────────────────────┘
```

### 第三波串行

```
T3.1 构建验证 → T3.2 样式微调
```

## 详细任务描述

### T1.1 分析现有 FieldExplorer 数据流

**目标**: 理解当前组件的数据来源和流向

**执行内容**:
1. 读取 `FieldExplorer.tsx` 分析 props
2. 读取 `datasetDetailPage.tsx` 确认数据传递
3. 确认 `DatasetFieldResponse` 和 `DatasetTableResponse` 类型定义

**输出**: 数据流分析报告

---

### T1.2 确认 mainTableId 传递路径

**目标**: 确认主表 ID 如何传递到 FieldExplorer

**执行内容**:
1. 检查 `DatasetResponse` 是否包含 `mainTableId`
2. 确认 `datasetDetailPage` 是否可以获取 `mainTableId`
3. 设计 props 扩展方案

**输出**: mainTableId 传递方案

---

### T1.3 设计字段分组数据结构

**目标**: 设计按表分组的数据结构

**执行内容**:
1. 定义 `TableFieldGroup` 接口
2. 设计分组函数逻辑
3. 确定排序规则（主表优先）

**输出**: 数据结构定义

```typescript
interface TableFieldGroup {
  tableId: number;
  tableName: string;      // 使用 tableName，不是 datasetName
  isMainTable: boolean;
  fields: DatasetFieldResponse[];
}
```

---

### T2.1 重构 FieldExplorer 组件主体

**目标**: 使用 baseUI Accordion 重构组件

**执行内容**:
1. 导入 Accordion 组件：`import { Accordion } from '@base-ui/react/accordion'`
2. 实现 `groupFieldsByTable` 分组函数
3. 渲染 Accordion 结构
4. 处理空状态
5. 主表默认展开（通过 `defaultValue` 设置）

**关键代码结构**:
```tsx
import { Accordion } from '@base-ui/react/accordion';
import { ChevronDown, Table2 } from 'lucide-react';

export const FieldExplorer = ({ fields, tables, mainTableId }: FieldExplorerProps) => {
  const groupedFields = groupFieldsByTable(fields, tables, mainTableId);
  const defaultOpen = mainTableId ? [mainTableId.toString()] : [];
  
  if (!fields || fields.length === 0) {
    return <EmptyState />;
  }

  return (
    <Accordion.Root multiple defaultValue={defaultOpen} className={styles.accordion}>
      {groupedFields.map((group) => (
        <Accordion.Item key={group.tableId} value={group.tableId.toString()} className={styles.item}>
          <Accordion.Header className={styles.header}>
            <Accordion.Trigger className={styles.trigger}>
              <Table2 size={16} className={styles.tableIcon} />
              <span className={styles.tableName}>{group.tableName}</span>
              {group.isMainTable && <span className={styles.mainBadge}>主表</span>}
              <span className={styles.fieldCount}>{group.fields.length} 字段</span>
              <ChevronDown size={16} className={styles.chevron} />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className={styles.panel}>
            <FieldTable fields={group.fields} />
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
};
```

---

### T2.2 重写 FieldExplorer 样式文件

**目标**: 重写样式以适配 Accordion 结构

**执行内容**:
1. 定义 `Accordion.Root` 样式
2. 定义 `Accordion.Item` 样式
3. 定义 `Accordion.Trigger` 样式（包含主表标签样式）
4. 定义 `Accordion.Panel` 样式
5. 定义字段表格样式
6. 添加展开/折叠动画

**关键样式**:
```scss
.accordion {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.item {
  border: 1px solid var(--border-secondary);
  border-radius: var(--radius-base);
  background: var(--bg-elevated);
  overflow: hidden;
  transition: border-color 0.15s ease;

  &[data-open] {
    border-color: var(--border-hover);
    
    .chevron {
      transform: rotate(180deg);
    }
  }
}

.trigger {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: var(--font-sm);
  color: var(--text-primary);
  transition: background-color 0.15s ease;

  &:hover {
    background: var(--bg-hover);
  }
}

.tableIcon {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.tableName {
  font-weight: 600;
  flex: 1;
}

.mainBadge {
  background: var(--primary-light);
  color: var(--primary);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--font-xs);
  font-weight: 500;
}

.fieldCount {
  font-size: var(--font-xs);
  color: var(--text-tertiary);
}

.chevron {
  color: var(--text-tertiary);
  transition: transform 0.2s ease;
  flex-shrink: 0;
}

.panel {
  padding: 0 var(--spacing-md) var(--spacing-md);
  transition: height 0.2s ease;
}
```

---

### T2.3 更新详情页传递 mainTableId

**目标**: 在 datasetDetailPage 中传递 mainTableId 给 FieldExplorer

**执行内容**:
1. 从 `dataset` 中获取 `mainTableId`
2. 更新 `FieldExplorer` 组件调用

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

- [x] 字段按表分组展示
- [x] 使用 `tableName` 作为表名（不是 `datasetName`）
- [x] 主表显示"主表"标签
- [x] 主表默认展开
- [x] 支持同时展开多个表（`multiple={true}`）
- [x] 展开/折叠动画流畅
- [x] 构建成功无错误
- [x] 样式符合项目设计规范

## 风险与注意事项

1. **baseUI Accordion 导入**: 确认 `@base-ui/react/accordion` 路径正确
2. **mainTableId 可能为空**: 需要处理 `mainTableId` 不存在的情况
3. **字段无所属表**: 需要处理 `fields` 中 `tableId` 不在 `tables` 中的情况
4. **动画性能**: 使用 CSS 变量 `--accordion-panel-height` 实现平滑动画

## 执行时间估算

| 阶段 | 预估时间 | 并行加速后 |
|------|----------|-----------|
| 阶段一 | 10分钟 | 5分钟 |
| 阶段二 | 20分钟 | 15分钟 |
| 阶段三 | 10分钟 | 10分钟 |
| **总计** | **40分钟** | **30分钟** |
