# GridContainer 组件规范

## Why

当前项目需要支持可拖拽、可缩放的 panel 布局系统，用于展示 VChart、VTable 以及其他类型的可视化组件。需要一个通用的、可配置的网格布局容器，支持布局持久化和模板管理。

## What Changes

- 在 `packages/ui-react/src/components/gridContainer/` 目录下创建 GridContainer 组件系统
- 使用 `react-grid-layout` 作为核心布局库（作为 peerDependency）
- 支持拖拽位置、调整大小、删除、复制、锁定 panel
- 支持布局持久化（localStorage）
- 支持布局模板管理
- 提供通用的 GridPanel 组件，可容纳任意 React 组件
- 采用类似 shadcn 的组件设计模式：简单封装，通过 props 透传给底层组件

## Impact

- Affected specs: 无
- Affected code:
  - `packages/ui-react/src/components/gridContainer/` (新建)
  - `packages/ui-react/package.json` (添加 peerDependencies)

## ADDED Requirements

### Requirement: 组件设计模式

系统 SHALL 采用类似 shadcn 的组件设计模式。

#### Scenario: 组件封装

- **WHEN** 实现 GridContainer 和 GridPanel 组件
- **THEN** 组件应：
  - 简单封装底层库（react-grid-layout）
  - 通过 props 透传配置到底层组件
  - 不打包，保持轻量
  - 核心依赖放在 peerDependencies 中
  - 提供类型安全的 TypeScript 接口

### Requirement: GridContainer 主容器

系统 SHALL 提供一个 GridContainer 组件，用于管理多个可拖拽、可缩放的 panel。

#### Scenario: 基本使用

- **WHEN** 用户使用 GridContainer 组件
- **THEN** 组件应支持：
  - 拖拽 panel 位置
  - 调整 panel 大小（最小 2x2 网格单位）
  - 添加新 panel
  - 删除 panel
  - 复制 panel
  - 锁定 panel 位置
  - 保存布局到 localStorage
  - 切换布局模板

### Requirement: GridPanel 通用容器

系统 SHALL 提供一个 GridPanel 组件，作为通用的 panel 容器。

#### Scenario: Panel 内容展示

- **WHEN** 用户在 GridPanel 中放置任意 React 组件
- **THEN** 组件应正确渲染并支持：
  - 显示标题栏（可配置是否显示）
  - 提供操作按钮（删除、复制、锁定）
  - 响应拖拽和缩放事件
  - 保持内容组件的正常功能

### Requirement: 布局持久化

系统 SHALL 支持将布局配置保存到 localStorage。

#### Scenario: 保存布局

- **WHEN** 用户修改 panel 布局
- **THEN** 系统应自动保存布局配置到 localStorage
- **WHEN** 用户刷新页面
- **THEN** 系统应从 localStorage 恢复布局

### Requirement: 布局模板

系统 SHALL 支持多个布局模板。

#### Scenario: 切换模板

- **WHEN** 用户切换布局模板
- **THEN** 系统应应用新的布局配置
- **WHEN** 用户修改当前布局
- **THEN** 系统应更新当前模板的配置

### Requirement: 样式定制

系统 SHALL 支持通过 props 定制样式。

#### Scenario: 样式配置

- **WHEN** 用户设置样式 props
- **THEN** 系统应应用：
  - panel 间距（panelGap）
  - panel 圆角（panelBorderRadius）
  - panel 背景色（panelBackgroundColor）
  - 标题栏样式

### Requirement: 响应式布局

系统 SHALL 支持桌面端和 Web 端的基本响应式。

#### Scenario: 屏幕适配

- **WHEN** 屏幕尺寸变化
- **THEN** 系统应调整 panel 布局以适应屏幕

## MODIFIED Requirements

无

## REMOVED Requirements

无
