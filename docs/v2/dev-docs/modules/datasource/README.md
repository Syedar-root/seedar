# 数据源模块文档

## 1. 模块目标

数据源模块负责把外部数据库接入 Seedar，并把原始库结构转成后续可建模、可查询、可推荐图表的元数据资产。

它是整个系统的数据入口层，也是后续所有建模工作的前提。

## 2. 本模块在系统中的位置

从全局链路上看，它位于：

`外部数据库 -> 数据源模块 -> 数据集模块 -> 查询模块 -> 面板与仪表盘模块`

如果数据源模块失败，后面所有模块都会失去稳定输入。

## 3. 本目录包含什么

- [overview.md](./overview.md)
  说明模块职责、边界、上下游关系与关键设计点
- [business-flow.md](./business-flow.md)
  说明创建、更新、详情读取和删除的数据流
- [frontend-backend-map.md](./frontend-backend-map.md)
  说明页面、API、Controller、Service 的映射关系
- [maintenance.md](./maintenance.md)
  说明高风险点、排查路径与改动提示

## 4. 适合谁阅读

这组文档特别适合：

- 需要新增数据源类型的开发者
- 需要排查元数据抓取问题的后端开发者
- 需要在论文里描述“数据接入模块设计”的写作者

## 5. 推荐阅读顺序

1. 先读 `overview.md`
2. 再读 `business-flow.md`
3. 接着读 `frontend-backend-map.md`
4. 实际改代码前再读 `maintenance.md`

## 6. 关键代码入口

- [DatasourcePage.tsx](/D:/Program/projects/seedar/apps/web-client/src/modules/datasource/pages/datasourcePage.tsx)
- [datasource.ts](/D:/Program/projects/seedar/packages/ui-core/src/api/datasource.ts)
- [datasource.controller.ts](/D:/Program/projects/seedar/apps/server/src/module/datasource/datasource.controller.ts)
- [datasource.service.ts](/D:/Program/projects/seedar/apps/server/src/module/datasource/service/datasource.service.ts)

## 7. 阅读时建议重点关注

1. 数据源配置如何验证。
2. 密码等敏感信息如何加解密。
3. 元数据抓取为何要单独缓存到 Seedar 元数据库。
4. MySQL、PostgreSQL、ClickHouse 在 schema 查询上的差异。
