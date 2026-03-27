# BrutalistTitle 组件序号修复计划

## 问题分析

### 当前问题
- BrutalistTitle 组件使用 CSS 计数器显示序号
- 由于 CSS Modules 的作用域隔离，每个组件实例都有独立的计数器
- 导致所有组件都显示相同的序号（都是 1）

### 根本原因
- CSS Modules 将类名哈希化，导致计数器无法跨组件共享
- 即使使用 `:global()` 声明，每个组件实例重置计数器也会导致序号重复

## 解决方案

基于 **Impeccable** 技能包的 `harden`（健壮性）和 `normalize`（设计系统）原则，采用 React props 方案：

### 优势
1. **符合生产级标准**：不依赖不稳定的 CSS 特性
2. **更好的可控性**：序号由父组件管理，符合 React 数据流
3. **易于维护**：逻辑清晰，便于测试和调试
4. **解决 CSS Modules 问题**：不再受作用域限制

## 实施步骤

### 步骤 1：修改类型定义
**文件**: `packages/ui-react/src/components/gridContainer/seedar/components/title/types.ts`

- 在 `BrutalistTitleProps` 接口中添加 `number?: number` 属性
- 在 `TitleProps` 接口中添加 `number?: number` 属性

### 步骤 2：修改 BrutalistTitle 组件
**文件**: `packages/ui-react/src/components/gridContainer/seedar/components/title/components/BrutalistTitle/BrutalistTitle.tsx`

- 修改组件接受 `number` 属性
- 将序号直接显示在 `<span>` 元素中，而不是使用 CSS 计数器

### 步骤 3：清理 CSS 文件
**文件**: `packages/ui-react/src/components/gridContainer/seedar/components/title/components/BrutalistTitle/BrutalistTitle.module.css`

- 移除 `counter-increment: brutalist-counter;` 声明
- 移除 `.brutalistNumber::before` 伪元素的 `content: counter(brutalist-counter);` 和 `counter-increment` 声明

### 步骤 4：修改 editableTitle 类型定义
**文件**: `apps/web-client/src/modules/panel/components/editableTitle/types.ts`

- 在 `TitleConfig` 接口中添加 `number?: number` 属性

### 步骤 5：修改 EditableTitle 组件
**文件**: `apps/web-client/src/modules/panel/components/editableTitle/editableTitle.tsx`

- 在 `Title` 组件调用中添加 `number={currentConfig.number}` 属性传递

### 步骤 6：修改 TitleEditorDialog 组件
**文件**: `apps/web-client/src/modules/panel/components/editableTitle/TitleEditorDialog.tsx`

- 添加 `shouldKeepNumber()` 辅助函数，判断是否需要保留序号字段（仅 brutalist 类型）
- 更新 `handleTypeChange()` 逻辑，在切换标题类型时正确处理序号字段
- 在表单中添加序号输入字段，仅当类型为 `brutalist` 时显示
- 在预览区域传递 `number` 属性

## 验证步骤

1. **组件级别验证**
   - 渲染多个 BrutalistTitle 组件，传入不同的 `number` 属性
   - 验证序号正确显示

2. **编辑器级别验证**
   - 打开标题编辑对话框
   - 选择 Brutalist 类型
   - 验证序号输入字段正确显示
   - 输入序号并验证预览效果

3. **集成测试**
   - 在实际面板页面中使用 EditableTitle
   - 配置为 Brutalist 类型并设置序号
   - 验证序号正确显示和保存

## 技能应用

### `harden` 技能 (P2 - 健壮性)
- **原文原句**："补充 AI 生成内容缺失的「生产级能力」（错误处理/国际化/边缘场景适配）"
- **应用**：将不稳定的 CSS 计数器改为可靠的 React props，提升组件健壮性

### `normalize` 技能 (P2 - 设计系统)
- **原文原句**："对齐项目设计规范/Token，解决 AI 生成内容「样式不一致」问题"
- **应用**：统一组件实现方式，避免依赖 CSS Modules 作用域问题

## 预期结果

- BrutalistTitle 组件能够正确显示自定义序号
- 用户可以通过编辑对话框设置序号
- 序号在预览和实际显示中保持一致
- 组件更加健壮和易于维护