# 重构 AddPanelTrigger 为弹窗选择模式 - 最小化实现

## 目标
将 `AddPanelTrigger` 从直接添加指定 panel 改为通过弹窗选择并添加 panel，支持自定义弹窗组件。

## 实现步骤

### 1. 更新 SeedarDashboardContext
**文件**: `d:\projects\seedar\packages\ui-react\src\components\gridContainer\seedar\seedarDashboardContext.tsx`

- 在 `SeedarDashboardContextValue` 接口中添加弹窗状态：
  - `isAddPanelDialogOpen: boolean` - 弹窗是否打开
  - `openAddPanelDialog: () => void` - 打开弹窗
  - `closeAddPanelDialog: () => void` - 关闭弹窗

### 2. 更新 useDashboardActions Hook
**文件**: `d:\projects\seedar\packages\ui-react\src\hooks\useDashboardActions.ts`

- 添加弹窗状态管理：
  - `isAddPanelDialogOpen` 状态
  - `openAddPanelDialog` 函数
  - `closeAddPanelDialog` 函数
- 在返回的 `state` 对象中添加 `isAddPanelDialogOpen`
- 在返回的 `actions` 对象中添加 `openAddPanelDialog` 和 `closeAddPanelDialog`

### 3. 创建默认弹窗组件 DefaultAddPanelDialog
**文件**: `d:\projects\seedar\packages\ui-react\src\components\gridContainer\seedar\seedarDashboardTriggers.tsx`

- 创建 `DefaultAddPanelDialog` 组件
- 使用 `@base-ui/react` 的 `Dialog` 组件
- 集成 `usePanels` 获取所有可用 panels
- 提供 panel 列表选择界面
- 点击 panel 后调用 `actions.addPanel(panelId)` 并关闭弹窗

### 4. 重构 AddPanelTrigger
**文件**: `d:\projects\seedar\packages\ui-react\src\components\gridContainer\seedar\seedarDashboardTriggers.tsx`

- 移除 `panelId` 参数
- 添加 `panelsDialog` 属性（可选，接受自定义弹窗组件）
- 修改 `handleClick` 为打开弹窗而不是直接添加 panel
- 根据是否传递 `panelsDialog` 决定使用默认弹窗还是自定义弹窗
- 更新 `AddPanelTriggerRenderProps` 接口，移除 `isAdding` 属性

### 5. 更新 SeedarDashboard 导出
**文件**: `d:\projects\seedar\packages\ui-react\src\components\gridContainer\seedar\seedarDashboard.tsx`

- 添加 `DefaultAddPanelDialog` 的导出（可选，让用户可以单独使用）

## API 设计

### AddPanelTrigger 使用示例
```tsx
// 使用默认弹窗
<SeedarDashboard.AddPanelTrigger>添加 Panel</SeedarDashboard.AddPanelTrigger>

// 自定义触发器
<SeedarDashboard.AddPanelTrigger>
  {(props) => <button {...props}>自定义按钮</button>}
</SeedarDashboard.AddPanelTrigger>

// 使用自定义弹窗
<SeedarDashboard.AddPanelTrigger
  panelsDialog={(props) => <CustomDialog {...props} />}
>
  添加 Panel
</SeedarDashboard.AddPanelTrigger>
```

## 最小化实现原则
- 只实现核心功能，不添加额外样式
- 使用 @base-ui/react 的基础 Dialog 组件
- 不添加复杂的动画或过渡效果
- 保持代码简洁，易于理解和维护
