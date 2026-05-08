# 查询模块文档

## 1. 模块目标

查询模块负责把数据集语义结构转成可执行查询，并把结果返回给面板和仪表盘。

它是整个系统里最接近“分析引擎”的模块，也是最适合在论文中突出技术实现亮点的部分。

## 2. 本模块为什么重要

没有查询模块，系统就只能：

- 接入数据
- 建立数据集
- 配置图表

但无法真正把用户意图转换为查询结果。

因此这个模块连接了：

- `dataset` 语义层
- `metric_engine` 执行层
- 外部数据源
- `panel` / `dashboard` 展示层

## 3. 文档列表

- [overview.md](./overview.md)
- [execution-flow.md](./execution-flow.md)
- [dsl-and-sql.md](./dsl-and-sql.md)
- [maintenance.md](./maintenance.md)

## 4. 适合谁阅读

这组文档适合：

- 需要改 DSL、SQL 或指标逻辑的后端开发者
- 需要理解“为什么前端不写 SQL”的读者
- 需要在论文里写“核心算法设计”的作者

## 5. 推荐阅读顺序

1. `overview.md`
2. `execution-flow.md`
3. `dsl-and-sql.md`
4. `maintenance.md`

## 6. 关键代码入口

- [useQuery.ts](/D:/Program/projects/seedar/packages/ui-react/src/hooks/api/useQuery.ts)
- [query.controller.ts](/D:/Program/projects/seedar/apps/server/src/module/query/query.controller.ts)
- [query.service.ts](/D:/Program/projects/seedar/apps/server/src/module/query/query.service.ts)
- `dsl-transformer.v2.ts`
- [packages/metric_engine/src/index.ts](/D:/Program/projects/seedar/packages/metric_engine/src/index.ts)

## 7. 阅读时建议关注

1. 为什么 DSL 中不再让前端显式传 joins。
2. 动态 Join 计算是如何做的。
3. 指标体系为什么要独立于 Query 本身存在。
4. 为什么结果里除了 rows 还要返回 SQL 与 columnMappings。
