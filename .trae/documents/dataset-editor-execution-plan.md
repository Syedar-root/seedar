# 数据集创编页面实现计划 - 详细执行计划

## 项目结构分析

### 现有代码参考
- **类型定义**: `packages/types/src/dataset/` - 已定义 DatasetType, JoinType, FieldType, MetricType 等枚举和接口
- **Timeline 参考**: `apps/web-client/src/modules/datasource/components/RelationshipTimeline/` - 垂直时间线样式
- **图标库**: lucide-react

### 技术栈
- React + TypeScript
- SCSS Modules (CSS 变量系统)
- 路由: React Router

---

## 任务执行顺序与依赖

### Phase 1: 基础设施层 (可并行执行)
| Task | 文件 | 依赖 | 状态 |
|------|------|------|------|
| 1.1 | `src/dataset/types/editor.types.ts` | 无 | pending |
| 1.3 | `src/dataset/components/DatasetEditor/Timeline/` | 无 | pending |
| 1.2 | `src/dataset/hooks/useDatasetForm.ts` | 1.1 | pending |

### Phase 2: HOC 层
| Task | 文件 | 依赖 | 状态 |
|------|------|------|------|
| 2.1 | `src/dataset/hoc/DatasetCreateHOC.tsx` | 1.1, 1.2 | pending |
| 2.2 | `src/dataset/hoc/DatasetEditHOC.tsx` | 1.1, 1.2 | pending |
| 2.3 | `src/dataset/hoc/index.ts` | 2.1, 2.2 | pending |

### Phase 3: Step 组件层 (可并行执行)
| Task | 文件 | 依赖 | 状态 |
|------|------|------|------|
| 3.1 | `src/dataset/components/DatasetEditor/steps/BasicInfoStep.tsx` | 1.1 | pending |
| 3.2 | `src/dataset/components/DatasetEditor/steps/DataSourceStep.tsx` | 1.1 | pending |
| 3.3 | `src/dataset/components/DatasetEditor/steps/JoinConfigStep.tsx` | 1.1 | pending |
| 3.4 | `src/dataset/components/DatasetEditor/steps/FieldConfigStep.tsx` | 1.1, 1.2 | pending |
| 3.5 | `src/dataset/components/DatasetEditor/steps/MetricConfigStep.tsx` | 1.1 | pending |
| 3.6 | `src/dataset/components/DatasetEditor/steps/ConfirmStep.tsx` | 1.1 | pending |
| 3.7 | `src/dataset/components/DatasetEditor/steps/index.ts` | 3.1-3.6 | pending |

### Phase 4: 主页面组件
| Task | 文件 | 依赖 | 状态 |
|------|------|------|------|
| 4.1 | `src/dataset/components/DatasetEditor/DatasetEditorPage.tsx` | 1.1, 1.2, 1.3, 3.7 | pending |
| 4.2 | `src/dataset/components/DatasetEditor/DatasetEditorPage.module.scss` | 无 | pending |
| 4.3 | `src/dataset/components/DatasetEditor/index.ts` | 4.1, 4.2 | pending |

### Phase 5: 页面与路由
| Task | 文件 | 依赖 | 状态 |
|------|------|------|------|
| 5.1 | `src/dataset/pages/datasetCreatePage.tsx` | 2.3, 4.3 | pending |
| 5.2 | `src/dataset/pages/datasetEditPage.tsx` | 2.3, 4.3 | pending |
| 5.3 | `src/dataset/pages/index.ts` | 5.1, 5.2 | pending |
| 5.4 | `src/core/router/index.tsx` | 5.3 | pending |
| 5.5 | `src/dataset/pages/datasetPage.tsx` | 5.4 | pending |

---

## 并行执行策略

### 第一批 (Phase 1 - 可并行)
- Task 1.1: 创建类型定义
- Task 1.3: 创建 Timeline 组件

### 第二批 (Phase 1 完成后)
- Task 1.2: 创建表单状态管理 Hook (依赖 1.1)

### 第三批 (Phase 2 + Phase 3 可并行)
- Task 2.1: DatasetCreateHOC (依赖 1.1, 1.2)
- Task 2.2: DatasetEditHOC (依赖 1.1, 1.2)
- Task 3.1: BasicInfoStep (依赖 1.1)
- Task 3.2: DataSourceStep (依赖 1.1)
- Task 3.3: JoinConfigStep (依赖 1.1)
- Task 3.5: MetricConfigStep (依赖 1.1)
- Task 3.6: ConfirmStep (依赖 1.1)

### 第四批
- Task 3.4: FieldConfigStep (依赖 1.1, 1.2)
- Task 2.3: HOC 导出 (依赖 2.1, 2.2)
- Task 3.7: Steps 导出 (依赖 3.1-3.6)

### 第五批 (Phase 4)
- Task 4.1: DatasetEditorPage (依赖 1.1, 1.2, 1.3, 3.7)
- Task 4.2: DatasetEditorPage 样式

### 第六批
- Task 4.3: DatasetEditor 导出 (依赖 4.1, 4.2)

### 第七批 (Phase 5 - 可并行)
- Task 5.1: datasetCreatePage
- Task 5.2: datasetEditPage

### 第八批
- Task 5.3: 页面导出更新
- Task 5.4: 路由更新
- Task 5.5: 列表页编辑按钮更新

---

## 详细任务说明

### Task 1.1: 创建类型定义
**文件**: `src/dataset/types/editor.types.ts`
- DatasetFormData: 表单数据结构
- JoinConfig: Join 配置结构
- MetricConfig: 指标配置结构
- EditorMode: 'create' | 'edit'
- StepStatus: 'completed' | 'active' | 'pending' | 'error'
- EditorSteps: 'basicInfo' | 'dataSource' | 'joinConfig' | 'fieldConfig' | 'metricConfig' | 'confirm'

### Task 1.2: 创建表单状态管理 Hook
**文件**: `src/dataset/hooks/useDatasetForm.ts`
- useDatasetForm() 管理表单状态
- 初始化逻辑（创建空状态，编辑加载数据）
- 字段选择联动逻辑（Join 字段必选锁定）
- 指标引用字段锁定逻辑
- 数据转换函数 toCreateRequest, toUpdateRequest

### Task 1.3: 创建 Timeline 组件
**目录**: `src/dataset/components/DatasetEditor/Timeline/`
- Timeline.tsx: 左侧垂直时间线
- Timeline.module.scss: 样式
- index.ts: 导出
- 支持 completed/active/pending/error 四种状态
- 点击已完成步骤可返回

### Task 2.1: DatasetCreateHOC
**文件**: `src/dataset/hoc/DatasetCreateHOC.tsx`
- 包装 DatasetEditorPage
- 设置 mode: 'create'
- 初始化空表单状态
- 使用 useCreateDataset() 提交
- 步骤控制逻辑

### Task 2.2: DatasetEditHOC
**文件**: `src/dataset/hoc/DatasetEditHOC.tsx`
- 包装 DatasetEditorPage
- 设置 mode: 'edit'
- 使用 useDataset(id) 加载数据
- 使用 useUpdateDataset() 提交
- 计算增量更新数据

### Task 3.1-3.6: Step 组件
- BasicInfoStep: 名称、描述、类型
- DataSourceStep: 数据源与表选择
- JoinConfigStep: Join 配置
- FieldConfigStep: 字段选择（依赖 useDatasetForm）
- MetricConfigStep: 指标配置（仅语义型）
- ConfirmStep: 确认与创建

### Task 4.1: DatasetEditorPage
**文件**: `src/dataset/components/DatasetEditor/DatasetEditorPage.tsx`
- 创建模式：Timeline + 当前 Step
- 编辑模式：折叠面板式布局
- 步骤切换逻辑
- 上一步/下一步/提交按钮

### Task 5.1-5.2: 页面
- datasetCreatePage: DatasetCreateHOC(DatasetEditorPage)
- datasetEditPage: DatasetEditHOC(DatasetEditorPage)

### Task 5.4: 路由配置
- 添加 /dataset/create 路由
- 添加 /dataset/:id/edit 路由

---

## 验收标准

1. **创建流程**: 列表页 → 创建页 → Step 1-6 → 详情页
2. **编辑流程**: 列表页 → 编辑页 → 全部内容 → 详情页
3. **字段锁定**: Join 字段和指标引用字段不可取消
4. **指标配置**: 只能引用已选字段