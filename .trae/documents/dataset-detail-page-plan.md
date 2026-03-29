# 数据集详情页开发计划

## 项目概述

基于方案一（单页分区式）开发数据集详情页，延续 datasourceDetailPage 的设计语言，采用 Hero + 统计栏 + 内容区的经典结构。

## 技术栈与设计规范

- **UI 框架**: React + TypeScript
- **路由**: React Router
- **样式**: SCSS Modules + CSS Variables（Classic Vintage Theme）
- **数据获取**: `useDataset` hook from `#pkg/seedar/ui-react`
- **类型定义**: `DatasetResponse` from `#pkg/seedar/types`
- **图标**: Lucide React

## 任务分解与依赖关系

### 阶段一：基础设施（无依赖，可并行）

| 任务ID | 任务名称 | 依赖 | 可并行 | 预估复杂度 |
|--------|----------|------|--------|------------|
| T1.1 | 创建页面路由配置 | 无 | ✅ | 低 |
| T1.2 | 创建页面组件文件骨架 | 无 | ✅ | 低 |
| T1.3 | 创建样式文件骨架 | 无 | ✅ | 低 |

### 阶段二：核心组件开发（依赖阶段一，部分可并行）

| 任务ID | 任务名称 | 依赖 | 可并行 | 预估复杂度 |
|--------|----------|------|--------|------------|
| T2.1 | DatasetHero 组件 | T1.2, T1.3 | ✅ | 中 |
| T2.2 | DatasetStatsBar 组件 | T1.2, T1.3 | ✅ | 中 |
| T2.3 | DatasetMetadataBar 组件 | T1.2, T1.3 | ✅ | 低 |
| T2.4 | FieldExplorer 组件 | T1.2, T1.3 | ✅ | 高 |
| T2.5 | MetricList 组件 | T1.2, T1.3 | ✅ | 中 |
| T2.6 | JoinRelationList 组件 | T1.2, T1.3 | ✅ | 中 |

### 阶段三：页面组装（依赖阶段二）

| 任务ID | 任务名称 | 依赖 | 可并行 | 预估复杂度 |
|--------|----------|------|--------|------------|
| T3.1 | 组装详情页主体结构 | T2.1-T2.6 | ❌ | 中 |
| T3.2 | 实现宽表型/语义型条件渲染 | T3.1 | ❌ | 低 |
| T3.3 | 添加加载/错误/空状态 | T3.1 | ✅ | 低 |

### 阶段四：交互与优化（依赖阶段三）

| 任务ID | 任务名称 | 依赖 | 可并行 | 预估复杂度 |
|--------|----------|------|--------|------------|
| T4.1 | 预留编辑操作入口 | T3.1 | ✅ | 低 |
| T4.2 | 添加返回导航功能 | T3.1 | ✅ | 低 |
| T4.3 | 响应式适配 | T3.1 | ✅ | 中 |

## 并行执行策略

### 第一波并行（Subagent 并行执行）

```
┌─────────────────────────────────────────────────────────────┐
│                    Subagent 1: 基础设施                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   T1.1      │ │   T1.2      │ │   T1.3      │           │
│  │ 路由配置    │ │ 页面骨架    │ │ 样式骨架    │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### 第二波并行（Subagent 分组执行）

```
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│   Subagent 2: Hero   │  │ Subagent 3: Stats    │  │ Subagent 4: Fields   │
│  ┌────────────────┐  │  │  ┌────────────────┐  │  │  ┌────────────────┐  │
│  │ T2.1 Hero      │  │  │  │ T2.2 StatsBar  │  │  │  │ T2.4 FieldList │  │
│  │ T2.3 MetaBar   │  │  │  │                │  │  │  │                │  │
│  └────────────────┘  │  │  └────────────────┘  │  │  └────────────────┘  │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘

┌──────────────────────┐  ┌──────────────────────┐
│ Subagent 5: Metrics  │  │  Subagent 6: Joins   │
│  ┌────────────────┐  │  │  ┌────────────────┐  │
│  │ T2.5 MetricList│  │  │  │ T2.6 JoinList  │  │
│  │                │  │  │  │                │  │
│  └────────────────┘  │  │  └────────────────┘  │
└──────────────────────┘  └──────────────────────┘
```

### 第三波串行（主线程执行）

```
T3.1 组装页面 → T3.2 条件渲染 → T3.3 状态处理
```

### 第四波并行（Subagent 并行执行）

```
┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐
│ Subagent 7: Actions  │  │ Subagent 8: Navigate │  │ Subagent 9: Responsive│
│  ┌────────────────┐  │  │  ┌────────────────┐  │  │  ┌────────────────┐  │
│  │ T4.1 编辑入口  │  │  │  │ T4.2 返回导航  │  │  │  │ T4.3 响应式    │  │
│  └────────────────┘  │  │  └────────────────┘  │  │  └────────────────┘  │
└──────────────────────┘  └──────────────────────┘  └──────────────────────┘
```

## 文件结构规划

```
apps/web-client/src/modules/dataset/
├── pages/
│   ├── datasetDetailPage.tsx          # 详情页主组件
│   └── styles/
│       └── datasetDetailPage.module.scss
├── components/
│   ├── DatasetHero/
│   │   ├── DatasetHero.tsx
│   │   ├── DatasetHero.module.scss
│   │   └── index.ts
│   ├── DatasetStatsBar/
│   │   ├── DatasetStatsBar.tsx
│   │   ├── DatasetStatsBar.module.scss
│   │   └── index.ts
│   ├── DatasetMetadataBar/
│   │   ├── DatasetMetadataBar.tsx
│   │   ├── DatasetMetadataBar.module.scss
│   │   └── index.ts
│   ├── FieldExplorer/
│   │   ├── FieldExplorer.tsx
│   │   ├── FieldExplorer.module.scss
│   │   └── index.ts
│   ├── MetricList/
│   │   ├── MetricList.tsx
│   │   ├── MetricList.module.scss
│   │   └── index.ts
│   ├── JoinRelationList/
│   │   ├── JoinRelationList.tsx
│   │   ├── JoinRelationList.module.scss
│   │   └── index.ts
│   ├── PageStates/
│   │   ├── LoadingState.tsx
│   │   ├── ErrorState.tsx
│   │   ├── EmptyState.tsx
│   │   ├── PageStates.module.scss
│   │   └── index.ts
│   └── index.ts                       # 统一导出
```

## 详细任务描述

### T1.1 创建页面路由配置

**目标**: 在路由配置中添加数据集详情页路由

**执行内容**:
1. 查找现有路由配置文件
2. 添加 `/dataset/:id` 路由
3. 导入详情页组件

**验收标准**:
- 路由配置正确
- 可通过 URL 访问详情页

---

### T1.2 创建页面组件文件骨架

**目标**: 创建详情页主组件的基本结构

**执行内容**:
1. 创建 `datasetDetailPage.tsx`
2. 定义组件基本结构
3. 添加 `useParams` 获取 ID
4. 添加 `useDataset` hook 调用
5. 创建组件导出

**验收标准**:
- 文件创建成功
- 组件可正常导入

---

### T1.3 创建样式文件骨架

**目标**: 创建详情页样式文件的基本结构

**执行内容**:
1. 创建 `datasetDetailPage.module.scss`
2. 定义基础容器样式
3. 参照 datasourceDetailPage 的样式结构

**验收标准**:
- 文件创建成功
- 样式可正常导入

---

### T2.1 DatasetHero 组件

**目标**: 创建数据集头部信息展示组件

**Props 定义**:
```typescript
interface DatasetHeroProps {
  dataset: DatasetResponse;
  onBack?: () => void;
}
```

**展示内容**:
- 返回按钮
- 类型标签（语义型/宽表型）
- 数据源名称
- 状态标签
- 数据集名称
- 描述
- 统计数据（表数、字段数、指标数、关联数、创建时间）

**验收标准**:
- 正确展示所有信息
- 样式与 datasourceHero 一致
- 响应式适配

---

### T2.2 DatasetStatsBar 组件

**目标**: 创建统计数据展示栏组件

**Props 定义**:
```typescript
interface DatasetStatsBarProps {
  tableCount: number;
  fieldCount: number;
  metricCount: number;
  joinCount: number;
  createdAt: string;
}
```

**展示内容**:
- 表数量
- 字段数量
- 指标数量
- 关联数量
- 创建时间

**验收标准**:
- 数据正确展示
- 样式符合设计规范

---

### T2.3 DatasetMetadataBar 组件

**目标**: 创建元数据信息栏组件

**Props 定义**:
```typescript
interface DatasetMetadataBarProps {
  createdAt: string;
  updatedAt: string;
}
```

**展示内容**:
- 创建时间
- 最后更新时间

**验收标准**:
- 日期格式化正确
- 样式与 datasourceMetadataBar 一致

---

### T2.4 FieldExplorer 组件

**目标**: 创建字段列表探索组件

**Props 定义**:
```typescript
interface FieldExplorerProps {
  fields: DatasetFieldResponse[];
  tables: DatasetTableResponse[];
}
```

**展示内容**:
- 字段表格（字段名、业务名称、类型、所属表、是否主键）
- 支持滚动
- 预留编辑按钮位置

**验收标准**:
- 表格正确展示所有字段
- 支持滚动
- 主键字段有标识

---

### T2.5 MetricList 组件

**目标**: 创建指标列表组件

**Props 定义**:
```typescript
interface MetricListProps {
  metrics: DatasetMetricResponse[];
}
```

**展示内容**:
- 指标名称
- 指标类型
- 聚合函数
- 计算公式（如有）

**验收标准**:
- 正确展示指标信息
- 样式符合设计规范

---

### T2.6 JoinRelationList 组件

**目标**: 创建关联关系列表组件

**Props 定义**:
```typescript
interface JoinRelationListProps {
  joins: DatasetJoinResponse[];
  tables: DatasetTableResponse[];
}
```

**展示内容**:
- 左表 → 连接类型 → 右表
- 连接字段
- 连接类型标签（INNER/LEFT/RIGHT）

**验收标准**:
- 正确展示关联关系
- 样式符合设计规范

---

### T3.1 组装详情页主体结构

**目标**: 将所有组件组装成完整页面

**执行内容**:
1. 导入所有子组件
2. 组装 Hero + StatsBar + MetadataBar
3. 组装 FieldExplorer
4. 组装 MetricList + JoinRelationList（条件渲染）
5. 添加容器布局

**验收标准**:
- 页面结构完整
- 组件间间距正确

---

### T3.2 实现宽表型/语义型条件渲染

**目标**: 根据数据集类型动态显示内容

**执行内容**:
1. 判断 `dataset.type`
2. 宽表型：隐藏 JoinRelationList，FieldExplorer 全宽
3. 语义型：显示所有区块

**验收标准**:
- 宽表型正确隐藏关联区块
- 布局自适应

---

### T3.3 添加加载/错误/空状态

**目标**: 添加页面状态处理

**执行内容**:
1. 创建 LoadingState 组件
2. 创建 ErrorState 组件
3. 创建 EmptyState 组件
4. 在主页面添加条件渲染

**验收标准**:
- 加载状态正确显示
- 错误信息正确展示
- 空状态友好提示

---

### T4.1 预留编辑操作入口

**目标**: 在页面头部添加编辑按钮

**执行内容**:
1. 在 Hero 区域添加编辑按钮
2. 添加删除按钮
3. 按钮样式符合设计规范

**验收标准**:
- 按钮位置正确
- 点击事件预留

---

### T4.2 添加返回导航功能

**目标**: 实现返回列表页功能

**执行内容**:
1. 返回按钮调用 `navigate('/dataset')`
2. 添加 aria-label

**验收标准**:
- 点击返回正确跳转

---

### T4.3 响应式适配

**目标**: 适配移动端和不同屏幕尺寸

**执行内容**:
1. 添加媒体查询
2. 调整布局为移动端友好
3. 测试不同断点

**验收标准**:
- 移动端正常显示
- 平板端正常显示
- 桌面端正常显示

## 执行时间估算

| 阶段 | 预估时间 | 并行加速后 |
|------|----------|-----------|
| 阶段一 | 15分钟 | 5分钟 |
| 阶段二 | 60分钟 | 20分钟 |
| 阶段三 | 20分钟 | 20分钟 |
| 阶段四 | 15分钟 | 5分钟 |
| **总计** | **110分钟** | **50分钟** |

## 风险与注意事项

1. **类型定义**: 确保 `DatasetResponse` 类型包含所有需要的字段
2. **API 响应**: 确认 `useDataset` hook 返回的数据结构
3. **样式一致性**: 严格参照 datasourceDetailPage 的样式
4. **响应式**: 注意移动端的表格展示

## 验收清单

- [x] 页面可通过 `/dataset/:id` 访问
- [x] Hero 区域正确展示数据集基本信息
- [x] 统计栏正确展示数量统计
- [x] 字段列表正确展示所有字段
- [x] 指标列表正确展示（语义型）
- [x] 关联关系正确展示（语义型）
- [x] 宽表型正确隐藏关联区块
- [x] 加载状态正确显示
- [x] 错误状态正确显示
- [x] 空状态正确显示
- [x] 返回按钮功能正常
- [x] 编辑按钮已预留
- [x] 响应式适配完成
