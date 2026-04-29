# 数据集模块文档

## 1. 模块目标

数据集模块负责把来自数据源模块的物理表结构，进一步整理成适合分析与可视化使用的语义层资产。

这是 Seedar 从“连接数据库”走向“可分析平台”的关键一步。

## 2. 本模块为什么重要

如果没有数据集层，系统只能停留在“原始表 + SQL 查询”的阶段；而有了数据集层之后，系统才能进一步支持：

- 字段业务名
- 主键约束
- 多表 Join
- 指标定义
- DSL 查询
- 图表推荐与 AI 上下文理解

因此，数据集模块是整个系统的“语义建模中心”。

## 3. 文档列表

- [overview.md](./overview.md)
- [editor-flow.md](./editor-flow.md)
- [frontend-backend-map.md](./frontend-backend-map.md)
- [maintenance.md](./maintenance.md)

## 4. 适合谁阅读

这组文档适合：

- 需要接手建模功能的前后端开发者
- 需要在论文中写“语义建模模块设计”的作者
- 需要定位数据集字段、Join、指标问题的维护者

## 5. 推荐阅读顺序

1. `overview.md`
2. `editor-flow.md`
3. `frontend-backend-map.md`
4. `maintenance.md`

## 6. 关键代码入口

- [DatasetPage.tsx](/D:/Program/projects/seedar/apps/web-client/src/modules/dataset/pages/datasetPage.tsx)
- [DatasetEditorPage.tsx](/D:/Program/projects/seedar/apps/web-client/src/modules/dataset/components/DatasetEditor/DatasetEditorPage.tsx)
- [useDataset.ts](/D:/Program/projects/seedar/packages/ui-react/src/hooks/api/useDataset.ts)
- [dataset.controller.ts](/D:/Program/projects/seedar/apps/server/src/module/dataset/dataset.controller.ts)
- [dataset.service.ts](/D:/Program/projects/seedar/apps/server/src/module/dataset/services/dataset.service.ts)

## 7. 阅读时建议关注

1. 为什么要强制校验主键进入数据集。
2. 为什么 Join 不只是前端配置，还要在后端再次校验。
3. 指标定义为什么要落到独立表结构中。
4. 为什么删除数据集前要检查 Query 依赖。
