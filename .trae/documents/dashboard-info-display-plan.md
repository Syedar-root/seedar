# Dashboard 信息展示功能实现计划

## 需求概述
在 dashboardPage.tsx 的 main 区域中添加一个简单的 dashboard 信息展示区域，展示 name 和 id，支持 id 复制和 name 修改功能。

## 实现步骤

### 1. 在 dashboardPage.tsx 中引入必要的 hooks 和组件
- 引入 `useDashboard` hook 获取当前 dashboard 数据
- 引入 `useUpdateDashboard` hook 更新 dashboard name
- 引入 `Copy` 图标（从 lucide-react）
- 引入 `useState` 管理编辑状态

### 2. 添加 DashboardInfo 组件
在 main 区域中，在 SeedarDashboard 组件之前添加一个信息展示区域：
- 展示 dashboard 的 name（可编辑）
- 展示 dashboard 的 id（可复制）
- 在编辑模式下显示输入框
- 在浏览模式下显示文本

### 3. 实现 name 编辑功能
- 添加编辑按钮（Edit 图标）
- 点击编辑按钮切换到编辑模式
- 显示输入框修改 name
- 添加保存和取消按钮
- 使用 `useUpdateDashboard` mutation 保存修改
- 保存成功后切换回浏览模式

### 4. 实现 id 复制功能
- 在 id 旁边添加复制按钮（Copy 图标）
- 点击复制按钮将 id 复制到剪贴板
- 使用 `navigator.clipboard.writeText()` API
- 添加复制成功的提示（可选）

### 5. 添加样式
在 dashboard.module.scss 中添加：
- `.dashboardInfo` - 信息展示容器样式
- `.dashboardInfoHeader` - 信息区域头部样式
- `.dashboardName` - name 显示样式
- `.dashboardId` - id 显示样式
- `.dashboardIdValue` - id 值样式
- `.copyButton` - 复制按钮样式
- `.editButton` - 编辑按钮样式
- `.nameEditForm` - name 编辑表单样式
- `.nameInput` - name 输入框样式
- `.editActions` - 编辑操作按钮组样式
- `.saveButton` - 保存按钮样式
- `.cancelButton` - 取消按钮样式

### 6. 处理加载和错误状态
- 当 dashboard 数据加载中时显示加载状态
- 当 dashboard 数据加载失败时显示错误信息

## 技术细节

### 数据流
1. 使用 `useDashboard(dashboardId)` 获取 dashboard 数据
2. 使用 `useUpdateDashboard()` 获取更新 mutation
3. 本地 state 管理编辑模式（`isEditing`）
4. 本地 state 管理编辑中的 name 值（`editingName`）

### API 调用
- `GET /dashboard/:id` - 获取 dashboard 详情（通过 useDashboard hook）
- `PATCH /dashboard/:id` - 更新 dashboard name（通过 useUpdateDashboard hook）

### 交互设计
- 默认显示 name 和 id（浏览模式）
- 点击编辑按钮进入编辑模式
- 编辑模式下显示输入框和保存/取消按钮
- 点击复制按钮复制 id 到剪贴板
- 保存成功后自动切换回浏览模式并更新显示

### 样式规范
- 遵循现有的样式变量（如 `--spacing-md`、`--text-primary` 等）
- 使用现有的 button mixin（`@mixin button-base`）
- 保持与现有 header 风格一致

## 文件修改清单
1. `d:\Program\projects\seedar\apps\web-client\src\modules\dashboard\pages\dashboardPage.tsx` - 主要修改
2. `d:\Program\projects\seedar\apps\web-client\src\modules\dashboard\pages\styles\dashboard.module.scss` - 添加样式

## 注意事项
- 确保 dashboardId 存在时才显示信息区域
- 处理 name 为空的情况
- 复制功能需要考虑浏览器兼容性（现代浏览器都支持 clipboard API）
- 编辑模式下禁用其他操作（如模式切换）
