# Tasks

- [x] Task 1: 配置依赖

  - [x] 在 packages/ui-react/package.json 的 peerDependencies 中添加 react-grid-layout
  - [x] 在 packages/ui-react/package.json 的 devDependencies 中添加 @types/react-grid-layout
  - [x] 在项目根目录运行 pnpm install 安装依赖

- [x] Task 2: 创建类型定义文件

  - [x] 创建 types.ts 文件，定义 Layout、Panel、LayoutTemplate 等类型
  - [x] 定义 GridContainerProps 接口
  - [x] 定义 GridPanelProps 接口

- [x] Task 3: 创建布局管理工具

  - [x] 创建 layoutManager.ts 文件
  - [x] 实现布局持久化功能（localStorage）
  - [x] 实现布局模板管理功能
  - [x] 实现布局验证和转换工具

- [x] Task 4: 创建 GridPanel 组件

  - [x] 创建 gridPanel.tsx 文件
  - [x] 实现标题栏组件（包含标题和操作按钮）
  - [x] 实现操作按钮（删除、复制、锁定）
  - [x] 实现内容容器
  - [x] 添加样式定制支持

- [x] Task 5: 创建 GridContainer 主组件

  - [x] 创建 gridContainer.tsx 文件
  - [x] 集成 react-grid-layout
  - [x] 实现布局状态管理
  - [x] 实现添加/删除/复制 panel 的方法
  - [x] 实现布局持久化集成
  - [x] 实现布局模板切换
  - [x] 添加响应式配置

- [x] Task 6: 创建导出文件

  - [x] 更新 index.ts，导出 GridContainer、GridPanel 和相关类型
  - [x] 更新 components/index.ts，导出 gridContainer 模块

- [x] Task 7: 添加样式文件

  - [x] 创建 gridContainer.css 文件（如果需要）
  - [x] 添加必要的样式定义

- [x] Task 8: 创建使用示例
  - [x] 创建示例文件，展示如何使用 GridContainer 和 GridPanel
  - [x] 展示如何集成 VChart 和 VTable

# Task Dependencies

- [Task 2] depends on [Task 1]
- [Task 3] depends on [Task 2]
- [Task 4] depends on [Task 2]
- [Task 5] depends on [Task 3, Task 4]
- [Task 6] depends on [Task 5]
- [Task 7] depends on [Task 5]
- [Task 8] depends on [Task 5]
