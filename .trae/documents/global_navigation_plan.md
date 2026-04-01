# 全局导航栏 - 实施计划

## 概述
基于经典暖棕主题，创建顶部全局导航栏，提供跨模块导航功能，同时保留现有 Dashboard 和 Panel 的功能侧边栏。

---

## [x] 任务 1: 创建 GlobalNavigation 组件目录结构
- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 在 `src/core/components/` 下创建 `GlobalNavigation` 目录
  - 按 react-ts-component-design 规范创建基础文件结构
- **Success Criteria**:
  - 目录结构符合规范要求
  - 包含必需的基础文件
- **Test Requirements**:
  - `programmatic` TR-1.1: 目录结构存在且包含 index.ts、GlobalNavigation.tsx、GlobalNavigation.module.scss、types.ts
  - `human-judgement` TR-1.2: 目录结构符合 react-ts-component-design 规范
- **Notes**: 参考现有 UI 组件的目录结构

---

## [x] 任务 2: 定义 GlobalNavigation 组件类型
- **Priority**: P0
- **Depends On**: Task 1
- **Description**:
  - 在 `types.ts` 中定义导航项类型
  - 定义组件 Props 类型
- **Success Criteria**:
  - 所有类型定义完整
  - 无 any 类型
- **Test Requirements**:
  - `programmatic` TR-2.1: types.ts 文件存在且包含完整类型定义
  - `programmatic` TR-2.2: TypeScript 编译无类型错误
  - `human-judgement` TR-2.3: 类型定义清晰、语义明确

---

## [x] 任务 3: 实现 GlobalNavigation 主组件
- **Priority**: P0
- **Depends On**: Task 2
- **Description**:
  - 创建导航项配置（Dashboard、Panel、Dataset、Datasource）
  - 使用 react-router-dom 的 NavLink 实现路由导航
  - 使用 lucide-react 图标
  - 应用经典暖棕主题变量
- **Success Criteria**:
  - 组件能正常渲染
  - 导航项正确显示
  - 激活状态正确
- **Test Requirements**:
  - `programmatic` TR-3.1: 组件能正常编译和渲染
  - `programmatic` TR-3.2: 点击导航项能正确跳转路由
  - `programmatic` TR-3.3: 当前路由对应的导航项显示激活状态
  - `human-judgement` TR-3.4: 视觉风格符合经典暖棕主题
  - `human-judgement` TR-3.5: 符合 Impeccable 设计规范（无 AI 同质化）

---

## [x] 任务 4: 编写 GlobalNavigation 样式
- **Priority**: P0
- **Depends On**: Task 3
- **Description**:
  - 使用 global.variable.scss 中的主题变量
  - 实现导航栏的悬停、激活状态样式
  - 应用过渡动画
- **Success Criteria**:
  - 样式完全使用主题变量
  - 视觉效果符合设计要求
- **Test Requirements**:
  - `programmatic` TR-4.1: 样式文件正确导入主题变量
  - `programmatic` TR-4.2: 所有颜色使用 CSS 变量而非硬编码
  - `human-judgement` TR-4.3: 悬停和激活状态视觉反馈清晰
  - `human-judgement` TR-4.4: 过渡动画自然流畅

---

## [x] 任务 5: 改造 AppLayout 集成 GlobalNavigation
- **Priority**: P0
- **Depends On**: Task 4
- **Description**:
  - 修改 AppLayout.tsx，移除现有简单 header
  - 集成 GlobalNavigation 组件
  - 调整 main 区域的 padding
- **Success Criteria**:
  - GlobalNavigation 正确显示在顶部
  - 布局不破坏现有页面
- **Test Requirements**:
  - `programmatic` TR-5.1: AppLayout 能正常编译
  - `programmatic` TR-5.2: 所有页面能正常显示（Dashboard、Panel、Dataset、Datasource）
  - `human-judgement` TR-5.3: 现有功能侧边栏不受影响
  - `human-judgement` TR-5.4: 整体布局协调统一

---

## [x] 任务 6: 运行类型检查和 Lint 检查
- **Priority**: P0
- **Depends On**: Task 5
- **Description**:
  - 运行 TypeScript 类型检查
  - 运行 Lint 检查
  - 修复所有错误和警告
- **Success Criteria**:
  - 无 TypeScript 错误
  - 无 Lint 错误
- **Test Requirements**:
  - `programmatic` TR-6.1: tsc --noEmit 返回 0 退出码
  - `programmatic` TR-6.2: 项目配置的 lint 命令通过
  - `human-judgement` TR-6.3: 代码风格统一规范

---

## [x] 任务 7: 手动测试所有页面
- **Priority**: P1
- **Depends On**: Task 6
- **Description**:
  - 启动开发服务器
  - 测试所有页面的导航功能
  - 验证各页面布局正常
- **Success Criteria**:
  - 所有页面能正常访问
  - 导航功能正常工作
  - 布局无异常
- **Test Requirements**:
  - `programmatic` TR-7.1: 开发服务器能正常启动
  - `programmatic` TR-7.2: 所有路由能正常跳转
  - `human-judgement` TR-7.3: 各页面布局完整，无元素重叠
  - `human-judgement` TR-7.4: 导航栏在所有页面显示一致
