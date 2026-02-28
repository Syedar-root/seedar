# Query 模块调整 - 实现计划

## [x] 任务 1: 修改 Query 实体，建立与 Dataset 的关联关系
- **Priority**: P0
- **Depends On**: None
- **Description**:
  - 修改 Query 实体，添加与 Dataset 的多对一关联
  - 保留现有的 datasetId 字段作为外键
  - 添加 dataset 关联属性
- **Acceptance Criteria Addressed**: AC-1
- **Test Requirements**:
  - `programmatic` TR-1.1: Query 实体应正确关联到 Dataset 实体
  - `programmatic` TR-1.2: 可以通过 Query 实体访问关联的 Dataset
- **Notes**: 需要导入 Dataset 实体

## [x] 任务 2: 修改 QueryService，注入 Dataset 仓库
- **Priority**: P0
- **Depends On**: 任务 1
- **Description**:
  - 在 QueryService 构造函数中注入 Dataset 仓库
  - 移除固定的 knex 连接初始化
- **Acceptance Criteria Addressed**: AC-2
- **Test Requirements**:
  - `programmatic` TR-2.1: QueryService 应能正确注入 Dataset 仓库
  - `programmatic` TR-2.2: 移除固定的 knex 连接初始化
- **Notes**: 需要导入 Dataset 实体和 Repository

## [x] 任务 3: 实现动态数据库连接逻辑
- **Priority**: P0
- **Depends On**: 任务 2
- **Description**:
  - 实现根据 Dataset ID 获取关联的 DataSource 配置
  - 根据 DataSource 配置动态创建 knex 连接
  - 确保连接在使用后正确关闭
- **Acceptance Criteria Addressed**: AC-2
- **Test Requirements**:
  - `programmatic` TR-3.1: 能根据 Dataset ID 获取正确的 DataSource 配置
  - `programmatic` TR-3.2: 能根据 DataSource 配置创建正确的数据库连接
  - `programmatic` TR-3.3: 数据库连接在使用后正确关闭
- **Notes**: 需要处理 DataSource 配置不存在的情况

## [x] 任务 4: 修改查询执行逻辑
- **Priority**: P0
- **Depends On**: 任务 3
- **Description**:
  - 修改 execute 方法，使用动态创建的数据库连接
  - 修改 KnexSQLGenerator 的初始化，使用动态连接配置
  - 确保查询结果正确返回
- **Acceptance Criteria Addressed**: AC-3
- **Test Requirements**:
  - `programmatic` TR-4.1: 执行查询时使用动态创建的数据库连接
  - `programmatic` TR-4.2: 查询结果正确返回
  - `programmatic` TR-4.3: KnexSQLGenerator 正确初始化
- **Notes**: 需要处理查询执行失败的情况

## [x] 任务 5: 测试和验证
- **Priority**: P1
- **Depends On**: 任务 4
- **Description**:
  - 测试 Query 与 Dataset 的关联关系
  - 测试动态数据库连接的创建和使用
  - 测试查询执行逻辑
- **Acceptance Criteria Addressed**: AC-1, AC-2, AC-3
- **Test Requirements**:
  - `programmatic` TR-5.1: 所有测试用例通过
  - `human-judgement` TR-5.2: 代码结构清晰，易于理解
- **Notes**: 需要创建测试用例验证功能