# 修复拖拽panel时的问题

## 问题描述
1. 拖拽panel进行缩放或移动时，会导致选中页面的文字，观感不好
2. 拖拽panel超出容器显示区域时，ScrollArea不会自动滚动跟随

## 解决方案

### 1. 修复文本选中问题
在 `GridContainer` 组件中添加防止文本选中的功能：
- 拖拽/缩放开始时设置 `document.body.style.userSelect = 'none'`
- 拖拽/缩放结束时恢复 `userSelect` 属性
- 在容器div上添加 `userSelect: "none"` 样式

### 2. 修复ScrollArea自动滚动问题
需要修改两个文件：

#### 2.1 修改 ScrollArea 组件
**文件**: `packages/ui-react/src/components/common/ScrollArea/ScrollArea.tsx`
- 在 `BaseScrollArea.Viewport` 元素上添加 `data-scroll-area-viewport` 属性
- 这样GridContainer就能找到并控制ScrollArea的滚动

#### 2.2 修改 GridContainer 组件
**文件**: `packages/ui-react/src/components/gridContainer/gridContainter.tsx`
- 添加 `scrollViewportRef` 和 `scrollIntervalRef` 引用
- 添加 `useEffect` 来查找父级ScrollArea的Viewport元素（通过 `data-scroll-area-viewport` 属性）
- 实现 `startAutoScroll()` 函数：启动自动滚动定时器
- 实现 `stopAutoScroll()` 函数：停止自动滚动定时器
- 实现 `autoScrollIfNeeded()` 函数：
  - 检测ScrollArea是否接近底部
  - 当距离底部50px以内时，自动向下滚动
  - 每次滚动10px
- 在拖拽/缩放开始时调用 `startAutoScroll()`
- 在拖拽/缩放结束时调用 `stopAutoScroll()`
- 在 `Responsive` 组件上添加 `onDrag` 和 `onResize` 事件处理器，在拖拽过程中调用 `autoScrollIfNeeded()`

## 实施步骤

1. 修改 `packages/ui-react/src/components/common/ScrollArea/ScrollArea.tsx`
   - 给 `BaseScrollArea.Viewport` 添加 `data-scroll-area-viewport` 属性

2. 修改 `packages/ui-react/src/components/gridContainer/gridContainter.tsx`
   - 添加必要的ref引用
   - 添加useEffect来查找ScrollArea的Viewport
   - 实现自动滚动相关函数
   - 在事件处理器中集成自动滚动功能

## 预期效果
- 拖拽panel时不会选中页面文字
- 拖拽panel超出可视区域时，ScrollArea会自动向下滚动跟随
- 滚动平滑，用户体验良好
