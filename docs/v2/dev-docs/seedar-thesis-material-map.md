# Seedar 论文素材地图

## 1. 文档目的

本文把 `docs/v2/dev-docs/` 中的内容映射到毕业论文的常见章节结构，方便后续写作时快速取材。

## 2. 推荐论文结构与文档映射

### 第一章：绪论 / 研究背景

可用文档：

- [seedar-prd-reverse.md](./seedar-prd-reverse.md)
- [seedar-overview.md](./seedar-overview.md)

可提取内容：

- 项目面向的问题场景
- 目标用户
- 系统建设目标
- 与传统数据展示系统的差异

### 第二章：需求分析

可用文档：

- [seedar-business-flow.md](./seedar-business-flow.md)
- [seedar-frontend-backend-map.md](./seedar-frontend-backend-map.md)
- [seedar-prd-reverse.md](./seedar-prd-reverse.md)

可提取内容：

- 功能性需求
- 主要业务流程
- 用户核心使用场景
- 关键业务约束

### 第三章：系统总体设计

可用文档：

- [seedar-system-architecture.md](./seedar-system-architecture.md)
- [seedar-overview.md](./seedar-overview.md)
- [seedar-technical-selection.md](./seedar-technical-selection.md)

可提取内容：

- 系统总体架构图
- 分层设计
- 模块划分
- 技术路线

### 第四章：数据库设计

可用文档：

- [seedar-data-model.md](./seedar-data-model.md)
- [seedar-database-design.md](./seedar-database-design.md)

可提取内容：

- E-R 图
- 核心实体说明
- 主外键关系
- 数据生命周期

### 第五章：关键模块实现

可用文档：

- [seedar-query-and-metric-engine.md](./seedar-query-and-metric-engine.md)
- [seedar-ai-and-workflow-design.md](./seedar-ai-and-workflow-design.md)
- [modules/dataset](./modules/dataset/README.md)
- [modules/dashboard](./modules/dashboard/README.md)

可提取内容：

- Query DSL 与 SQL 生成
- 动态 Join 计算
- 指标体系设计
- AI workflow 设计
- 面板与仪表盘实现

### 第六章：系统部署与测试

可用文档：

- [seedar-deployment-and-release.md](./seedar-deployment-and-release.md)
- [seedar-quick-start.md](./seedar-quick-start.md)
- [seedar-faq.md](./seedar-faq.md)

可提取内容：

- 部署拓扑
- Docker 与 CLI 运行方式
- 版本发布机制
- 常见问题与运维考虑

## 3. 最值得单独展开写的论文亮点

如果论文需要突出系统特色，推荐优先展开以下三点：

### 3.1 语义数据集建模机制

素材来源：

- [seedar-data-model.md](./seedar-data-model.md)
- [modules/dataset](./modules/dataset/README.md)

亮点：

- 在物理表之上构建语义层
- 字段、Join、指标统一建模

### 3.2 基于 DSL 的查询与指标引擎

素材来源：

- [seedar-query-and-metric-engine.md](./seedar-query-and-metric-engine.md)

亮点：

- 前端不直写 SQL
- 后端动态 Join
- 支持复杂指标表达

### 3.3 结合 workflow 的 AI 辅助机制

素材来源：

- [seedar-ai-and-workflow-design.md](./seedar-ai-and-workflow-design.md)

亮点：

- AI 不只是聊天
- 具备工具、场景和前端动作协同能力

## 4. 写作建议

### 4.1 不建议直接照搬代码目录

论文中不应把“目录结构”当作“系统设计”。更好的写法是：

- 先从业务目标出发
- 再讲系统分层
- 再讲核心模块

### 4.2 建议多画图

Seedar 很适合配以下图：

1. 系统总体架构图
2. 业务流程图
3. E-R 图
4. 查询执行流程图
5. AI workflow 流程图
6. 部署拓扑图

### 4.3 可直接借用的术语方向

如果需要更学术化地表述，可以用以下术语：

- 元数据驱动
- 语义建模层
- 基于 DSL 的查询表达机制
- 分层全栈架构
- 智能辅助型数据分析平台
- 可复用分析资产

## 5. 一句话建议

如果你后续要写毕业论文，最适合把 Seedar 定义为：

“一个面向数据分析场景的、融合语义建模、DSL 查询引擎、可视化编排与 AI workflow 辅助的全栈分析平台。”
