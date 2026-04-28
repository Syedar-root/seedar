# 共享包文档

## 1. 模块目标

本目录用于解释四个共享包的职责分工：

- `@seedar/types`
- `@seedar/ui-core`
- `@seedar/ui-react`
- `@metric-engine/core`

它们共同决定了 Seedar 的“平台化程度”。

## 2. 为什么这一层值得单独写

很多项目把共享代码写成杂糅的 `utils` 目录，但 Seedar 已经把共享层拆成了清晰包结构。这一点非常适合在论文里体现“系统具备分层与复用设计能力”。

## 3. 文档列表

- [overview.md](./overview.md)
- [frontend-stack.md](./frontend-stack.md)
- [metric-engine.md](./metric-engine.md)

## 4. 适合谁阅读

- 需要做跨模块重构的开发者
- 需要修改类型契约的前后端开发者
- 需要写“共享基础层设计”的论文作者

## 5. 关键代码入口

- [packages/types/package.json](/D:/Program/projects/seedar/packages/types/package.json)
- [packages/ui-core/package.json](/D:/Program/projects/seedar/packages/ui-core/package.json)
- [packages/ui-react/package.json](/D:/Program/projects/seedar/packages/ui-react/package.json)
- [packages/metric_engine/src/index.ts](/D:/Program/projects/seedar/packages/metric_engine/src/index.ts)
