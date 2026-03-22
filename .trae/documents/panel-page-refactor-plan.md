# PanelPage 重构计划

## 问题分析

### 当前问题

1. **职责混乱**：单个组件处理了多个职责
   - 数据集选择与面板创建
   - 面板编辑状态管理
   - 字段/指标拖拽逻辑
   - 查询执行逻辑
   - 保存/另存为操作
   - UI 渲染

2. **状态管理复杂**
   - 7 个 useState 分散管理
   - 3 个 useEffect 用于状态同步
   - 状态之间存在复杂的依赖关系
   - panelData → queryData → datasetData 的数据链路复杂

3. **代码重复**
   - `handleSave` 和 `handleSaveAs` 有大量重复逻辑
   - panelType 和 config 的计算逻辑重复

4. **类型安全问题**
   - 大量使用 `as any`、`as string` 等类型断言
   - 类型定义不够精确

5. **依赖项复杂**
   - useCallback 的依赖项列表过长
   - 容易导致不必要的重新渲染

## 重构目标

1. **职责分离**：将不同职责拆分到独立的自定义 Hook
2. **状态集中管理**：相关状态集中到对应的 Hook 中
3. **逻辑复用**：提取公共逻辑，减少代码重复
4. **类型安全**：减少类型断言，增强类型推导
5. **可测试性**：Hook 可以独立测试

## 重构步骤

### 步骤 1：创建 hooks 目录结构

```
src/modules/panel/
├── hooks/
│   ├── index.ts                    # 导出所有 hooks
│   ├── usePanelEditorState.ts      # 管理面板编辑器状态
│   ├── usePanelActions.ts          # 管理保存/另存为操作
│   ├── useDatasetSelector.ts       # 管理数据集选择
│   └── usePreviewSpec.ts           # 管理预览配置生成
```

### 步骤 2：创建 usePanelEditorState Hook

**职责**：
- 管理拖拽字段/指标状态
- 管理显示类型和编辑器配置
- 管理临时查询数据
- 同步 panelData/queryData/datasetData 到本地状态
- 提供字段/指标的添加/删除操作

**输入参数**：
- `panelId: string | undefined`

**返回值**：
- `dropFields: DragItem[]` - 已拖入的字段列表
- `dropMetrics: DragItem[]` - 已拖入的指标列表
- `displayType: DisplayPanelType` - 显示类型
- `editorConfig: PanelEditorConfig` - 编辑器配置
- `tempData: ExecuteQueryResponse | undefined` - 临时查询数据
- `panelData: PanelResponse | undefined` - 面板数据
- `queryData: QueryResponse | undefined` - 查询数据
- `datasetData: DatasetResponse | undefined` - 数据集数据
- `handleDropField: (item: DragItem) => void` - 添加字段
- `handleRemoveField: (item: DragItem) => void` - 移除字段
- `handleDropMetric: (item: DragItem) => void` - 添加指标
- `handleRemoveMetric: (item: DragItem) => void` - 移除指标
- `handleEditorChange: (type: DisplayPanelType, config: PanelEditorConfig) => void` - 编辑器变更
- `handleRun: () => void` - 执行查询

### 步骤 3：创建 usePanelActions Hook

**职责**：
- 管理保存操作
- 管理另存为操作
- 提取公共的 panelType/config 计算逻辑
- 提取公共的 queryDsl 构建逻辑

**输入参数**：
- `panelId: string | undefined`
- `panelData: PanelResponse | undefined`
- `queryData: QueryResponse | undefined`
- `datasetData: DatasetResponse | undefined`
- `dropFields: DragItem[]`
- `dropMetrics: DragItem[]`
- `displayType: DisplayPanelType`
- `editorConfig: PanelEditorConfig`
- `handleRun: () => void`
- `navigate: NavigateFunction`

**返回值**：
- `handleSave: () => void` - 保存操作
- `handleSaveAs: () => void` - 另存为操作

### 步骤 4：创建 useDatasetSelector Hook

**职责**：
- 管理数据集列表获取
- 管理数据集选择逻辑
- 创建查询和面板

**输入参数**：
- `navigate: NavigateFunction`

**返回值**：
- `datasets: DatasetResponse[] | undefined` - 数据集列表
- `handleSelectDataset: (dataset: DatasetResponse) => void` - 选择数据集

### 步骤 5：创建 usePreviewSpec Hook

**职责**：
- 根据显示类型和配置生成预览 spec

**输入参数**：
- `displayType: DisplayPanelType`
- `editorConfig: PanelEditorConfig`

**返回值**：
- `previewSpec: object | undefined` - 预览配置

### 步骤 6：重构 PanelPage 组件

**职责**：
- 协调各个 Hook
- UI 渲染

**结构**：
```tsx
export const PanelPage = () => {
  const { panelId } = useParams();
  const navigate = useNavigate();

  // 数据集选择
  const { datasets, handleSelectDataset } = useDatasetSelector(navigate);

  // 面板编辑状态
  const {
    dropFields,
    dropMetrics,
    displayType,
    editorConfig,
    tempData,
    panelData,
    datasetData,
    handleDropField,
    handleRemoveField,
    handleDropMetric,
    handleRemoveMetric,
    handleEditorChange,
    handleRun,
  } = usePanelEditorState(panelId);

  // 面板操作
  const { handleSave, handleSaveAs } = usePanelActions({
    panelId,
    panelData,
    datasetData,
    dropFields,
    dropMetrics,
    displayType,
    editorConfig,
    handleRun,
    navigate,
  });

  // 预览配置
  const previewSpec = usePreviewSpec(displayType, editorConfig);

  // 渲染逻辑...
};
```

### 步骤 7：更新导出

更新 `src/modules/panel/hooks/index.ts` 导出所有 hooks：
```typescript
export { usePanelEditorState } from './usePanelEditorState';
export { usePanelActions } from './usePanelActions';
export { useDatasetSelector } from './useDatasetSelector';
export { usePreviewSpec } from './usePreviewSpec';
```

## 文件变更清单

| 操作 | 文件路径 |
|------|----------|
| 新建 | `src/modules/panel/hooks/index.ts` |
| 新建 | `src/modules/panel/hooks/usePanelEditorState.ts` |
| 新建 | `src/modules/panel/hooks/usePanelActions.ts` |
| 新建 | `src/modules/panel/hooks/useDatasetSelector.ts` |
| 新建 | `src/modules/panel/hooks/usePreviewSpec.ts` |
| 修改 | `src/modules/panel/pages/panelPage.tsx` |

## 预期收益

1. **代码可读性**：每个 Hook 职责单一，代码更易理解
2. **可维护性**：修改某个功能只需修改对应的 Hook
3. **可测试性**：每个 Hook 可以独立进行单元测试
4. **复用性**：Hook 可以在其他组件中复用
5. **类型安全**：减少类型断言，增强类型推导
6. **性能优化**：更精确的依赖项控制，减少不必要的重新渲染

## 风险与注意事项

1. **保持功能一致**：重构过程中确保所有功能保持不变
2. **类型定义**：需要确保类型导入正确
3. **依赖关系**：注意 Hook 之间的依赖关系，避免循环依赖
4. **测试验证**：重构后需要验证所有功能正常工作
