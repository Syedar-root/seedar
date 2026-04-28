# 查询模块文档

## 模块目标

查询模块负责把数据集语义结构转成可执行查询，并把结果返回给面板和仪表盘。

## 文档列表

- [overview.md](./overview.md)
- [execution-flow.md](./execution-flow.md)
- [dsl-and-sql.md](./dsl-and-sql.md)
- [maintenance.md](./maintenance.md)

## 关键代码入口

- [useQuery.ts](/D:/Program/projects/seedar/packages/ui-react/src/hooks/api/useQuery.ts)
- [query.controller.ts](/D:/Program/projects/seedar/apps/server/src/module/query/query.controller.ts)
- [query.service.ts](/D:/Program/projects/seedar/apps/server/src/module/query/query.service.ts)
- `dsl-transformer.v2.ts`
- [packages/metric_engine/src/index.ts](/D:/Program/projects/seedar/packages/metric_engine/src/index.ts)
