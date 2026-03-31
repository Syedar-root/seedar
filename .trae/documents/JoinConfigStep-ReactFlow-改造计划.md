# JoinConfigStep React Flow 改造计划

## 目标
将 `JoinConfigStep` 从表单列表形式改为 React Flow 可视化配置形式，同时上提数据源请求到 Zustand Store 集中管理。

---

## 任务拆分与依赖关系

### Phase 1: Zustand Store 创建（无依赖，可并行）

**1.1 创建数据源 Store**
- 文件: `src/modules/dataset/store/useDatasetEditorStore.ts`
- 内容:
  - `datasourceId`, `datasource`, `isLoading`, `error` 状态
  - `setDatasourceId(id)` - 设置 ID
  - `fetchDatasource(id)` - 获取数据源
  - `clear()` - 清除状态
- 依赖: 无

**1.2 导出 Store 索引文件**
- 文件: `src/modules/dataset/store/index.ts`
- 内容: 导出 store 相关模块
- 依赖: 1.1

---

### Phase 2: DatasetEditorPage 改造（依赖 Phase 1）

**2.1 改造 DatasetEditorPage 使用 Store**
- 文件: `src/modules/dataset/components/DatasetEditor/DatasetEditorPage.tsx`
- 修改:
  - 引入 `useDatasetEditorStore`
  - 监听 `formData.datasourceId` 变化，自动调用 `fetchDatasource`
  - 传递 `selectedDatasource` 改为从 store 获取
- 依赖: 1.1

**2.2 简化 DataSourceStep Props 接口**
- 文件: `src/modules/dataset/components/DatasetEditor/steps/DataSourceStep/DataSourceStep.tsx`
- 修改:
  - 移除 `useDatasources` 调用（如果需要可以保留给下拉选择）
  - 不再接收 `selectedDatasource` props
  - 改为直接从 store 获取 `selectedDatasource`
- 依赖: 2.1

---

### Phase 3: React Flow 节点组件（无依赖，可并行）

**3.1 创建 TableFieldNode 组件**
- 文件: `src/modules/dataset/components/JoinConfigStep/components/TableFieldNode/TableFieldNode.tsx`
- 功能:
  - 显示表名 header
  - 遍历所有字段，每字段显示一对 handle（左侧 target，右侧 source）
  - Handle ID 格式: `{tableId}:{columnName}:target` 或 `{tableId}:{columnName}:source`
  - 主表显示金色星星标识
  - 已连接的 handle 显示禁用态
- 依赖: 无

**3.2 创建 TableFieldNode 样式**
- 文件: `src/modules/dataset/components/JoinConfigStep/components/TableFieldNode/TableFieldNode.module.scss`
- 依赖: 3.1

**3.3 创建 TableFieldNode 类型定义**
- 文件: `src/modules/dataset/components/JoinConfigStep/components/TableFieldNode/types.ts`
- 依赖: 无

**3.4 创建 TableFieldNode 索引**
- 文件: `src/modules/dataset/components/JoinConfigStep/components/TableFieldNode/index.ts`
- 依赖: 3.1, 3.2, 3.3

---

### Phase 4: React Flow 边组件（无依赖，可并行）

**4.1 创建/改造 JoinEdge 组件**
- 文件: `src/modules/dataset/components/JoinConfigStep/components/JoinEdge/JoinEdge.tsx`
- 功能:
  - 显示 join 类型 label（如 INNER、LEFT）
  - 显示关联字段名（如 `user_id = id`）
  - 边的 label 联动 `JoinConfig.joinType`
- 依赖: 无（可参考现有 JoinRelationGraph 中的 JoinEdge）

**4.2 创建 JoinEdge 样式**
- 文件: `src/modules/dataset/components/JoinConfigStep/components/JoinEdge/JoinEdge.module.scss`
- 依赖: 4.1

**4.3 创建 JoinEdge 索引**
- 文件: `src/modules/dataset/components/JoinConfigStep/components/JoinEdge/index.ts`
- 依赖: 4.1, 4.2

---

### Phase 5: JoinConfigStep 主体改造（依赖 Phase 1, 3, 4）

**5.1 改造 JoinConfigStep 主体**
- 文件: `src/modules/dataset/components/JoinConfigStep/JoinConfigStep.tsx`
- 功能:
  - 集成 ReactFlow
  - 根据 `formData.tables` 生成节点
  - 根据 `formData.joins` 生成边
  - 实现 `isValidConnection` 验证（每两表只有一条边）
  - Handle 禁用态计算（已连接的 handle 禁用）
  - `onConnect` 创建新 JoinConfig
  - 布局使用 dagre 自动排列
- 依赖: 1.1, 3.1, 4.1, 5.2

**5.2 创建 JoinConfigStep 布局工具**
- 文件: `src/modules/dataset/components/JoinConfigStep/utils/graphLayout.ts`
- 功能: 使用 dagre 实现自动布局
- 依赖: 无

**5.3 创建连接验证工具**
- 文件: `src/modules/dataset/components/JoinConfigStep/utils/connectionUtils.ts`
- 功能:
  - 解析 handle ID 获取 tableId 和 columnName
  - 检查两表间是否已有边
  - 判断 handle 是否已连接
- 依赖: 无

---

### Phase 6: Join 信息列表面板（依赖 Phase 5）

**6.1 创建 JoinInfoPanel 组件**
- 文件: `src/modules/dataset/components/JoinConfigStep/components/JoinInfoPanel/JoinInfoPanel.tsx`
- 功能:
  - 显示所有 join 的可编辑列表
  - 可编辑 join 类型下拉框
  - 可编辑左右字段下拉框
  - 删除按钮
  - 联动边的 label 更新
- 依赖: 5.1

**6.2 创建 JoinInfoPanel 样式**
- 文件: `src/modules/dataset/components/JoinConfigStep/components/JoinInfoPanel/JoinInfoPanel.module.scss`
- 依赖: 6.1

**6.3 创建 JoinInfoPanel 索引**
- 文件: `src/modules/dataset/components/JoinConfigStep/components/JoinInfoPanel/index.ts`
- 依赖: 6.1, 6.2

---

### Phase 7: 组件索引与类型（依赖前面所有）

**7.1 创建 JoinConfigStep 组件索引**
- 文件: `src/modules/dataset/components/JoinConfigStep/index.ts`
- 内容: 导出 JoinConfigStep
- 依赖: 5.1, 6.1

**7.2 更新 editor.types.ts**
- 文件: `src/modules/dataset/types/editor.types.ts`
- 可能需要: 扩展 JoinConfig 或相关类型
- 依赖: 无（视情况）

---

## 任务并行策略

### 可完全并行（无依赖）：
- 1.1, 1.2
- 3.1, 3.2, 3.3, 3.4
- 4.1, 4.2, 4.3
- 5.2, 5.3

### 依赖 Phase 1 后可并行：
- 2.1, 2.2

### 依赖 Phase 3, 4 后可并行：
- 5.1

### 依赖 Phase 5 后可并行：
- 6.1, 6.2, 6.3

### 最后执行：
- 7.1, 7.2

---

## 执行顺序建议

```
第一波（完全并行）:
- 创建 Store (1.1, 1.2)
- 创建 TableFieldNode 组件 (3.1, 3.2, 3.3, 3.4)
- 创建 JoinEdge 组件 (4.1, 4.2, 4.3)
- 创建工具函数 (5.2, 5.3)

第二波（依赖 Store）:
- 改造 DatasetEditorPage (2.1)
- 简化 DataSourceStep (2.2)

第三波（依赖组件和工具）:
- 改造 JoinConfigStep 主体 (5.1)

第四波（依赖主体）:
- 创建 JoinInfoPanel (6.1, 6.2, 6.3)

最后：
- 整理索引和类型 (7.1, 7.2)
```
