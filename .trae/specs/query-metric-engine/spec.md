# Query模块与Metric Engine集成 - 产品需求文档

## 概述

* **Summary**: 在query模块中集成metric\_engine，实现基于自定义DSL的查询构建和SQL生成功能，支持查询的创建、更新、执行等操作。

* **Purpose**: 提供一个统一的查询构建和执行框架，将前端的查询需求转换为标准SQL语句，实现数据的灵活分析和查询。

* **Target Users**: 开发人员和数据分析人员，通过前端界面构建查询，后端执行并返回结果。

## 目标

* 实现query模块的完整CRUD操作，支持查询的创建、更新、删除和查询

* 集成metric\_engine，实现自定义DSL到标准SQL的转换

* 支持查询状态管理（草稿、使用、停止）

* 提供查询执行功能，生成并执行SQL语句

* 确保错误处理和数据验证

## 非目标（范围外）

* 不实现复杂的权限管理

* 不实现查询结果的缓存机制

* 不实现查询历史记录功能

* 不修改metric\_engine的核心代码

## 背景与上下文

* query模块是一个独立的模块，用于管理和执行查询

* metric\_engine是一个强大的TypeScript工具库，用于将JSON Schema查询定义转换为标准SQL语句

* 前端通过query模块的DSL定义查询需求，后端需要将其转换为metric\_engine的DSL格式，然后生成SQL

## 功能需求

* **FR-1**: 创建查询 - 支持创建具有草稿、使用、停止状态的查询记录

* **FR-2**: 更新查询状态 - 支持更新查询的状态

* **FR-3**: 更新查询信息 - 支持更新查询的名称、DSL等字段

* **FR-4**: 查询查询 - 支持通过ID和状态查询查询

* **FR-5**: 删除查询 - 支持删除查询记录

* **FR-6**: 执行查询 - 将query模块的DSL转换为metric\_engine的DSL，使用KnexSQLGenerator生成SQL并执行

## 非功能需求

* **NFR-1**: 性能 - 查询执行时间不超过3秒

* **NFR-2**: 可靠性 - 提供完善的错误处理和日志记录

* **NFR-3**: 可扩展性 - 支持未来新增查询类型和功能

* **NFR-4**: 代码质量 - 遵循项目的代码风格和规范

## 约束

* **技术**: 使用NestJS框架，TypeScript语言，@metric-engine/core库

* **业务**: 一个query对应一个dataset

* **依赖**: 依赖@metric-engine/core库和数据库连接

## 技术实现细节

* 使用@metric-engine/core库的核心类和类型，如Table、Field、Query、KnexSQLGenerator等

* 从@metric-engine/core导入必要的类型和类，确保正确使用metric-engine的功能

* 实现query DSL到metric-engine DSL的转换逻辑，参考metric-engine的文档和示例

## 假设

* 数据库连接已经配置好

* metric\_engine库已经安装并可用

* 前端会按照定义的DSL格式发送请求

## 验收标准

### AC-1: 创建查询

* **Given**: 前端发送创建查询请求，包含必要的信息

* **When**: 后端接收请求并处理

* **Then**: 数据库中创建查询记录，返回查询ID和状态

* **Verification**: `programmatic`

### AC-2: 更新查询状态

* **Given**: 前端发送更新查询状态请求

* **When**: 后端接收请求并处理

* **Then**: 数据库中查询状态更新，返回更新后的状态

* **Verification**: `programmatic`

### AC-3: 更新查询信息

* **Given**: 前端发送更新查询信息请求，包含名称、DSL等字段

* **When**: 后端接收请求并处理

* **Then**: 数据库中查询信息更新，返回更新后的信息

* **Verification**: `programmatic`

### AC-4: 查询查询

* **Given**: 前端发送查询请求，通过ID或状态

* **When**: 后端接收请求并处理

* **Then**: 返回符合条件的查询列表或单个查询详情

* **Verification**: `programmatic`

### AC-5: 删除查询

* **Given**: 前端发送删除查询请求

* **When**: 后端接收请求并处理

* **Then**: 数据库中查询记录被删除，返回成功信息

* **Verification**: `programmatic`

### AC-6: 执行查询

* **Given**: 前端发送执行查询请求

* **When**: 后端接收请求，转换DSL，生成并执行SQL

* **Then**: 返回查询结果

* **Verification**: `programmatic`

## 未解决问题

* [ ] 具体的query DSL结构需要进一步定义

* [ ] 错误处理的具体实现方式需要确定

* [ ] 与dataset模块的具体关联方式需要明确

