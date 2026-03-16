# SeedarDashboard 复合组件设计实现计划

## 目标

将 dashboard 逻辑集中在 `SeedarDashboard` 组件中，基于扩展后的 `useDashboardActions` 实现，提供 trigger 组件和布局插槽，简化使用侧的复杂度。

## 核心设计思路

### useDashboardActions 扩展设计

将 `useDashboardActions` 扩展为管理所有 dashboard 相关逻辑的中心：

* **数据获取**：获取 dashboard 数据（原 `useDashboard` 功能）

* **操作方法**：所有 dashboard 操作方法

* **状态管理**：所有状态（loading、error、unsaved changes 等）

* **本地状态**：管理 layout 本地状态

### Trigger 组件设计

Trigger 组件基于 `useDashboardActions` 的返回值设计，提供：

* **SaveTrigger** - 保存布局

* **CancelTrigger** - 取消更改

* **AddPanelTrigger** - 添加 panel

* **RemovePanelTrigger** - 移除 panel

## 设计方案

### 复合组件结构

```typescript
<SeedarDashboard dashboardId="123">
  <SeedarDashboard.Triggers>
    <SeedarDashboard.SaveTrigger>保存布局</SeedarDashboard.SaveTrigger>
    <SeedarDashboard.CancelTrigger>取消</SeedarDashboard.CancelTrigger>
  </SeedarDashboard.Triggers>
</SeedarDashboard>
```

### 核心组件

1. **SeedarDashboard** - 主组件，管理所有状态和逻辑
2. **SeedarDashboard.Triggers** - Trigger 容器
3. **SeedarDashboard.SaveTrigger** - 保存布局触发器
4. **SeedarDashboard.CancelTrigger** - 取消更改触发器

## 详细实现步骤

### 步骤 1：扩展 useDashboardActions hook

**文件路径**：`d:\projects\seedar\packages\ui-react\src\hooks\useDashboardActions.ts`

**任务内容**：

1. 添加 dashboard 数据获取功能（原 `useDashboard` 功能）
2. 管理 layout 本地状态
3. 提供未保存更改状态
4. 提供保存和取消方法

**接口定义**：

```typescript
interface UseDashboardActionsReturn {
  // 数据
  data: DashboardResponse | undefined;
  
  // 操作方法
  actions: {
    updateDashboard: (data: UpdateDashboardRequest) => void;
    addPanel: (panelId: string) => void;
    removePanel: (panelId: string) => void;
    updateLayout: (layout: Layouts) => void;
    saveLayout: () => void;  // 保存本地 layout 到服务器
    cancelChanges: () => void;  // 取消本地更改
  };
  
  // 状态
  state: {
    // 数据加载状态
    isLoading: boolean;
    isError: boolean;
    
    // 操作状态
    isUpdatingDashboard: boolean;
    isAddingPanel: boolean;
    isRemovingPanel: boolean;
    isUpdatingLayout: boolean;
    isSavingLayout: boolean;  // 保存 layout 的状态
    
    // 错误状态
    isUpdateDashboardError: boolean;
    isAddPanelError: boolean;
    isRemovePanelError: boolean;
    isUpdateLayoutError: boolean;
    isSaveLayoutError: boolean;
    
    // 本地状态
    hasUnsavedChanges: boolean;  // 是否有未保存的更改
    localLayout: Layouts;  // 本地 layout 状态
  };
}
```

**实现要点**：

1. 使用 `useDashboard` 获取 dashboard 数据
2. 使用 `useState` 管理 layout 本地状态
3. 比较 `localLayout` 和 `data.layout` 判断是否有未保存的更改
4. 提供 `saveLayout` 方法，将本地 layout 保存到服务器
5. 提供 `cancelChanges` 方法，重置本地 layout 为服务器数据
6. 当 `autoUpdate` 为 `true` 时，直接调用 `actions.updateLayout`

### 步骤 2：修改 GridContainer 组件

**文件路径**：`d:\projects\seedar\packages\ui-react\src\components\gridContainer\gridContainter.tsx`

**任务内容**：

1. 添加 `onLayoutChange` 回调 prop
2. 在 `Responsive` 组件上添加 `onLayoutChange` 事件处理

**Props 接口修改**：

```typescript
interface GridContainerProps {
  layouts: Layouts;
  onLayoutChange?: (layouts: Layouts) => void;
  children: React.ReactNode;
}
```

**实现要点**：

* 添加 `onLayoutChange` 可选参数

* 在 `Responsive` 组件上绑定 `onLayoutChange` 事件

* 当 layout 变化时，调用 `onLayoutChange` 回调

### 步骤 3：创建 SeedarDashboard Context

**文件路径**：`d:\projects\seedar\packages\ui-react\src\components\gridContainer\seedar\seedarDashboardContext.tsx`

**任务内容**：

1. 创建 Context 接口定义
2. 创建 Context Provider 组件
3. 创建自定义 hook `useSeedarDashboardContext`

**接口定义**：

```typescript
interface SeedarDashboardContextValue {
  dashboardId: string;
  data: DashboardResponse | undefined;
  actions: UseDashboardActionsReturn['actions'];
  state: UseDashboardActionsReturn['state'];
}
```

**实现要点**：

* 使用 `useDashboardActions` 获取所有功能

* 将 `useDashboardActions` 的返回值通过 Context 传递给子组件

* 简化 Context，只传递必要的数据

### 步骤 4：创建 Trigger 组件

**文件路径**：`d:\projects\seedar\packages\ui-react\src\components\gridContainer\seedar\seedarDashboardTriggers.tsx`

**任务内容**：

1. 创建 `Triggers` 容器组件
2. 创建 `SaveTrigger` 组件
3. 创建 `CancelTrigger` 组件
4. 创建 `AddPanelTrigger` 组件（可选）
5. 创建 `RemovePanelTrigger` 组件（可选）

**组件接口**：

**Triggers 组件**：

```typescript
interface TriggersProps {
  children: React.ReactNode;
}

export const Triggers: React.FC<TriggersProps> = ({ children }) => {
  return <div className="seedar-dashboard-triggers">{children}</div>;
};
```

**SaveTrigger 组件**：

```typescript
interface SaveTriggerProps {
  children?: React.ReactNode | ((props: SaveTriggerRenderProps) => React.ReactNode);
}

interface SaveTriggerRenderProps {
  onClick: () => void;
  disabled: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
}

export const SaveTrigger: React.FC<SaveTriggerProps> = ({ children }) => {
  const { actions, state } = useSeedarDashboardContext();
  
  const handleClick = () => {
    if (!state.isSavingLayout && state.hasUnsavedChanges) {
      actions.saveLayout();
    }
  };
  
  const renderProps: SaveTriggerRenderProps = {
    onClick: handleClick,
    disabled: !state.hasUnsavedChanges || state.isSavingLayout,
    isSaving: state.isSavingLayout,
    hasUnsavedChanges: state.hasUnsavedChanges,
  };
  
  if (typeof children === 'function') {
    return <>{children(renderProps)}</>;
  }
  
  return (
    <button onClick={handleClick} disabled={renderProps.disabled}>
      {children || '保存布局'}
    </button>
  );
};
```

**CancelTrigger 组件**：

```typescript
interface CancelTriggerProps {
  children?: React.ReactNode | ((props: CancelTriggerRenderProps) => React.ReactNode);
}

interface CancelTriggerRenderProps {
  onClick: () => void;
  disabled: boolean;
  hasUnsavedChanges: boolean;
}

export const CancelTrigger: React.FC<CancelTriggerProps> = ({ children }) => {
  const { actions, state } = useSeedarDashboardContext();
  
  const handleClick = () => {
    if (state.hasUnsavedChanges) {
      actions.cancelChanges();
    }
  };
  
  const renderProps: CancelTriggerRenderProps = {
    onClick: handleClick,
    disabled: !state.hasUnsavedChanges,
    hasUnsavedChanges: state.hasUnsavedChanges,
  };
  
  if (typeof children === 'function') {
    return <>{children(renderProps)}</>;
  }
  
  return (
    <button onClick={handleClick} disabled={renderProps.disabled}>
      {children || '取消'}
    </button>
  );
};
```

**AddPanelTrigger 组件**：

```typescript
interface AddPanelTriggerProps {
  panelId: string;
  children?: React.ReactNode | ((props: AddPanelTriggerRenderProps) => React.ReactNode);
}

interface AddPanelTriggerRenderProps {
  onClick: () => void;
  disabled: boolean;
  isAdding: boolean;
}

export const AddPanelTrigger: React.FC<AddPanelTriggerProps> = ({ panelId, children }) => {
  const { actions, state } = useSeedarDashboardContext();
  
  const handleClick = () => {
    if (!state.isAddingPanel) {
      actions.addPanel(panelId);
    }
  };
  
  const renderProps: AddPanelTriggerRenderProps = {
    onClick: handleClick,
    disabled: state.isAddingPanel,
    isAdding: state.isAddingPanel,
  };
  
  if (typeof children === 'function') {
    return <>{children(renderProps)}</>;
  }
  
  return (
    <button onClick={handleClick} disabled={renderProps.disabled}>
      {children || '添加 Panel'}
    </button>
  );
};
```

**RemovePanelTrigger 组件**：

```typescript
interface RemovePanelTriggerProps {
  panelId: string;
  children?: React.ReactNode | ((props: RemovePanelTriggerRenderProps) => React.ReactNode);
}

interface RemovePanelTriggerRenderProps {
  onClick: () => void;
  disabled: boolean;
  isRemoving: boolean;
}

export const RemovePanelTrigger: React.FC<RemovePanelTriggerProps> = ({ panelId, children }) => {
  const { actions, state } = useSeedarDashboardContext();
  
  const handleClick = () => {
    if (!state.isRemovingPanel) {
      actions.removePanel(panelId);
    }
  };
  
  const renderProps: RemovePanelTriggerRenderProps = {
    onClick: handleClick,
    disabled: state.isRemovingPanel,
    isRemoving: state.isRemovingPanel,
  };
  
  if (typeof children === 'function') {
    return <>{children(renderProps)}</>;
  }
  
  return (
    <button onClick={handleClick} disabled={renderProps.disabled}>
      {children || '移除 Panel'}
    </button>
  );
};
```

### 步骤 5：重构 SeedarDashboard 组件

**文件路径**：`d:\projects\seedar\packages\ui-react\src\components\gridContainer\seedar\seedarDashboard.tsx`

**任务内容**：

1. 添加 Context Provider
2. 使用 `useDashboardActions` 获取所有功能
3. 处理 layout 变化
4. 将 trigger 组件作为静态属性附加
5. 支持 `autoUpdate` 模式

**Props 接口**：

```typescript
interface SeedarDashboardProps {
  dashboardId: string;
  autoUpdate?: boolean;  // 是否自动更新，默认 false
  children?: React.ReactNode;
}
```

**实现要点**：

1. 使用 `useDashboardActions` 获取所有功能（数据、操作、状态）
2. 当 `autoUpdate` 为 `true` 时，直接调用 `actions.updateLayout`
3. 当 `autoUpdate` 为 `false` 时，更新本地状态，等待用户确认
4. 将 `Triggers`、`SaveTrigger`、`CancelTrigger`、`AddPanelTrigger`、`RemovePanelTrigger` 作为静态属性附加
5. 处理数据加载和错误状态

**组件结构**：

```typescript
export const SeedarDashboard: React.FC<SeedarDashboardProps> & {
  Triggers: typeof Triggers;
  SaveTrigger: typeof SaveTrigger;
  CancelTrigger: typeof CancelTrigger;
  AddPanelTrigger: typeof AddPanelTrigger;
  RemovePanelTrigger: typeof RemovePanelTrigger;
} = ({ dashboardId, autoUpdate = false, children }) => {
  const { data, actions, state } = useDashboardActions(dashboardId, autoUpdate);
  
  // 处理加载和错误状态
  if (state.isLoading || state.isError || !data) {
    return null;
  }
  
  const handleLayoutChange = (newLayouts: Layouts) => {
    if (autoUpdate) {
      actions.updateLayout(newLayouts);
    } else {
      // 更新本地状态（通过 actions.updateLayout 内部处理）
      actions.updateLayout(newLayouts);
    }
  };
  
  return (
    <SeedarDashboardContext.Provider value={{ dashboardId, data, actions, state }}>
      <GridContainer 
        layouts={state.localLayout} 
        onLayoutChange={handleLayoutChange}
      >
        {data.panels.map((panel) => (
          <SeedarPanel key={panel.id} panelId={panel.id} panel={panel} />
        ))}
      </GridContainer>
      {children}
    </SeedarDashboardContext.Provider>
  );
};

SeedarDashboard.Triggers = Triggers;
SeedarDashboard.SaveTrigger = SaveTrigger;
SeedarDashboard.CancelTrigger = CancelTrigger;
SeedarDashboard.AddPanelTrigger = AddPanelTrigger;
SeedarDashboard.RemovePanelTrigger = RemovePanelTrigger;
```

### 步骤 6：更新导出

**文件路径**：`d:\projects\seedar\packages\ui-react\src\components\gridContainer\seedar\index.ts`

**任务内容**：

1. 导出 `SeedarDashboard` 组件
2. 导出所有 trigger 组件（可选，因为已经作为静态属性附加）

**导出内容**：

```typescript
export { SeedarDashboard } from './seedarDashboard';
export { Triggers, SaveTrigger, CancelTrigger, AddPanelTrigger, RemovePanelTrigger } from './seedarDashboardTriggers';
```

## 使用示例

### 基础使用

```typescript
import { SeedarDashboard } from '@seedar/ui-react';

function MyPage() {
  return (
    <SeedarDashboard dashboardId="123">
      <SeedarDashboard.Triggers>
        <SeedarDashboard.SaveTrigger>保存布局</SeedarDashboard.SaveTrigger>
        <SeedarDashboard.CancelTrigger>取消</SeedarDashboard.CancelTrigger>
      </SeedarDashboard.Triggers>
    </SeedarDashboard>
  );
}
```

### 自定义 Trigger 样式

```typescript
import { SeedarDashboard } from '@seedar/ui-react';
import { Button } from 'some-ui-library';

function MyPage() {
  return (
    <SeedarDashboard dashboardId="123">
      <SeedarDashboard.Triggers>
        <SeedarDashboard.SaveTrigger>
          {(props) => (
            <Button 
              onClick={props.onClick} 
              disabled={props.disabled}
              variant="primary"
            >
              {props.isSaving ? '保存中...' : '保存布局'}
            </Button>
          )}
        </SeedarDashboard.SaveTrigger>
      </SeedarDashboard.Triggers>
    </SeedarDashboard>
  );
}
```

### 添加和移除 Panel

```typescript
import { SeedarDashboard } from '@seedar/ui-react';

function MyPage() {
  return (
    <SeedarDashboard dashboardId="123">
      <SeedarDashboard.Triggers>
        <SeedarDashboard.AddPanelTrigger panelId="panel-1">
          添加 Panel 1
        </SeedarDashboard.AddPanelTrigger>
        <SeedarDashboard.RemovePanelTrigger panelId="panel-2">
          移除 Panel 2
        </SeedarDashboard.RemovePanelTrigger>
      </SeedarDashboard.Triggers>
    </SeedarDashboard>
  );
}
```

### 自动更新模式

```typescript
import { SeedarDashboard } from '@seedar/ui-react';

function MyPage() {
  return (
    <SeedarDashboard 
      dashboardId="123"
      autoUpdate={true}
    />
  );
}
```

### 高级用法：直接使用 useDashboardActions

```typescript
import { useDashboardActions, SeedarDashboard } from '@seedar/ui-react';

function MyPage() {
  const dashboardId = '123';
  const { data, actions, state } = useDashboardActions(dashboardId, false);
  
  const handleCustomSave = () => {
    // 自定义保存逻辑
    if (confirm('确定保存吗？')) {
      actions.saveLayout();
    }
  };
  
  if (state.isLoading) return <div>加载中...</div>;
  if (state.isError) return <div>加载失败</div>;
  
  return (
    <div>
      <div className="custom-toolbar">
        <button onClick={handleCustomSave} disabled={!state.hasUnsavedChanges}>
          {state.isSavingLayout ? '保存中...' : '保存布局'}
        </button>
      </div>
      
      <SeedarDashboard dashboardId={dashboardId} />
    </div>
  );
}
```

## 文件清单

### 新建文件

1. `d:\projects\seedar\packages\ui-react\src\components\gridContainer\seedar\seedarDashboardContext.tsx`
2. `d:\projects\seedar\packages\ui-react\src\components\gridContainer\seedar\seedarDashboardTriggers.tsx`

### 修改文件

1. `d:\projects\seedar\packages\ui-react\src\hooks\useDashboardActions.ts` - 扩展功能
2. `d:\projects\seedar\packages\ui-react\src\components\gridContainer\gridContainter.tsx` - 添加 onLayoutChange
3. `d:\projects\seedar\packages\ui-react\src\components\gridContainer\seedar\seedarDashboard.tsx` - 重构
4. `d:\projects\seedar\packages\ui-react\src\components\gridContainer\seedar\index.ts` - 更新导出

## 优势

1. **逻辑集中**：所有 dashboard 相关逻辑集中在 `useDashboardActions` 中
2. **统一管理**：数据获取、操作、状态管理统一在一个 hook 中
3. **简化使用**：使用侧不需要关心状态管理，直接使用 trigger 组件
4. **灵活性高**：

   * 可以使用复合组件模式（推荐）

   * 可以直接使用 `useDashboardActions` hook（高级用法）

   * 可以自定义 trigger 的 UI 和行为
5. **类型安全**：TypeScript 完整支持
6. **易于维护**：组件职责清晰，逻辑集中
7. **向后兼容**：保持原有 hooks 可用，不影响现有代码
8. **可扩展性强**：可以轻松添加新的 trigger 组件

## 注意事项

* Trigger 组件应该是可选的，不使用时默认不自动更新

* 支持自定义 trigger 的渲染方式（render props 模式）

* `useDashboardActions` 需要管理 layout 本地状态

* 需要比较 `localLayout` 和 `data.layout` 来判断是否有未保存的更改

* 需要处理 dashboard 数据加载状态

* `autoUpdate` 参数控制是否自动更新 layout

