# 指标管理重构实施计划

## 需求拆解

### 核心目标
将指标创编功能从数据集创建/编辑流程移除，改为在数据集详情页单独管理，解决"创建时字段 ID 未知"的问题。

### 功能拆解
1. **MetricConfigStep 改造**：移除指标编辑功能，改为只读提示
2. **MetricList 增强**：添加指标增删改功能
3. **MetricDialog 迁移**：复制到 MetricList 目录并适配
4. **datasetDetailPage 集成**：添加指标操作的数据流

### 数据流设计
- **MetricConfigStep**：不再处理指标数据，仅显示提示
- **MetricList**：
  - 数据流入：通过 Props 接收 `metrics`、`fields`、`onAddMetric`、`onUpdateMetric`、`onRemoveMetric`
  - 数据流出：通过回调抛出指标操作
- **datasetDetailPage**：
  - 数据获取：通过 `useDataset` 获取数据集数据
  - 数据更新：通过 `useUpdateDataset` 处理指标增删改

---

## 任务拆分与依赖关系

### Phase 1: MetricConfigStep 改造（独立任务）

#### Task 1.1: 简化 MetricConfigStep 组件
- **优先级**: P0
- **依赖**: 无
- **描述**:
  - 移除指标列表展示逻辑
  - 移除 `MetricDialog` 引用
  - 移除 `useFormulaParser` 引用
  - 改为显示提示信息："请在完成数据集创建/编辑后，进入数据集详情页配置指标"
- **验收标准**:
  - 组件不再显示指标列表
  - 显示友好的提示信息
  - 宽表型数据集的提示保持不变
- **引用规范**:
  - react-ts-component-design - 数据流设计规范：外部数据流规范

#### Task 1.2: 清理 MetricConfigStep 样式文件
- **优先级**: P1
- **依赖**: Task 1.1
- **描述**:
  - 移除不再使用的样式类
  - 保留必要的容器和提示样式
- **验收标准**:
  - 样式文件中没有未使用的类名
  - 组件样式正常显示

---

### Phase 2: MetricDialog 迁移（独立任务）

#### Task 2.1: 复制 MetricDialog 到 MetricList 目录
- **优先级**: P0
- **依赖**: 无
- **描述**:
  - 复制 `MetricConfigStep/MetricDialog.tsx` 到 `MetricList/MetricDialog.tsx`
  - 复制相关样式文件
  - 复制 `FormulaEditor` 和 `useFormulaParser`（如果需要）
- **验收标准**:
  - 文件成功复制到目标目录
  - 文件内容完整

#### Task 2.2: 适配 MetricDialog 接口
- **优先级**: P0
- **依赖**: Task 2.1
- **描述**:
  - 修改 `fields` 类型：从 `FormField[]` 改为 `{ id: number; name: string; businessName?: string }[]`
  - 修改 `metrics` 类型：从 `MetricConfig[]` 改为 `{ id: number; name: string; businessName?: string }[]`
  - 确保支持编辑模式（`editMetric` prop）
- **验收标准**:
  - TypeScript 类型检查通过
  - 接口与 `datasetDetailPage` 的数据类型匹配
- **引用规范**:
  - react-ts-component-design - 组件命名规范：类型定义规范
  - react-ts-component-design - 根目录核心文件规范：types.ts 使用规范

#### Task 2.3: 适配 FormulaEditor 引用
- **优先级**: P0
- **依赖**: Task 2.2
- **描述**:
  - 检查 `FormulaEditor` 和 `useFormulaParser` 的引用路径
  - 如需要，复制相关文件到 `MetricList` 目录或调整引用路径
- **验收标准**:
  - 组件能正常导入依赖
  - 无循环引用

---

### Phase 3: MetricList 增强（核心任务）

#### Task 3.1: 定义 MetricList 类型
- **优先级**: P0
- **依赖**: 无
- **描述**:
  - 在 `MetricList` 目录创建或更新 `types.ts`
  - 定义 `MetricListProps` 接口，包含：
    - `metrics`: 指标列表
    - `fields`: 字段列表
    - `onAddMetric`: 添加指标回调
    - `onUpdateMetric`: 更新指标回调
    - `onRemoveMetric`: 删除指标回调
- **验收标准**:
  - 类型定义完整且符合 TypeScript 规范
  - 无 `any` 类型
- **引用规范**:
  - react-ts-component-design - 根目录核心文件规范：types.ts 收敛所有类型
  - react-ts-component-design - AI 生成强制约束：types.ts 收敛所有类型，禁止 any、隐式类型

#### Task 3.2: 实现 MetricList 状态管理
- **优先级**: P0
- **依赖**: Task 3.1
- **描述**:
  - 添加 `dialogOpen` 状态：控制弹窗显示
  - 添加 `editMetric` 状态：存储当前编辑的指标
  - 添加 `handleAddMetric` 方法：打开创建弹窗
  - 添加 `handleEditMetric` 方法：打开编辑弹窗
  - 添加 `handleRemoveMetric` 方法：调用删除回调
  - 添加 `handleSaveMetric` 方法：保存指标（区分创建和编辑）
  - 添加 `handleCloseDialog` 方法：关闭弹窗并重置状态
- **验收标准**:
  - 状态管理逻辑清晰
  - 方法职责单一
- **引用规范**:
  - react-ts-component-design - 组件 store 层规范：内部私有状态管理、状态定义与操作的完整约束
  - react-ts-component-design - 数据流设计规范：状态数据流规范

#### Task 3.3: 更新 MetricList UI
- **优先级**: P0
- **依赖**: Task 3.2
- **描述**:
  - 在头部添加"新建指标"按钮
  - 在每个指标项添加编辑和删除按钮
  - 集成 `MetricDialog` 组件
  - 绑定事件处理器
- **验收标准**:
  - UI 布局合理
  - 按钮交互正常
  - 弹窗能正常打开和关闭
- **引用规范**:
  - react-ts-component-design - 开发主组件：编排 UI、绑定事件、提供 context，仅做视图组装
  - react-ts-component-design - 数据流设计规范：视图层仅读取状态，禁止修改状态

#### Task 3.4: 优化 MetricList 样式
- **优先级**: P1
- **依赖**: Task 3.3
- **描述**:
  - 添加按钮样式
  - 调整指标项布局
  - 确保样式与项目整体风格一致
- **验收标准**:
  - 样式符合项目规范
  - 响应式布局正常

---

### Phase 4: datasetDetailPage 集成（数据流任务）

#### Task 4.1: 在 datasetDetailPage 中添加指标操作逻辑
- **优先级**: P0
- **依赖**: Task 3.2
- **描述**:
  - 引入 `useUpdateDataset` hook
  - 实现 `handleAddMetric`：调用 `useUpdateDataset` 添加指标
  - 实现 `handleUpdateMetric`：调用 `useUpdateDataset` 更新指标
  - 实现 `handleRemoveMetric`：调用 `useUpdateDataset` 删除指标
  - 将这些方法传递给 `MetricList` 组件
- **验收标准**:
  - 指标操作能正常调用 API
  - 操作成功后数据能正确更新
- **引用规范**:
  - react-ts-component-design - 组件 hooks 层规范：自定义 Hook 的逻辑封装、书写与异步处理规范
  - react-ts-component-design - 数据流设计规范：数据获取数据流规范

#### Task 4.2: 处理操作成功后的数据刷新
- **优先级**: P0
- **依赖**: Task 4.1
- **描述**:
  - 在指标操作成功后，触发 `useDataset` 重新获取数据
  - 或使用 `useUpdateDataset` 的 `onSuccess` 回调更新本地数据
- **验收标准**:
  - 操作成功后界面能立即反映最新数据
  - 无需手动刷新页面

---

### Phase 5: 测试与优化（并行任务）

#### Task 5.1: TypeScript 类型检查
- **优先级**: P0
- **依赖**: 所有代码修改完成
- **描述**:
  - 运行 TypeScript 类型检查
  - 修复所有类型错误
- **验收标准**:
  - 无 TypeScript 类型错误
- **引用规范**:
  - react-ts-component-design - AI 生成强制约束：types.ts 收敛所有类型，禁止 any、隐式类型

#### Task 5.2: ESLint 检查
- **优先级**: P0
- **依赖**: 所有代码修改完成
- **描述**:
  - 运行 ESLint 检查
  - 修复所有 lint 错误
- **验收标准**:
  - 无 ESLint 错误

#### Task 5.3: 功能测试
- **优先级**: P0
- **依赖**: Task 5.1, Task 5.2
- **描述**:
  - 测试 MetricConfigStep 的提示显示
  - 测试 MetricList 的指标创建功能
  - 测试 MetricList 的指标编辑功能
  - 测试 MetricList 的指标删除功能
  - 测试数据刷新逻辑
- **验收标准**:
  - 所有功能正常工作
  - 无明显 bug

#### Task 5.4: 代码审查与优化
- **优先级**: P1
- **依赖**: Task 5.3
- **描述**:
  - 检查代码是否符合规范
  - 检查是否有冗余代码
  - 检查性能优化点
- **验收标准**:
  - 代码简洁规范
  - 无冗余代码

---

## 并行执行策略

### 可并行的任务组
1. **Phase 1 和 Phase 2 可并行**：MetricConfigStep 改造和 MetricDialog 迁移互不依赖
2. **Phase 4 的子任务可并行**：在 Phase 3 完成后，Task 4.1 和 Task 4.2 可并行
3. **Phase 5 的子任务可并行**：Task 5.1 和 Task 5.2 可并行执行

### 使用 Subagent 的时机
1. **Task 2.2 和 Task 2.3**：可使用 subagent 并行处理 MetricDialog 的接口适配和 FormulaEditor 引用适配
2. **Task 5.1 和 Task 5.2**：可使用 subagent 并行运行 TypeScript 检查和 ESLint 检查
3. **Task 5.3**：可使用 subagent 进行功能测试，生成测试报告

---

## 关键约束与规范引用

### 数据流设计规范（react-ts-component-design）
- **外部数据流规范**：MetricList 通过 Props 接收数据，通过回调抛出操作
- **内部纵向数据流规范**：MetricDialog 通过 Props 接收数据，通过回调抛出保存结果
- **状态数据流规范**：MetricList 的状态修改通过 setState 方法，视图层仅读取状态
- **禁止行为**：禁止反向数据流、隐式数据流、重复数据获取

### 组件设计流程（react-ts-component-design）
1. **需求拆解**：已完成
2. **创建目录**：使用现有目录结构
3. **定义类型**：Task 3.1
4. **设计 store**：Task 3.2
5. **数据获取**：Task 4.1
6. **开发主组件**：Task 3.3
7. **开发子组件**：Task 2.2, Task 2.3
8. **测试优化**：Phase 5

### AI 生成强制约束（react-ts-component-design）
- 严格遵循所有目录、命名、文件、store、数据流规范
- 共用数据必须上提父组件（datasetDetailPage）
- store 仅管理内部私有状态（MetricList 的 dialogOpen、editMetric）
- types.ts 收敛所有类型，禁止 any、隐式类型
- hooks 遵循单一职责（useUpdateDataset 仅处理数据更新）
- 视图层仅做 UI 编排，禁止写业务逻辑
- 导入导出使用相对路径，禁止循环导入、冗余导入
- 禁止调试代码、冗余代码

---

## 风险与注意事项

1. **类型兼容性**：MetricDialog 的类型适配需要仔细检查，确保与 datasetDetailPage 的数据类型匹配
2. **数据刷新**：指标操作成功后，需要确保数据能正确刷新，避免界面显示不一致
3. **样式一致性**：新增的按钮和弹窗样式需要与项目整体风格保持一致
4. **性能优化**：MetricList 的渲染性能需要考虑，特别是指标数量较多时

---

## 验收标准

### 功能验收
- [ ] MetricConfigStep 显示提示信息，不再显示指标列表
- [ ] MetricList 能正常显示指标列表
- [ ] MetricList 能创建新指标
- [ ] MetricList 能编辑已有指标
- [ ] MetricList 能删除指标
- [ ] 指标操作成功后数据能正确刷新

### 代码质量验收
- [ ] 无 TypeScript 类型错误
- [ ] 无 ESLint 错误
- [ ] 代码符合 react-ts-component-design 规范
- [ ] 无冗余代码和调试代码

### 用户体验验收
- [ ] 提示信息友好清晰
- [ ] 操作流程顺畅
- [ ] 界面布局合理
- [ ] 响应式布局正常
