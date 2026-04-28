# 模块文档索引

本目录是 `docs/v2/dev-docs/` 的第二层拆分，用于把项目级总览继续拆成模块级文档。

## 目录说明

| 目录 | 说明 |
| --- | --- |
| [datasource](./datasource/README.md) | 数据源接入、连接校验、元数据抓取与缓存 |
| [dataset](./dataset/README.md) | 数据集建模、字段/Join/指标管理 |
| [query](./query/README.md) | 查询 DSL、SQL 生成与执行 |
| [dashboard](./dashboard/README.md) | 面板与仪表盘资产、布局与展示 |
| [ai](./ai/README.md) | AI 对话、SSE、workflow interrupt、工具与技能 |
| [cli](./cli/README.md) | 安装、升级、运行时目录、诊断与部署入口 |
| [shared-packages](./shared-packages/README.md) | `types / ui-core / ui-react / metric_engine` 的职责分层 |

## 建议用法

- 想理解全局关系：先读项目级 [README.md](../README.md) 和 [seedar-overview.md](../seedar-overview.md)
- 想直接改某个领域：进入对应模块目录阅读
- 想知道跨模块调用：优先看各目录下的 `frontend-backend-map.md` 或 `integration.md`
