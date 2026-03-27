# Title 组件文件结构重组计划

## 📋 任务概述

将每个 Title 组件及其 CSS 文件移动到独立的文件夹中，每个文件夹通过 index.ts 导出，提高代码组织性和可维护性。

## 🎯 核心目标

- 每个组件拥有独立的文件夹
- 组件代码、样式和导出在同一文件夹内
- 提高代码组织性和可维护性
- 保持清晰的导入路径

## 📁 目标结构

```
title/
├── PlainTitle/
│   ├── PlainTitle.tsx
│   ├── PlainTitle.module.css
│   └── index.ts
├── FlagTitle/
│   ├── FlagTitle.tsx
│   ├── FlagTitle.module.css
│   └── index.ts
├── EditorialTitle/
│   ├── EditorialTitle.tsx
│   ├── EditorialTitle.module.css
│   └── index.ts
├── BrutalistTitle/
│   ├── BrutalistTitle.tsx
│   ├── BrutalistTitle.module.css
│   └── index.ts
├── Tooltip/
│   ├── Tooltip.module.css
│   └── index.ts
├── hooks/
│   └── useTitleTooltip.tsx
├── types.ts
└── index.ts
```

## 🔧 实施步骤

### 步骤 1：创建 PlainTitle 文件夹并移动文件

1. 创建 `PlainTitle` 文件夹
2. 移动 `components/PlainTitle.tsx` 到 `PlainTitle/PlainTitle.tsx`
3. 移动 `components/PlainTitle.module.css` 到 `PlainTitle/PlainTitle.module.css`
4. 创建 `PlainTitle/index.ts` 导出组件

### 步骤 2：创建 FlagTitle 文件夹并移动文件

1. 创建 `FlagTitle` 文件夹
2. 移动 `components/FlagTitle.tsx` 到 `FlagTitle/FlagTitle.tsx`
3. 移动 `components/FlagTitle.module.css` 到 `FlagTitle/FlagTitle.module.css`
4. 创建 `FlagTitle/index.ts` 导出组件

### 步骤 3：创建 EditorialTitle 文件夹并移动文件

1. 创建 `EditorialTitle` 文件夹
2. 移动 `components/EditorialTitle.tsx` 到 `EditorialTitle/EditorialTitle.tsx`
3. 移动 `components/EditorialTitle.module.css` 到 `EditorialTitle/EditorialTitle.module.css`
4. 创建 `EditorialTitle/index.ts` 导出组件

### 步骤 4：创建 BrutalistTitle 文件夹并移动文件

1. 创建 `BrutalistTitle` 文件夹
2. 移动 `components/BrutalistTitle.tsx` 到 `BrutalistTitle/BrutalistTitle.tsx`
3. 移动 `components/BrutalistTitle.module.css` 到 `BrutalistTitle/BrutalistTitle.module.css`
4. 创建 `BrutalistTitle/index.ts` 导出组件

### 步骤 5：创建 Tooltip 文件夹并移动文件

1. 创建 `Tooltip` 文件夹
2. 移动 `components/Tooltip.module.css` 到 `Tooltip/Tooltip.module.css`
3. 创建 `Tooltip/index.ts` 导出样式

### 步骤 6：更新主 index.ts

更新 `title/index.ts`，从新的文件夹结构中导出所有组件

### 步骤 7：删除空的 components 文件夹

如果所有文件都已移动，删除空的 `components` 文件夹

## ✅ 验收标准

### 功能完整性
- ✅ 所有组件都在独立的文件夹中
- ✅ 每个文件夹包含组件代码、样式和导出文件
- ✅ 主 index.ts 正确导出所有组件
- ✅ 导入路径清晰且一致

### 代码质量
- ✅ 文件结构清晰，易于导航
- ✅ 导出路径简洁
- ✅ 无循环依赖
- ✅ TypeScript 类型正确

### 可维护性
- ✅ 修改组件时只需打开对应文件夹
- ✅ 新增组件时可以参考现有结构
- ✅ 导入路径统一规范
