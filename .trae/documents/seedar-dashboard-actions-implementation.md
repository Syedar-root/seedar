# SeedarDashboard 操作功能实现计划

## 目标
为 SeedarDashboard 添加操作功能，使用 `useDashboardActions` hook 封装所有 dashboard 操作，让使用侧完全自主控制触发组件和交互逻辑。

## 设计方案
- **方案选择**：使用 hook 模式，不提供预制组件
- **灵活性**：使用侧完全自主决定触发方式和 UI
- **状态管理**：分别返回各个操作的 loading 状态
- **错误处理**：由使用侧自己处理

## 实现步骤

### 1. 创建 `useDashboardActions` hook
**文件路径**：`d:\projects\seedar\packages\ui-react\src\hooks\useDashboardActions.ts`

**功能**：
- 封装所有 dashboard 操作方法
- 分别返回各个操作的 loading 状态
- 返回各个操作的错误状态

**返回值结构**：
```typescript
interface UseDashboardActionsReturn {
  actions: {
    updateDashboard: (data: UpdateDashboardRequest) => void;
    addPanel: (panelId: string) => void;
    removePanel: (panelId: string) => void;
    updateLayout: (layout: Layouts) => void;
  };
  state: {
    isUpdatingDashboard: boolean;
    isAddingPanel: boolean;
    isRemovingPanel: boolean;
    isUpdatingLayout: boolean;
    isUpdateDashboardError: boolean;
    isAddPanelError: boolean;
    isRemovePanelError: boolean;
    isUpdateLayoutError: boolean;
  };
}
```

### 2. 导出 hook
**文件路径**：`d:\projects\seedar\packages\ui-react\src\hooks\index.ts`

**操作**：
- 在 `index.ts` 中添加 `useDashboardActions` 的导出

### 3. 更新类型定义
**文件路径**：`d:\projects\seedar\packages\ui-react\src\hooks\useDashboardActions.ts`

**操作**：
- 导入必要的类型定义
- 确保类型安全

## 使用示例

```typescript
function MyDashboardPage() {
  const dashboardId = '123';
  const { actions, state } = useDashboardActions(dashboardId);
  
  const handleAddPanel = () => {
    const selectedPanelId = prompt('请输入 panel ID');
    if (selectedPanelId) {
      actions.addPanel(selectedPanelId);
    }
  };
  
  return (
    <div>
      <div className="toolbar">
        <Button 
          onClick={() => actions.updateDashboard({ name: '新名称' })}
          disabled={state.isUpdatingDashboard}
        >
          {state.isUpdatingDashboard ? '更新中...' : '更新 Dashboard'}
        </Button>
        
        <Button 
          onClick={handleAddPanel}
          disabled={state.isAddingPanel}
        >
          {state.isAddingPanel ? '添加中...' : '添加 Panel'}
        </Button>
        
        <Button 
          onClick={() => actions.removePanel('panel-2')}
          disabled={state.isRemovingPanel}
        >
          {state.isRemovingPanel ? '移除中...' : '移除 Panel'}
        </Button>
      </div>
      
      {state.isUpdateDashboardError && (
        <div className="error">更新失败，请重试</div>
      )}
      
      {state.isAddPanelError && (
        <div className="error">添加 Panel 失败，请重试</div>
      )}
      
      <SeedarDashboard dashboardId={dashboardId} />
    </div>
  );
}
```

## 优势
1. **最大灵活性**：使用侧完全自主控制所有操作和 UI
2. **类型安全**：TypeScript 完整支持
3. **状态清晰**：分别返回各个操作的 loading 和 error 状态
4. **易于测试**：hook 独立，易于单元测试
5. **一致性**：所有操作使用统一的 hook 模式
6. **简洁性**：使用布尔值表示错误状态，符合 React Query 设计模式

## 文件清单
1. `d:\projects\seedar\packages\ui-react\src\hooks\useDashboardActions.ts` (新建)
2. `d:\projects\seedar\packages\ui-react\src\hooks\index.ts` (修改)

## 注意事项
- 不需要修改 `SeedarDashboard` 组件，保持其简单性
- 使用侧需要自己处理错误和 loading 状态
- 使用侧需要自己实现触发组件和交互逻辑
