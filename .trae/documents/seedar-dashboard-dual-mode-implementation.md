# Seedar Dashboard 双模式功能实施计划

## 目标
为 Seedar Dashboard 组件添加 edit 和 view 两种模式，实现可编辑和只读浏览的功能切换。

## 功能需求

### Edit 模式（默认）
- ✅ 可拖拽面板位置
- ✅ 可调整面板大小
- ✅ 可添加/删除面板
- ✅ 可保存/取消布局更改
- ✅ 显示所有编辑相关按钮和控件

### View 模式
- ❌ 禁用拖拽功能
- ❌ 禁用调整大小功能
- ❌ 隐藏编辑相关按钮（添加、删除、保存、取消等）
- ✅ 只展示内容，保持布局稳定
- ✅ 响应式布局正常工作

## 实施步骤

### 步骤 1：修改 SeedarDashboard 组件接口
**文件**: `d:\Program\projects\seedar\packages\ui-react\src\components\gridContainer\seedar\seedarDashboard.tsx`

**修改内容**:
1. 在 `SeedarDashboardProps` 接口中添加 `mode` 属性
   ```typescript
   mode?: 'edit' | 'view';
   ```
2. 设置默认值为 `'edit'`
3. 在组件函数参数中接收 `mode` 参数
4. 将 `mode` 传递给 `SeedarDashboardContext.Provider`
5. 将 `mode` 传递给 `GridContainer` 组件

### 步骤 2：更新 SeedarDashboardContext
**文件**: `d:\Program\projects\seedar\packages\ui-react\src\components\gridContainer\seedar\seedarDashboardContext.tsx`

**修改内容**:
1. 在 `SeedarDashboardContextValue` 接口中添加 `mode` 字段
   ```typescript
   mode: 'edit' | 'view';
   ```

### 步骤 3：修改 GridContainer 组件
**文件**: `d:\Program\projects\seedar\packages\ui-react\src\components\gridContainer\gridContainter.tsx`

**修改内容**:
1. 在 `GridContainerProps` 接口中添加 `mode` 属性
   ```typescript
   mode?: 'edit' | 'view';
   ```
2. 设置默认值为 `'edit'`
3. 在组件函数参数中接收 `mode` 参数
4. 修改 `handleDragStop` 函数，只在 `mode === 'edit'` 时处理布局更新
5. 修改 `handleResizeStop` 函数，只在 `mode === 'edit'` 时处理布局更新
6. 在 `Responsive` 组件中添加以下属性：
   ```typescript
   isDraggable={mode === 'edit'}
   isResizable={mode === 'edit'}
   ```

### 步骤 4：更新 SeedarPanel 组件（可选增强）
**文件**: `d:\Program\projects\seedar\packages\ui-react\src\components\gridContainer\seedar\seedarPanel.tsx`

**修改内容**:
1. 使用 `useSeedarDashboardContext` 获取当前模式
2. 根据 mode 控制面板头部的编辑按钮显示/隐藏
3. 在 view 模式下隐藏删除按钮等编辑控件

### 步骤 5：更新 SeedarDashboardTriggers 组件（可选增强）
**文件**: `d:\Program\projects\seedar\packages\ui-react\src\components\gridContainer\seedar\seedarDashboardTriggers.tsx`

**修改内容**:
1. 使用 `useSeedarDashboardContext` 获取当前模式
2. 在 view 模式下隐藏 `AddPanelTrigger`、`RemovePanelTrigger` 等编辑相关触发器
3. 在 view 模式下隐藏 `SaveTrigger` 和 `CancelTrigger`

### 步骤 6：验证功能
**验证点**:
1. 测试 edit 模式下拖拽功能正常
2. 测试 edit 模式下调整大小功能正常
3. 测试 view 模式下拖拽被禁用
4. 测试 view 模式下调整大小被禁用
5. 测试 view 模式下编辑按钮被隐藏
6. 测试响应式布局在两种模式下都正常工作
7. 测试模式切换功能（如果实现了动态切换）

## 使用示例

```typescript
// 编辑模式（默认）
<SeedarDashboard dashboardId="dashboard-1" mode="edit" />

// 浏览模式
<SeedarDashboard dashboardId="dashboard-1" mode="view" />

// 动态切换模式
const [mode, setMode] = useState<'edit' | 'view'>('edit');
<SeedarDashboard dashboardId="dashboard-1" mode={mode} />
```

## 注意事项

1. **向后兼容性**: `mode` 属性是可选的，默认值为 `'edit'`，不影响现有使用
2. **类型安全**: 使用 TypeScript 字面量类型确保只能传入 `'edit'` 或 `'view'`
3. **性能优化**: 在 view 模式下禁用拖拽和调整大小可以提升性能
4. **用户体验**: view 模式下应提供清晰的视觉反馈，表明当前是只读状态

## 后续扩展建议

1. 添加模式切换按钮组件
2. 根据用户权限自动设置模式
3. 持久化用户的模式偏好
4. 添加 view 模式下的视觉样式差异（如边框、阴影等）
