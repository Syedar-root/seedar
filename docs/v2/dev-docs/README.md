# Seedar 开发与论文素材文档

本目录用于沉淀 Seedar 项目的项目级开发文档、模块级设计文档，以及可直接复用于毕业论文写作的分析材料。

这套文档的目标不是简单介绍目录结构，而是尽量回答以下问题：

1. 项目要解决什么业务问题。
2. 系统的整体架构如何分层。
3. 前端、后端、CLI 与共享包分别承担什么职责。
4. 核心数据模型、查询引擎、AI workflow 和部署流程如何设计。
5. 如果把这个项目写成毕业论文，应如何组织“需求分析、系统设计、数据库设计、关键实现、部署运维”这些章节。

## 一、项目级总文档

以下文档属于第一层总文档，适合先建立全局认知，也最适合作为论文主干材料来源。

| 文档 | 作用 | 适合论文章节 |
| --- | --- | --- |
| [seedar-overview.md](./seedar-overview.md) | 项目定位、monorepo 结构、模块职责、推荐阅读路径 | 研究背景、系统概述 |
| [seedar-system-architecture.md](./seedar-system-architecture.md) | 系统总体架构、分层设计、运行时拓扑与关键调用链 | 系统总体设计 |
| [seedar-business-flow.md](./seedar-business-flow.md) | 从业务切片出发解释主业务闭环 | 需求分析、业务流程设计 |
| [seedar-frontend-backend-map.md](./seedar-frontend-backend-map.md) | 页面、状态、交互、接口、后端模块映射 | 功能设计、模块设计 |
| [seedar-api.md](./seedar-api.md) | 核心接口分组、请求响应、调用约束 | 接口设计 |
| [seedar-data-model.md](./seedar-data-model.md) | 核心实体、DTO、共享类型关系 | 概念结构设计、数据模型设计 |
| [seedar-database-design.md](./seedar-database-design.md) | 基于迁移和实体反推数据库结构、主外键与生命周期 | 数据库设计 |
| [seedar-query-and-metric-engine.md](./seedar-query-and-metric-engine.md) | Query DSL、动态 Join、SQL 生成、指标表达式体系 | 核心算法与关键实现 |
| [seedar-ai-and-workflow-design.md](./seedar-ai-and-workflow-design.md) | AI 会话、SSE、工具调用、workflow interrupt 设计 | 智能模块设计、特色功能实现 |
| [seedar-technical-selection.md](./seedar-technical-selection.md) | 技术栈与选型依据、优缺点与适用性 | 技术路线、方案论证 |
| [seedar-deployment-and-release.md](./seedar-deployment-and-release.md) | CLI、Docker、生产部署、发布流程 | 系统部署与运维设计 |
| [seedar-quick-start.md](./seedar-quick-start.md) | 本地运行、调试、验证和基础部署入口 | 开发环境与运行说明 |
| [seedar-faq.md](./seedar-faq.md) | 常见问题与排障建议 | 实施问题分析、附录 |
| [seedar-prd-reverse.md](./seedar-prd-reverse.md) | 从实现反推产品目标、角色和范围 | 需求分析、产品目标 |
| [seedar-thesis-material-map.md](./seedar-thesis-material-map.md) | 把现有文档映射到毕业论文章节 | 论文写作规划 |

## 二、模块级拆分文档

以下目录属于第二层文档，适合在明确全局设计后按领域深入阅读：

| 目录 | 说明 |
| --- | --- |
| [modules/datasource](./modules/datasource/README.md) | 数据源接入、元数据抓取、连接与加密 |
| [modules/dataset](./modules/dataset/README.md) | 语义建模、字段/Join/指标配置 |
| [modules/query](./modules/query/README.md) | DSL、执行链路、引擎接入 |
| [modules/dashboard](./modules/dashboard/README.md) | 面板与仪表盘资产管理 |
| [modules/ai](./modules/ai/README.md) | AI 对话、workflow、工具体系 |
| [modules/cli](./modules/cli/README.md) | 安装、升级、运行时目录与诊断 |
| [modules/shared-packages](./modules/shared-packages/README.md) | 共享类型、前端基础层与指标引擎 |

## 三、建议阅读顺序

### 1. 只想快速理解项目

1. [seedar-overview.md](./seedar-overview.md)
2. [seedar-system-architecture.md](./seedar-system-architecture.md)
3. [seedar-business-flow.md](./seedar-business-flow.md)

### 2. 需要接手开发

1. [seedar-overview.md](./seedar-overview.md)
2. [seedar-frontend-backend-map.md](./seedar-frontend-backend-map.md)
3. [seedar-data-model.md](./seedar-data-model.md)
4. 进入对应 `modules/*`

### 3. 需要写毕业论文

推荐按以下顺序阅读并摘录：

1. [seedar-prd-reverse.md](./seedar-prd-reverse.md)
2. [seedar-system-architecture.md](./seedar-system-architecture.md)
3. [seedar-business-flow.md](./seedar-business-flow.md)
4. [seedar-database-design.md](./seedar-database-design.md)
5. [seedar-query-and-metric-engine.md](./seedar-query-and-metric-engine.md)
6. [seedar-ai-and-workflow-design.md](./seedar-ai-and-workflow-design.md)
7. [seedar-technical-selection.md](./seedar-technical-selection.md)
8. [seedar-deployment-and-release.md](./seedar-deployment-and-release.md)
9. [seedar-thesis-material-map.md](./seedar-thesis-material-map.md)

## 四、本次文档覆盖的代码范围

本套文档主要基于以下代码与配置反推生成：

- `apps/web-client`
- `apps/server`
- `apps/cli`
- `packages/types`
- `packages/ui-core`
- `packages/ui-react`
- `packages/metric_engine`
- `deploy`
- `docs/` 中已有部署与发布文档

## 五、适合作为论文素材的内容类型

这套文档特别适合为以下论文内容提供素材：

- 课题背景与问题定义
- 系统总体架构图
- 功能模块划分
- 业务流程图
- E-R 图与数据库设计
- 核心类图与模块职责说明
- 查询引擎与 DSL 设计
- AI 智能辅助模块设计
- 系统部署结构与发布机制
- 技术栈选型分析

## 六、未产出的候选文档

本次依然没有单独产出：

- `seedar-doc-update-report.md`

原因：

- 当前目标是持续建设新的 `v2/dev-docs` 文档体系，而不是对旧同名文档做增量同步说明。
