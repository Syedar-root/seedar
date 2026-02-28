# Query 模块与 Metric Engine 集成 - 实现计划

## [x] 任务 1: 定义 Query 实体和状态枚举

- **优先级**: P0
- **依赖**: None
- **描述**:
  - 创建 Query 实体，包含 id、name、datasetId、dsl、status 等字段
  - 定义查询状态枚举（草稿、使用、停止）
- **验收标准**: AC-1, AC-2, AC-3, AC-4, AC-5
- **测试要求**:
  - `programmatic` TR-1.1: Query 实体正确定义，包含所有必要字段
  - `programmatic` TR-1.2: 状态枚举正确定义，包含草稿、使用、停止三个状态
- **备注**: 状态字段使用枚举类型，确保数据一致性

## [x] 任务 2: 创建查询 DTO（请求和响应）

- **优先级**: P0
- **依赖**: 任务 1
- **描述**:
  - 创建 create-query.request.ts，包含 name、datasetId、dsl 等字段
  - 创建 update-query.request.ts，继承 CreateQueryRequest 并使用 PartialType
  - 创建 query.response.ts，定义查询响应结构
  - 创建执行查询的请求和响应 DTO
- **验收标准**: AC-1, AC-3, AC-6
- **测试要求**:
  - `programmatic` TR-2.1: DTO 字段定义正确，包含所有必要字段
  - `programmatic` TR-2.2: DTO 验证规则正确设置
- **备注**: 遵循项目的 DTO 命名规范，使用 request 和 response 后缀

## [x] 任务 3: 实现 QueryService 的 CRUD 操作

- **优先级**: P0
- **依赖**: 任务 1, 任务 2
- **描述**:
  - 实现 create 方法，创建查询记录
  - 实现 findAll 方法，支持按状态查询
  - 实现 findOne 方法，通过 ID 查询
  - 实现 update 方法，更新查询信息
  - 实现 remove 方法，删除查询记录
- **验收标准**: AC-1, AC-2, AC-3, AC-4, AC-5
- **测试要求**:
  - `programmatic` TR-3.1: 所有 CRUD 方法正确实现
  - `programmatic` TR-3.2: 错误处理正确，返回适当的错误信息
- **备注**: 使用数据库操作，确保事务和错误处理

## [x] 任务 4: 集成@metric-engine/core，实现 DSL 转换

- **优先级**: P0
- **依赖**: 任务 1, 任务 2
- **描述**:
  - 从@metric-engine/core 导入核心类和类型
  - 实现 query DSL 到 metric-engine DSL 的转换逻辑
  - 创建 SQLQuery 类，封装 metric-engine 的 Query
- **验收标准**: AC-6
- **测试要求**:
  - `programmatic` TR-4.1: DSL 转换逻辑正确实现
  - `programmatic` TR-4.2: 支持所有必要的查询类型和操作
- **备注**: 参考@metric-engine/core 的文档和示例，确保转换逻辑正确

## [x] 任务 5: 实现查询执行功能

- **优先级**: P0
- **依赖**: 任务 3, 任务 4
- **描述**:
  - 在 QueryService 中添加 execute 方法
  - 实现使用 KnexSQLGenerator 生成 SQL 的逻辑
  - 处理执行结果和错误
- **验收标准**: AC-6
- **测试要求**:
  - `programmatic` TR-5.1: 查询执行方法正确实现
  - `programmatic` TR-5.2: 使用 KnexSQLGenerator 生成的 SQL 正确，执行结果返回正确
  - `programmatic` TR-5.3: 错误处理正确，返回适当的错误信息
- **备注**: 使用 knex 执行 SQL，确保参数安全和性能

## [x] 任务 6: 更新 QueryController，添加执行查询接口

- **优先级**: P1
- **依赖**: 任务 2, 任务 5
- **描述**:
  - 添加执行查询的 POST 接口
  - 更新现有接口，确保与新的 DTO 和 Service 方法匹配
- **验收标准**: AC-6
- **测试要求**:
  - `programmatic` TR-6.1: 执行查询接口正确实现
  - `programmatic` TR-6.2: 所有接口响应正确，状态码和数据格式符合要求
- **备注**: 遵循 RESTful API 设计规范

## [x] 任务 7: 测试和验证

- **优先级**: P1
- **依赖**: 所有任务
- **描述**:
  - 编写单元测试和集成测试
  - 验证所有功能正常工作
  - 检查错误处理和边界情况
- **验收标准**: 所有 AC
- **测试要求**:
  - `programmatic` TR-7.1: 所有测试用例通过
  - `human-judgment` TR-7.2: 代码质量和可读性良好
- **备注**: 使用项目的测试框架，确保测试覆盖率

## [x] 任务 8: 文档和代码优化

- **优先级**: P2
- **依赖**: 所有任务
- **描述**:
  - 完善代码注释
  - 优化代码结构和性能
  - 更新相关文档
- **验收标准**: NFR-4
- **测试要求**:
  - `human-judgment` TR-8.1: 代码注释完整，文档清晰
  - `human-judgment` TR-8.2: 代码结构合理，性能优化到位
- **备注**: 遵循项目的代码风格和规范
