# React-Flow 表关系可视化实施计划

## 项目概述

将 `datasetDetailPage.tsx` 中的 `JoinRelationList` 组件替换为基于 React-Flow 的可视化图表，展示数据集中表之间的关联关系。

## 任务拆分与依赖关系

```
阶段 1: 基础准备 (可并行)
├── Task 1.1: 补充类型定义
├── Task 1.2: 安装布局依赖
└── Task 1.3: 创建组件目录结构

阶段 2: 核心实现 (依赖阶段1)
├── Task 2.1: 数据转换 Hook (依赖 1.1)
├── Task 2.2: 自定义节点组件 (依赖 1.3)
├── Task 2.3: 自定义边组件 (依赖 1.3)
└── Task 2.4: 布局计算工具 (依赖 1.2)

阶段 3: 集成与样式 (依赖阶段2)
├── Task 3.1: 主组件实现 (依赖 2.1, 2.2, 2.3, 2.4)
├── Task 3.2: 样式文件 (依赖 1.3)
└── Task 3.3: 页面集成 (依赖 3.1, 3.2)

阶段 4: 验证与清理 (依赖阶段3)
├── Task 4.1: 类型检查与构建验证
└── Task 4.2: 清理旧组件
```

---

## 详细任务说明

### 阶段 1: 基础准备

#### Task 1.1: 补充类型定义
**文件**: `packages/types/src/dataset/dataset.types.ts`

**修改内容**:
```typescript
export interface DatasetJoinResponse {
  id: number;
  leftTableId: number;      // 新增
  rightTableId: number;
  leftField: string;
  rightField: string;
  joinType: JoinType;
  operator?: string;        // 新增
}
```

**依赖**: 无
**并行**: 可与 1.2、1.3 并行

---

#### Task 1.2: 安装布局依赖
**命令**: 
```bash
cd apps/web-client && pnpm add dagre && pnpm add -D @types/dagre
```

**依赖**: 无
**并行**: 可与 1.1、1.3 并行

---

#### Task 1.3: 创建组件目录结构
**创建文件**:
```
apps/web-client/src/modules/dataset/components/JoinRelationGraph/
├── index.ts
├── JoinRelationGraph.tsx
├── TableNode.tsx
├── JoinEdge.tsx
├── useGraphData.ts
├── graphLayout.ts
└── JoinRelationGraph.module.scss
```

**依赖**: 无
**并行**: 可与 1.1、1.2 并行

---

### 阶段 2: 核心实现

#### Task 2.1: 数据转换 Hook
**文件**: `useGraphData.ts`

**功能**:
- 输入: `joins`, `tables`, `fields`, `mainTableId`
- 输出: `{ nodes, edges }`
- 逻辑:
  1. 将 tables 转换为 Node[]
  2. 通过 leftField/rightField 匹配 fields.datasourceColumnId 获取字段名
  3. 将 joins 转换为 Edge[]
  4. 标记主表节点

**依赖**: Task 1.1 (类型定义)
**并行**: 可与 2.2、2.3、2.4 并行

---

#### Task 2.2: 自定义节点组件
**文件**: `TableNode.tsx`

**功能**:
- 显示表名
- 主表特殊样式 (金色边框 + 徽章)
- Hover 高亮效果

**依赖**: Task 1.3 (目录结构)
**并行**: 可与 2.1、2.3、2.4 并行

---

#### Task 2.3: 自定义边组件
**文件**: `JoinEdge.tsx`

**功能**:
- 显示 Join 类型标签
- 显示连接字段信息
- 根据 joinType 设置不同颜色:
  - INNER: 蓝色实线
  - LEFT: 绿色虚线
  - RIGHT: 橙色点线

**依赖**: Task 1.3 (目录结构)
**并行**: 可与 2.1、2.2、2.4 并行

---

#### Task 2.4: 布局计算工具
**文件**: `graphLayout.ts`

**功能**:
- 使用 dagre 进行层次布局
- 主表放在左侧
- 返回带位置的节点数据

**依赖**: Task 1.2 (dagre 安装)
**并行**: 可与 2.1、2.2、2.3 并行

---

### 阶段 3: 集成与样式

#### Task 3.1: 主组件实现
**文件**: `JoinRelationGraph.tsx`

**功能**:
- 初始化 ReactFlow Provider
- 调用 useGraphData 获取数据
- 注册自定义节点和边
- 实现交互:
  - 节点 Hover 高亮
  - 边 Hover 高亮
  - Fit View 按钮
- 设置默认视口

**依赖**: Task 2.1, 2.2, 2.3, 2.4
**并行**: 无

---

#### Task 3.2: 样式文件
**文件**: `JoinRelationGraph.module.scss`

**内容**:
- 容器样式
- 节点样式 (普通表/主表)
- 边标签样式
- 交互状态样式

**依赖**: Task 1.3 (目录结构)
**并行**: 可与 3.1 并行

---

#### Task 3.3: 页面集成
**文件**: 
- `datasetDetailPage.tsx` - 替换 JoinRelationList
- `components/index.ts` - 更新导出

**修改**:
1. 导入 JoinRelationGraph 替代 JoinRelationList
2. 传递所需 props
3. 调整容器样式

**依赖**: Task 3.1, 3.2
**并行**: 无

---

### 阶段 4: 验证与清理

#### Task 4.1: 类型检查与构建验证
**命令**:
```bash
cd apps/web-client && pnpm run build
```

**验证项**:
- TypeScript 类型检查通过
- Vite 构建成功
- 无运行时错误

**依赖**: Task 3.3
**并行**: 无

---

#### Task 4.2: 清理旧组件
**删除文件**:
```
apps/web-client/src/modules/dataset/components/JoinRelationList/
├── index.ts
├── JoinRelationList.tsx
└── JoinRelationList.module.scss
```

**更新**: `components/index.ts` 移除导出

**依赖**: Task 4.1
**并行**: 无

---

## 并行执行策略

### 第一批并行 (阶段1)
- SubAgent A: Task 1.1 类型定义
- SubAgent B: Task 1.2 安装依赖
- SubAgent C: Task 1.3 目录结构

### 第二批并行 (阶段2)
- SubAgent A: Task 2.1 数据转换 Hook
- SubAgent B: Task 2.2 自定义节点
- SubAgent C: Task 2.3 自定义边
- SubAgent D: Task 2.4 布局工具

### 第三批并行 (阶段3部分)
- SubAgent A: Task 3.1 主组件
- SubAgent B: Task 3.2 样式文件

### 串行执行 (阶段3-4)
- Task 3.3 页面集成
- Task 4.1 验证
- Task 4.2 清理

---

## 风险与注意事项

1. **字段名匹配**: leftField/rightField 是字符串形式的 ID，需要转换为数字后匹配
2. **主表判断**: 使用 `table.id === mainTableId` 而非 `datasourceTableId`
3. **布局方向**: dagre 默认从上到下，建议改为从左到右 (LR) 以符合 ER 图习惯
4. **响应式**: 需要处理容器尺寸变化，可能需要 ResizeObserver
