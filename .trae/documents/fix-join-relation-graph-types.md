# TypeScript 类型错误修复计划

## 问题概述

`JoinRelationGraph` 组件存在 11 个 TypeScript 类型错误，根本原因是 `@xyflow/react` 库要求节点和边的 `data` 属性必须满足 `Record<string, unknown>` 约束，但自定义的 `TableNodeData` 和 `JoinEdgeData` 接口缺少索引签名。

## 任务拆分

### 任务 1: 修复接口类型定义（基础任务）

**文件**: `useGraphData.ts`

**修改内容**:
- 为 `TableNodeData` 接口添加索引签名 `[key: string]: unknown`
- 为 `JoinEdgeData` 接口添加索引签名 `[key: string]: unknown`

**说明**: 这是基础任务，其他任务依赖此任务的完成。

---

### 任务 2: 修复 JoinEdge 组件类型转换

**文件**: `JoinEdge.tsx`

**修改内容**:
- 将 `EdgeProps` 改为 `EdgeProps<JoinEdgeData>` 泛型形式
- 移除不安全的 `as JoinEdgeData` 类型断言

**依赖**: 依赖任务 1 完成

---

### 任务 3: 修复 JoinRelationGraph 组件泛型传递

**文件**: `JoinRelationGraph.tsx`

**修改内容**:
- 为 `nodeTypes` 添加正确的泛型类型 `NodeTypes<TableNodeData>`
- 为 `edgeTypes` 添加正确的泛型类型 `EdgeTypes<JoinEdgeData>`
- 为 `ReactFlow` 组件添加泛型参数 `<FlowNode, FlowEdge>`

**依赖**: 依赖任务 1 完成

---

### 任务 4: 验证修复结果

**操作**:
- 运行 TypeScript 类型检查命令
- 确认所有错误已修复

**依赖**: 依赖任务 2 和任务 3 完成

---

## 任务依赖关系图

```
任务 1 (修复接口类型)
    │
    ├──► 任务 2 (修复 JoinEdge) ──┐
    │                            │
    └──► 任务 3 (修复 JoinRelationGraph) ──┼──► 任务 4 (验证)
```

## 并行执行策略

- **阶段 1**: 执行任务 1（单独执行，其他任务依赖它）
- **阶段 2**: 并行执行任务 2 和任务 3（两者无相互依赖）
- **阶段 3**: 执行任务 4（验证所有修复）

## 预期结果

所有 11 个 TypeScript 类型错误将被修复，代码将通过类型检查。
