# ui-core 包重构规范

## Why

当前 ui-core 包的设计与"只处理数据、框架无关"的理念不符，包含了图表相关类型和可视化依赖。需要重构为纯粹的数据处理和API客户端层，为 ui-react/ui-vue 等框架特定包提供基础支持。

## What Changes

- **创建共享类型包** `@seedar/types`：从 server 导出共享的类型定义
- **重构 ui-core 包**：
  - 移除 @visactor/vchart 依赖
  - 移除图表相关类型（BaseChartProps, LineChartProps 等）
  - 创建 API 客户端层（datasource, dataset, query）
  - 实现统一的错误处理机制（全局 + 单个API，支持优先级）
  - 保留并增强数据处理工具
  - 保留格式化工具
  - 重新导出 @seedar/types 的类型
- **更新 ui-react 包**：
  - 移除对 ui-core 图表类型的依赖
  - 适配新的 API 调用方式
  - 集成 react-query 进行状态管理

## Impact

- 受影响的规范：ui-monorepo-setup（需要更新）
- 受影响的代码：
  - packages/ui-core（完全重构）
  - packages/ui-react（适配新API）
  - apps/server（类型导出调整）
  - apps/web-client（可能的集成调整）

## ADDED Requirements

### Requirement: 共享类型包

系统 SHALL 提供一个独立的 `@seedar/types` 包，用于在 server、ui-core、ui-react 之间共享类型定义。

#### Scenario: 类型导出
- **WHEN** server 定义了新的 DTO 或 Entity 类型
- **THEN** 这些类型应能被 @seedar/types 包导出
- **AND** ui-core 和 ui-react 应能引用这些类型

### Requirement: API 客户端

系统 SHALL 提供一个统一的 API 客户端，用于与 server 后端进行交互。

#### Scenario: 初始化配置
- **WHEN** 应用调用 `ApiClient.init()`
- **THEN** 应能配置 baseURL、autoParseResponse、globalOnError 等参数
- **AND** 配置应全局生效

#### Scenario: API 调用
- **WHEN** 应用调用 `ApiClient.datasource.findAll()`
- **THEN** 应返回正确类型的数据
- **AND** 应支持可选的 onError 回调

### Requirement: 错误处理机制

系统 SHALL 提供灵活的错误处理机制，支持全局和单个API级别的错误处理。

#### Scenario: 错误处理优先级
- **WHEN** API 调用失败且同时配置了全局和单个错误处理
- **THEN** 单个 API 的 onError 应优先执行
- **AND** 单个回调中应提供全局回调引用
- **AND** 应用侧可决定是否调用全局回调

#### Scenario: 仅全局错误处理
- **WHEN** API 调用失败且仅配置了全局错误处理
- **THEN** 应执行全局的 globalOnError

### Requirement: 响应处理选项

系统 SHALL 提供响应处理选项，让应用侧决定如何处理 server 的统一响应格式。

#### Scenario: 自动解析响应
- **WHEN** autoParseResponse 设置为 true
- **THEN** API 调用应自动解析 `{ success, code, message, data }` 格式
- **AND** 只返回 data 给应用侧

#### Scenario: 保留完整响应
- **WHEN** autoParseResponse 设置为 false
- **THEN** API 调用应返回完整的响应对象

### Requirement: 数据处理工具

系统 SHALL 提供数据处理工具，包括数据验证、转换等功能。

#### Scenario: 数据验证
- **WHEN** 调用 `validateData(data)`
- **THEN** 应返回数据是否有效的布尔值

#### Scenario: 数据转换
- **WHEN** 调用 `transformData(data, mapping)`
- **THEN** 应根据映射规则转换数据字段

### Requirement: 格式化工具

系统 SHALL 提供格式化工具，包括数字、百分比等格式化功能。

#### Scenario: 数字格式化
- **WHEN** 调用 `formatNumber(value, decimals)`
- **THEN** 应返回格式化后的数字字符串

#### Scenario: 百分比格式化
- **WHEN** 调用 `formatPercent(value, decimals)`
- **THEN** 应返回格式化后的百分比字符串

## MODIFIED Requirements

### Requirement: ui-core 包职责

ui-core 包 SHALL 专注于数据处理和 API 客户端，不包含任何可视化相关代码。

#### Scenario: 无可视化依赖
- **WHEN** 查看 ui-core 的 package.json
- **THEN** 不应包含 @visactor/vchart 或其他可视化库依赖
- **AND** 不应包含图表相关类型定义

#### Scenario: 框架无关
- **WHEN** 使用 ui-core
- **THEN** 不应依赖 React、Vue 或其他前端框架
- **AND** 应能在任何 JavaScript/TypeScript 环境中使用

### Requirement: ui-react 包职责

ui-react 包 SHALL 基于 ui-core 构建，提供 React 特定的组件和状态管理。

#### Scenario: 依赖 ui-core
- **WHEN** 查看 ui-react 的 package.json
- **THEN** 应依赖 @seedar/ui-core
- **AND** 应使用 ui-core 提供的 API 客户端

#### Scenario: 集成 react-query
- **WHEN** 使用 ui-react 的组件
- **THEN** 应支持使用 react-query 进行状态管理
- **AND** 应提供对应的 hooks

## REMOVED Requirements

### Requirement: 图表类型定义

**原因**：图表类型属于可视化范畴，应移至 ui-react 包中。

**迁移**：将 BaseChartProps、LineChartProps、BarChartProps、PieChartProps 等类型移至 ui-react 包。

### Requirement: 可视化依赖

**原因**：ui-core 应保持框架无关，不依赖任何可视化库。

**迁移**：移除 @visactor/vchart 依赖，相关功能由 ui-react 包提供。
