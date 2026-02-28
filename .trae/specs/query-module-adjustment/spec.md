# Query 模块调整 - 产品需求文档

## Overview
- **Summary**: 调整 Query 模块，建立 Query 与 Dataset 的关联关系，并实现根据 Dataset 关联的 DataSource 动态连接数据库执行查询
- **Purpose**: 解决当前 Query 模块中数据库连接固定、与 Dataset 关联关系不明确的问题，确保查询能正确连接到对应数据源的数据库
- **Target Users**: 开发人员，系统管理员

## Goals
- 建立 Query 与 Dataset 的一对多关联关系
- 实现根据 Dataset 关联的 DataSource 动态连接数据库
- 确保查询执行时使用正确的数据库连接

## Non-Goals (Out of Scope)
- 不修改 DataSource 和 Dataset 模块的现有结构
- 不添加新的数据源类型
- 不修改现有的 DSL 转换逻辑

## Background & Context
- 当前 Query 实体只存储了 datasetId，但没有建立与 Dataset 的实体关联
- 当前数据库连接是固定的，使用配置文件中的默认连接，无法根据不同的 Dataset 连接到不同的数据源
- Dataset 与 DataSource 已经建立了关联关系，DataSource 存储了数据库连接配置

## Functional Requirements
- **FR-1**: 修改 Query 实体，建立与 Dataset 的多对一关联关系
- **FR-2**: 修改 Query 服务，根据 Dataset 关联的 DataSource 动态创建数据库连接
- **FR-3**: 修改查询执行逻辑，使用动态创建的数据库连接执行 SQL

## Non-Functional Requirements
- **NFR-1**: 性能要求：数据库连接创建和管理不应显著影响查询执行时间
- **NFR-2**: 可靠性：确保数据库连接正确关闭，避免连接泄漏
- **NFR-3**: 可维护性：代码结构清晰，易于理解和维护

## Constraints
- **Technical**: 使用 TypeORM 和 Knex.js 作为数据访问层
- **Dependencies**: 依赖 Dataset 和 DataSource 模块的现有功能

## Assumptions
- Dataset 实体已经正确关联到 DataSource 实体
- DataSource 实体已经存储了完整的数据库连接配置

## Acceptance Criteria

### AC-1: Query 实体与 Dataset 关联
- **Given**: 系统中存在 Dataset 实体
- **When**: 创建或更新 Query 实体时
- **Then**: Query 实体应正确关联到对应的 Dataset 实体
- **Verification**: `programmatic`
- **Notes**: 需要修改 Query 实体，添加与 Dataset 的多对一关联

### AC-2: 动态数据库连接
- **Given**: Query 关联到一个 Dataset，Dataset 关联到一个 DataSource
- **When**: 执行 Query 时
- **Then**: 系统应根据 DataSource 的配置创建数据库连接
- **Verification**: `programmatic`
- **Notes**: 需要修改 QueryService 的执行逻辑，动态创建数据库连接

### AC-3: 正确执行查询
- **Given**: Query 关联到一个 Dataset，Dataset 关联到一个 DataSource
- **When**: 执行 Query 时
- **Then**: 查询应在正确的数据库上执行，并返回结果
- **Verification**: `programmatic`
- **Notes**: 需要确保使用动态创建的数据库连接执行 SQL

## Open Questions
- [ ] 是否需要实现数据库连接池管理，以提高性能？
- [ ] 是否需要处理 DataSource 配置变更的情况？