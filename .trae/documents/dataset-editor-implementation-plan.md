# 数据集创编页面实现计划

## 一、项目概述

实现数据集的创建和编辑功能，使用 HOC 模式复用同一页面组件，创建模式为 Step-by-Step 引导，编辑模式为全量展示。

### 路由设计
- `/dataset/create` → `DatasetCreateHOC(DatasetEditorPage)`
- `/dataset/:id/edit` → `DatasetEditHOC(DatasetEditorPage)`

### 步骤流程
1. Step 1: 基本信息（名称、描述、类型）
2. Step 2: 数据源与表选择
3. Step 3: Join 配置
4. Step 4: 字段选择
5. Step 5: 指标配置（仅语义型）
6. Step 6: 确认与创建

---

## 二、任务拆分

### Phase 1: 基础设施层（可并行）

#### Task 1.1: 创建类型定义
**文件**: `dataset/types/editor.types.ts`

**内容**:
- `DatasetFormData` - 表单数据结构
- `JoinConfig` - Join 配置结构
- `MetricConfig` - 指标配置结构
- `EditorMode` - 编辑模式枚举
- `StepStatus` - 步骤状态枚举

**依赖**: 无

---

#### Task 1.2: 创建表单状态管理 Hook
**文件**: `dataset/hooks/useDatasetForm.ts`

**内容**:
- `useDatasetForm()` - 管理整个表单状态
- 初始化逻辑（创建模式空状态，编辑模式加载数据）
- 字段选择联动逻辑（Join 字段必选锁定）
- 指标引用字段锁定逻辑
- 数据转换函数（`toCreateRequest`, `toUpdateRequest`）

**依赖**: Task 1.1

---

#### Task 1.3: 创建 Timeline 组件
**文件**: `dataset/components/DatasetEditor/Timeline/`

**内容**:
- `Timeline.tsx` - 左侧步骤时间线
- `Timeline.module.scss` - 样式
- `index.ts` - 导出
- 支持 completed/active/pending/error 四种状态
- 点击已完成步骤可返回

**依赖**: 无

---

### Phase 2: HOC 层（依赖 Phase 1）

#### Task 2.1: 创建 DatasetCreateHOC
**文件**: `dataset/hoc/DatasetCreateHOC.tsx`

**内容**:
- 包装 `DatasetEditorPage`
- 设置 `mode: 'create'`
- 初始化空表单状态
- 使用 `useCreateDataset()` 提交
- 步骤控制逻辑

**依赖**: Task 1.1, Task 1.2

---

#### Task 2.2: 创建 DatasetEditHOC
**文件**: `dataset/hoc/DatasetEditHOC.tsx`

**内容**:
- 包装 `DatasetEditorPage`
- 设置 `mode: 'edit'`
- 使用 `useDataset(id)` 加载数据
- 使用 `useUpdateDataset()` 提交
- 计算增量更新数据

**依赖**: Task 1.1, Task 1.2

---

#### Task 2.3: 创建 HOC 导出
**文件**: `dataset/hoc/index.ts`

**内容**:
- 导出 `DatasetCreateHOC`
- 导出 `DatasetEditHOC`

**依赖**: Task 2.1, Task 2.2

---

### Phase 3: Step 组件层（可并行）

#### Task 3.1: Step 1 - 基本信息组件
**文件**: `dataset/components/DatasetEditor/steps/BasicInfoStep.tsx`

**内容**:
- 数据集名称输入（必填）
- 描述输入（可选）
- 类型选择（语义型/宽表型）

**依赖**: Task 1.1

---

#### Task 3.2: Step 2 - 数据源与表选择组件
**文件**: `dataset/components/DatasetEditor/steps/DataSourceStep.tsx`

**内容**:
- 数据源下拉选择（使用 `useDatasources`）
- 选择数据源后加载表列表
- 表多选组件
- 主表单选设置
- 表格展示已选表

**依赖**: Task 1.1

---

#### Task 3.3: Step 3 - Join 配置组件
**文件**: `dataset/components/DatasetEditor/steps/JoinConfigStep.tsx`

**内容**:
- 单表时显示提示信息
- 多表时显示 Join 配置区域
- Join 配置表单（左表、左字段、Join类型、右表、右字段）
- 添加/删除 Join
- 复用 `JoinRelationGraph` 可视化预览

**依赖**: Task 1.1

---

#### Task 3.4: Step 4 - 字段选择组件
**文件**: `dataset/components/DatasetEditor/steps/FieldConfigStep.tsx`

**内容**:
- 按表维度分组展示字段
- 字段勾选/取消
- Join 字段锁定显示（禁用取消）
- 指标引用字段锁定显示
- 字段搜索过滤

**依赖**: Task 1.1, Task 1.2

---

#### Task 3.5: Step 5 - 指标配置组件
**文件**: `dataset/components/DatasetEditor/steps/MetricConfigStep.tsx`

**内容**:
- 指标列表展示
- 新建指标按钮
- 复用 `FormulaEditor` 组件
- 编辑/删除指标
- 宽表型跳过此步骤

**依赖**: Task 1.1

---

#### Task 3.6: Step 6 - 确认组件
**文件**: `dataset/components/DatasetEditor/steps/ConfirmStep.tsx`

**内容**:
- 预览所有配置信息
- 基本信息、表、Join、字段、指标汇总
- 提交按钮

**依赖**: Task 1.1

---

#### Task 3.7: 创建 Steps 导出
**文件**: `dataset/components/DatasetEditor/steps/index.ts`

**内容**:
- 导出所有 Step 组件

**依赖**: Task 3.1 ~ Task 3.6

---

### Phase 4: 主页面组件（依赖 Phase 1-3）

#### Task 4.1: 创建 DatasetEditorPage 主组件
**文件**: `dataset/components/DatasetEditor/DatasetEditorPage.tsx`

**内容**:
- 接收 HOC 传入的 props
- 创建模式：左侧 Timeline + 右侧当前 Step 内容
- 编辑模式：折叠面板式布局，全部内容展示
- 步骤切换逻辑
- 上一步/下一步/提交按钮
- 表单校验逻辑

**依赖**: Task 1.1, Task 1.2, Task 1.3, Task 3.7

---

#### Task 4.2: 创建 DatasetEditorPage 样式
**文件**: `dataset/components/DatasetEditor/DatasetEditorPage.module.scss`

**内容**:
- 创建模式布局样式
- 编辑模式布局样式
- 响应式适配

**依赖**: 无

---

#### Task 4.3: 创建 DatasetEditor 导出
**文件**: `dataset/components/DatasetEditor/index.ts`

**内容**:
- 导出 `DatasetEditorPage`

**依赖**: Task 4.1, Task 4.2

---

### Phase 5: 页面与路由（依赖 Phase 2, 4）

#### Task 5.1: 创建创建页面
**文件**: `dataset/pages/datasetCreatePage.tsx`

**内容**:
- 使用 `DatasetCreateHOC` 包装 `DatasetEditorPage`

**依赖**: Task 2.3, Task 4.3

---

#### Task 5.2: 创建编辑页面
**文件**: `dataset/pages/datasetEditPage.tsx`

**内容**:
- 使用 `DatasetEditHOC` 包装 `DatasetEditorPage`

**依赖**: Task 2.3, Task 4.3

---

#### Task 5.3: 更新页面导出
**文件**: `dataset/pages/index.ts`

**内容**:
- 添加 `datasetCreatePage` 导出
- 添加 `datasetEditPage` 导出

**依赖**: Task 5.1, Task 5.2

---

#### Task 5.4: 更新路由配置
**文件**: `core/router/index.tsx`

**内容**:
- 添加 `/dataset/create` 路由
- 添加 `/dataset/:id/edit` 路由

**依赖**: Task 5.3

---

#### Task 5.5: 更新列表页编辑按钮
**文件**: `dataset/pages/datasetPage.tsx`

**内容**:
- 修改 `handleEdit` 函数，跳转到编辑页面

**依赖**: Task 5.4

---

## 三、依赖关系图

```
Phase 1 (基础设施层) - 可并行
├── Task 1.1 (类型定义) ─────────┬─────────────────────────────────┐
├── Task 1.3 (Timeline) ─────────┼─────────────────────────────────┤
│                                │                                 │
│                                ▼                                 │
│                         Task 1.2 (表单Hook)                      │
│                                │                                 │
├────────────────────────────────┼─────────────────────────────────┤
│                                │                                 │
Phase 2 (HOC层)                  │                                 │
├── Task 2.1 (CreateHOC) ◄───────┤                                 │
├── Task 2.2 (EditHOC) ◄─────────┘                                 │
├── Task 2.3 (HOC导出) ◄──────── Task 2.1, 2.2                     │
│                                                                  │
Phase 3 (Step组件层) - 可并行                                      │
├── Task 3.1 (BasicInfoStep) ◄──── Task 1.1                        │
├── Task 3.2 (DataSourceStep) ◄─── Task 1.1                        │
├── Task 3.3 (JoinConfigStep) ◄─── Task 1.1                        │
├── Task 3.4 (FieldConfigStep) ◄── Task 1.1, 1.2                   │
├── Task 3.5 (MetricConfigStep) ◄─ Task 1.1                        │
├── Task 3.6 (ConfirmStep) ◄────── Task 1.1                        │
├── Task 3.7 (Steps导出) ◄──────── Task 3.1~3.6                    │
│                                                                  │
Phase 4 (主页面)                                                   │
├── Task 4.1 (EditorPage) ◄─────── Task 1.1, 1.2, 1.3, 3.7         │
├── Task 4.2 (EditorPage样式)                                                      │
├── Task 4.3 (Editor导出) ◄─────── Task 4.1, 4.2                   │
│                                                                  │
Phase 5 (页面与路由)                                               │
├── Task 5.1 (CreatePage) ◄─────── Task 2.3, 4.3                   │
├── Task 5.2 (EditPage) ◄───────── Task 2.3, 4.3                   │
├── Task 5.3 (页面导出) ◄───────── Task 5.1, 5.2                    │
├── Task 5.4 (路由更新) ◄───────── Task 5.3                         │
├── Task 5.5 (列表页更新) ◄─────── Task 5.4                         │
```

---

## 四、并行执行策略

### 第一批并行任务（Phase 1）
- Task 1.1 (类型定义)
- Task 1.3 (Timeline)

### 第二批任务（Phase 1 完成）
- Task 1.2 (表单Hook) - 依赖 Task 1.1

### 第三批并行任务（Phase 2 + Phase 3）
- Task 2.1 (CreateHOC)
- Task 2.2 (EditHOC)
- Task 3.1 (BasicInfoStep)
- Task 3.2 (DataSourceStep)
- Task 3.3 (JoinConfigStep)
- Task 3.5 (MetricConfigStep)
- Task 3.6 (ConfirmStep)

### 第四批任务
- Task 3.4 (FieldConfigStep) - 依赖 Task 1.2
- Task 2.3 (HOC导出) - 依赖 Task 2.1, 2.2
- Task 3.7 (Steps导出) - 依赖 Task 3.1~3.6

### 第五批任务（Phase 4）
- Task 4.1 (EditorPage)
- Task 4.2 (EditorPage样式)

### 第六批任务（Phase 4 完成）
- Task 4.3 (Editor导出)

### 第七批并行任务（Phase 5）
- Task 5.1 (CreatePage)
- Task 5.2 (EditPage)

### 第八批任务（Phase 5 完成）
- Task 5.3 (页面导出)
- Task 5.4 (路由更新)
- Task 5.5 (列表页更新)

---

## 五、文件结构总览

```
dataset/
├── types/
│   ├── editor.types.ts          # 新增
│   └── index.ts                 # 更新导出
├── hooks/
│   ├── useDatasetForm.ts        # 新增
│   └── index.ts                 # 更新导出
├── components/
│   ├── DatasetEditor/
│   │   ├── index.ts             # 新增
│   │   ├── DatasetEditorPage.tsx
│   │   ├── DatasetEditorPage.module.scss
│   │   ├── Timeline/
│   │   │   ├── index.ts
│   │   │   ├── Timeline.tsx
│   │   │   └── Timeline.module.scss
│   │   └── steps/
│   │       ├── index.ts
│   │       ├── BasicInfoStep.tsx
│   │       ├── DataSourceStep.tsx
│   │       ├── JoinConfigStep.tsx
│   │       ├── FieldConfigStep.tsx
│   │       ├── MetricConfigStep.tsx
│   │       └── ConfirmStep.tsx
│   └── index.ts                 # 更新导出
├── hoc/
│   ├── index.ts                 # 新增
│   ├── DatasetCreateHOC.tsx     # 新增
│   └── DatasetEditHOC.tsx       # 新增
└── pages/
    ├── index.ts                 # 更新导出
    ├── datasetCreatePage.tsx    # 新增
    └── datasetEditPage.tsx      # 新增
```

---

## 六、验收标准

1. **创建流程**
   - 可以从列表页进入创建页面
   - 按 Step 1 → Step 6 顺序完成创建
   - Timeline 显示当前进度
   - 可返回已完成的步骤
   - 提交后跳转到详情页

2. **编辑流程**
   - 可以从列表页进入编辑页面
   - 所有内容折叠面板展示
   - 数据源、表、类型不可编辑
   - Join、字段、指标可编辑
   - 提交后刷新页面

3. **字段锁定**
   - Join 字段自动锁定，不可取消
   - 指标引用字段自动锁定，不可取消

4. **指标配置**
   - 只能引用已选字段
   - 复用 FormulaEditor 组件
