# GridContainer 极简重构计划

## 当前设计分析

### 复杂度问题
1. **过度依赖**：依赖 react-grid-layout 库，引入了大量不必要的复杂性
2. **参数过多**：GridContainerProps 有 20+ 个属性，GridPanelProps 有 15+ 个属性
3. **功能冗余**：
   - 模板系统（templates, currentTemplate）
   - localStorage 持久化
   - 复杂的布局验证和清理
   - GridPanel 的删除、复制、锁定功能
4. **代码量大**：总计约 666 行代码（包括组件、工具类、样式、类型定义）

### 核心功能保留
- 网格布局容器
- 可拖拽、可调整大小的面板
- 响应式布局支持

## 极简设计方案

### 设计原则
1. **最小化依赖**：移除 react-grid-layout，使用原生 CSS Grid + 简单的拖拽库
2. **简化 API**：只保留必要的 props，提供合理的默认值
3. **移除冗余功能**：删除模板系统、持久化、复杂的布局管理
4. **保持灵活性**：通过 CSS 变量和插槽机制提供扩展性

### 新的组件结构

```
gridContainer/
├── SimpleGrid.tsx          # 主容器组件（极简版）
├── GridItem.tsx            # 网格项组件（极简版）
├── index.ts                # 导出
└── types.ts                # 简化的类型定义
```

### API 设计

#### SimpleGrid 组件
```typescript
interface SimpleGridProps {
  children: ReactNode;
  cols?: number;              // 列数，默认 12
  gap?: number;               // 间距，默认 16
  onLayoutChange?: (items: GridItemData[]) => void;  // 布局变化回调
  draggable?: boolean;        // 是否可拖拽，默认 true
  resizable?: boolean;       // 是否可调整大小，默认 true
  className?: string;
  style?: React.CSSProperties;
}
```

#### GridItem 组件
```typescript
interface GridItemProps {
  id: string;
  children: ReactNode;
  col?: number;               // 占据列数，默认 4
  row?: number;               // 占据行数，默认 3
  className?: string;
  style?: React.CSSProperties;
}
```

### 技术方案

#### 方案一：使用 @hello-pangea/dnd（推荐）
- 轻量级拖拽库
- 纯 React 实现
- 不依赖 DOM 操作
- 包大小约 30KB

#### 方案二：使用 react-draggable + CSS Grid
- 更轻量（约 15KB）
- 需要手动处理拖拽逻辑
- 更灵活但需要更多代码

**推荐使用方案一**，在简洁性和功能之间取得平衡。

### 实现步骤

#### 第一步：删除现有组件
- 删除 `components/GridContainer.tsx`
- 删除 `components/GridPanel.tsx`
- 删除 `utils/layoutManager.ts`
- 删除 `styles/gridContainer.css`
- 删除 `examples/GridContainerExample.tsx`
- 删除 `examples/SimpleGridTest.tsx`

#### 第二步：创建新的类型定义
创建 `types.ts`，定义简化的接口：
- `GridItemData`：网格项数据结构
- `SimpleGridProps`：主容器属性
- `GridItemProps`：网格项属性

#### 第三步：实现 GridItem 组件
创建 `GridItem.tsx`：
- 简单的包装组件
- 接收 col 和 row 属性
- 使用 CSS Grid 的 grid-column 和 grid-row
- 不包含任何操作按钮（删除、复制、锁定）

#### 第四步：实现 SimpleGrid 组件
创建 `SimpleGrid.tsx`：
- 使用 CSS Grid 布局
- 集成 @hello-pangea/dnd 实现拖拽
- 提供布局变化回调
- 支持响应式列数

#### 第五步：更新导出
更新 `index.ts`：
- 导出 SimpleGrid
- 导出 GridItem
- 导出类型

#### 第六步：创建示例
创建 `SimpleGridExample.tsx`：
- 展示基本用法
- 展示拖拽和调整大小功能
- 展示响应式布局

### 代码量预估
- `types.ts`：约 30 行
- `GridItem.tsx`：约 40 行
- `SimpleGrid.tsx`：约 120 行
- `index.ts`：约 5 行
- `SimpleGridExample.tsx`：约 80 行
- **总计**：约 275 行（减少约 60%）

### 依赖变化
**移除依赖**：
- react-grid-layout（约 150KB）

**新增依赖**：
- @hello-pangea/dnd（约 30KB）

**净减少**：约 120KB

### 优势总结
1. **更轻量**：代码量减少 60%，包体积减少约 120KB
2. **更简单**：API 简化，易于理解和使用
3. **更灵活**：基于 CSS Grid，易于自定义样式
4. **更现代**：使用现代 CSS 特性，无需复杂的布局计算
5. **更易维护**：代码结构清晰，职责单一

### 风险评估
1. **功能减少**：移除了模板、持久化等功能，但这些都是非核心功能
2. **学习成本**：需要学习新的 API，但 API 更简单，学习成本更低
3. **兼容性**：不兼容现有代码，需要迁移

### 迁移建议
1. 保留旧组件一段时间（标记为 deprecated）
2. 提供迁移文档
3. 逐步替换现有使用
