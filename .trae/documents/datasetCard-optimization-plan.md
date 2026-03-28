# 数据集列表页面 DatasetCard 优化计划

## 📋 任务概述

对 `DatasetCard` 组件进行**信息架构 + 视觉层级 + 交互体验**的全方位优化。

### 涉及文件
| 文件 | 路径 |
|------|------|
| DatasetCard 组件 | `apps/web-client/src/modules/dataset/components/DatasetCard/DatasetCard.tsx` |
| DatasetCard 样式 | `apps/web-client/src/modules/dataset/components/DatasetCard/DatasetCard.module.scss` |

### 任务依赖关系图
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │ Task 1           │         │ Task 2           │         │
│  │ 更新 DatasetCard │────────▶│ 更新样式文件     │         │
│  │ .tsx 文件        │         │ .module.scss     │         │
│  └──────────────────┘         └──────────────────┘         │
│          │                            │                     │
│          └────────────┬───────────────┘                     │
│                       ▼                                     │
│              ┌──────────────────┐                           │
│              │ Task 3           │                           │
│              │ 验证与自检       │                           │
│              └──────────────────┘                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 任务拆解

### Task 1: 更新 DatasetCard.tsx（信息架构重构）

**前置条件**: 无

**修改内容**:

1. **新增 imports**:
   - `BarChart3` from `lucide-react`（替代 Eye 作为主要操作图标）
   - `Pencil` from `lucide-react`（编辑图标）

2. **修改 Header 区域**:
   - 名称 `font-weight` 改为 700（已有语义）
   - 状态徽章保持不变

3. **新增「元信息摘要行」**（替代原来的 infoRow）:
   ```tsx
   <div className={styles.metaRow}>
     <span className={styles.metaItem}>
       <Layers size={14} /> {dataset.tables?.length || 0}表
     </span>
     <span className={styles.separator}>·</span>
     <span className={styles.metaItem}>
       <span>📋</span> {dataset.fields?.length || 0}字段
     </span>
     <span className={styles.separator}>·</span>
     <span className={styles.metaItem}>
       <span>📐</span> {dataset.metrics?.length || 0}指标
     </span>
     <span className={styles.separator}>·</span>
     <span className={styles.metaItem}>
       <Settings size={14} /> {dataset.joins?.length || 0}关联
     </span>
   </div>
   ```

4. **删除原有的 infoRow 信息**:
   - 移除"类型"一行（类型信息降权，暂不显示或放入 metaRow）
   - 移除"数据源"一行（信息冗余）
   - 移除"字段 / 指标"一行（已移入 metaRow）

5. **修改 Footer 操作按钮组**:
   - 主要操作改为"进入模型"（`BarChart3` 图标 + "进入模型"文字）
   - 次要操作"编辑"（只保留图标，hover 显示文字）
   - 危险操作"删除"保持不变

6. **修改 onViewDetails 为 onEnterModel**（语义更清晰）

---

### Task 2: 更新 DatasetCard.module.scss（视觉样式）

**前置条件**: Task 1 完成

**修改内容**:

1. **Header 样式微调**:
   ```scss
   .name {
     font-size: 18px;
     font-weight: 700;
   }
   ```

2. **新增 metaRow 元信息摘要行样式**:
   ```scss
   .metaRow {
     display: flex;
     align-items: center;
     gap: 12px;
     padding: 8px 12px;
     background: var(--bg-base);
     border-radius: var(--radius-sm);
     margin: var(--spacing-sm) 0;
   }

   .metaItem {
     display: flex;
     align-items: center;
     gap: 4px;
     font-size: 12px;
     color: var(--text-tertiary);

     svg {
       color: var(--primary);
       opacity: 0.7;
     }
   }

   .separator {
     color: var(--border-base);
   }
   ```

3. **删除原有的 infoRow, label, value 样式**（不再使用）

4. **操作按钮组样式重构**:
   ```scss
   .footer {
     display: flex;
     align-items: center;
     gap: var(--spacing-sm);
     padding-top: var(--spacing-sm);
     border-top: 1px solid var(--border-secondary);
     margin-top: auto;
   }

   .primaryAction {
     flex: 1;
     display: flex;
     align-items: center;
     justify-content: center;
     gap: var(--spacing-xs);
     padding: var(--spacing-sm) var(--spacing-md);
     background: var(--primary);
     color: var(--text-inverse);
     border: none;
     border-radius: var(--radius-base);
     font-size: var(--font-sm);
     font-weight: 500;
     cursor: pointer;
     transition: background-color var(--transition-fast);

     &:hover {
       background: var(--primary-hover);
     }
   }

   .secondaryAction {
     display: flex;
     align-items: center;
     justify-content: center;
     padding: var(--spacing-sm);
     min-width: 36px;
     background: transparent;
     color: var(--text-secondary);
     border: 1px solid var(--border-base);
     border-radius: var(--radius-sm);
     cursor: pointer;
     transition: all var(--transition-fast);

     &:hover {
       background: var(--bg-hover);
       border-color: var(--border-hover);
       color: var(--text-primary);
     }
   }

   .dangerAction {
     @extend .secondaryAction;
     color: var(--danger);

     &:hover {
       background: var(--danger-light);
       border-color: var(--danger);
     }
   }
   ```

5. **删除原有的 actionButton 和 deleteButton 样式**

6. **Hover 动效增强**:
   ```scss
   .card {
     transition: transform var(--transition-fast),
                 box-shadow var(--transition-fast),
                 border-color var(--transition-fast);

     &:hover {
       transform: translateY(-2px);
       box-shadow: var(--shadow-lg);
       border-color: var(--primary);
     }
   }
   ```

---

### Task 3: 验证与自检

**前置条件**: Task 1 & Task 2 完成

**检查项**:

1. [ ] TypeScript 编译无错误
2. [ ] 组件正确渲染所有字段
3. [ ] 样式无语法错误
4. [ ] 删除按钮点击触发 `onDelete` 回调
5. [ ] 编辑按钮点击触发 `onEdit` 回调
6. [ ] 进入模型按钮点击触发 `onViewDetails` 回调
7. [ ] Hover 动效正常

---

## 🔄 SubAgent 并行执行策略

| Agent | 任务 | 依赖 |
|-------|------|------|
| Agent-1 | 执行 Task 1（DatasetCard.tsx） | 无 |
| Agent-2 | 执行 Task 2（DatasetCard.module.scss） | Task 1 完成后执行 |

> **注**: Task 2 依赖 Task 1 的结构，因为需要根据 JSX 结构定义对应的 CSS 类名。

---

## 📦 交付物清单

- [ ] `DatasetCard.tsx` 重构版本
- [ ] `DatasetCard.module.scss` 优化版本
- [ ] Task 3 验证通过

---

## ⚠️ 注意事项

1. 保持 `DatasetResponse` 类型接口不变
2. Props 接口保持向后兼容（`onViewDetails` 保留，语义变为"进入模型"）
3. 不引入新的外部依赖（使用现有 lucide-react 图标）
4. 样式变量使用项目已有的 CSS Variables
