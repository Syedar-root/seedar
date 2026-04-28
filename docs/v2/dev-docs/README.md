# Seedar 开发文档

本目录用于承载 Seedar 项目的 `v2` 开发文档，面向以下读者：

- 新接手项目的开发者
- 需要进行前后端联调的同学
- 需要定位业务边界、接口契约、数据模型和部署方式的维护者

## 文档清单

| 文档 | 作用 | 是否默认必产物 |
| --- | --- | --- |
| [seedar-overview.md](./seedar-overview.md) | 项目总览、仓库结构、模块职责、推荐阅读路线 | 是 |
| [seedar-business-flow.md](./seedar-business-flow.md) | 从业务切片出发，解释系统如何运转 | 是 |
| [seedar-frontend-backend-map.md](./seedar-frontend-backend-map.md) | 把页面、状态、交互、API、后端模块串起来 | 是 |
| [seedar-api.md](./seedar-api.md) | 汇总核心接口、调用方、返回形态和注意事项 | 否，按场景追加 |
| [seedar-data-model.md](./seedar-data-model.md) | 梳理实体、DTO、共享类型和关键关系 | 否，按场景追加 |
| [seedar-quick-start.md](./seedar-quick-start.md) | 本地启动、调试、验证和部署入口 | 否，按场景追加 |
| [seedar-faq.md](./seedar-faq.md) | 常见问题、限制和排查建议 | 否，按场景追加 |
| [seedar-prd-reverse.md](./seedar-prd-reverse.md) | 从实现反推产品目标、角色和边界 | 否，按场景追加 |

## 建议阅读顺序

1. 先读 [seedar-overview.md](./seedar-overview.md)，建立对 monorepo、应用入口和共享包的整体认知。
2. 再读 [seedar-business-flow.md](./seedar-business-flow.md)，理解“数据源 -> 数据集 -> 查询 -> 面板 -> 仪表盘 -> AI 辅助”的业务闭环。
3. 如果需要改页面或联调接口，重点阅读 [seedar-frontend-backend-map.md](./seedar-frontend-backend-map.md) 和 [seedar-api.md](./seedar-api.md)。
4. 如果需要改实体、DSL、SQL 生成或共享协议，补读 [seedar-data-model.md](./seedar-data-model.md)。
5. 如果需要本地跑起来、部署或排障，补读 [seedar-quick-start.md](./seedar-quick-start.md) 和 [seedar-faq.md](./seedar-faq.md)。

## 本次文档产出范围

本次文档基于以下代码范围反推生成：

- `apps/web-client`
- `apps/server`
- `apps/cli`
- `packages/types`
- `packages/ui-core`
- `packages/ui-react`
- `packages/metric_engine`
- `deploy`

未单独产出的候选文档：

- `seedar-doc-update-report.md`

未产出原因：

- 本次是新建 `docs/v2/dev-docs/` 项目级文档，不是对既有同名文档的增量同步。
