# 数据源模块文档

## 模块目标

数据源模块负责把外部数据库接入 Seedar，并把原始库结构转成后续可建模的元数据资产。

## 你会在这里找到什么

- [overview.md](./overview.md)
- [business-flow.md](./business-flow.md)
- [frontend-backend-map.md](./frontend-backend-map.md)
- [maintenance.md](./maintenance.md)

## 最小阅读顺序

1. `overview.md`
2. `business-flow.md`
3. `frontend-backend-map.md`

## 关键代码入口

- [DatasourcePage.tsx](/D:/Program/projects/seedar/apps/web-client/src/modules/datasource/pages/datasourcePage.tsx)
- [datasource.ts](/D:/Program/projects/seedar/packages/ui-core/src/api/datasource.ts)
- [datasource.controller.ts](/D:/Program/projects/seedar/apps/server/src/module/datasource/datasource.controller.ts)
- [datasource.service.ts](/D:/Program/projects/seedar/apps/server/src/module/datasource/service/datasource.service.ts)
