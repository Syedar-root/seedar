# 查询结果格式化实现计划

## 任务分解与优先级

### [ ] 任务 1: 修改 KnexSQLGenerator 类，添加列别名映射功能
- **优先级**: P0
- **依赖**: 无
- **描述**:
  - 修改 `generateSelect` 方法，使其返回 `columnMappings` 数组
  - 修改 `buildSelectItems` 方法，使其同时返回 select 子句项和列映射信息
  - 更新 `generateSQLWithBindings` 方法的返回类型
- **成功标准**:
  - `generateSQLWithBindings` 方法返回包含 `sql`、`bindings` 和 `columnMappings` 的对象
  - `columnMappings` 包含每个列的别名、类型、原始字段/指标信息
- **测试要求**:
  - `programmatic` TR-1.1: 调用 `generateSQLWithBindings` 方法，验证返回对象包含 `columnMappings` 字段
  - `programmatic` TR-1.2: 验证 `columnMappings` 数组中每个元素包含 `alias`、`type`、`originalName` 和 `displayName` 字段

### [ ] 任务 2: 修改 ExecuteQueryResponse 类型定义
- **优先级**: P0
- **依赖**: 任务 1
- **描述**:
  - 更新 `ExecuteQueryResponse` 类，将 `results` 字段格式化为包含 `header` 和 `rows` 的结构
  - 添加 `columnMappings` 字段
- **成功标准**:
  - `ExecuteQueryResponse` 类型定义包含正确的字段结构
- **测试要求**:
  - `programmatic` TR-2.1: 验证类型定义符合预期结构

### [ ] 任务 3: 修改 QueryService 类，处理执行结果并格式化
- **优先级**: P0
- **依赖**: 任务 1, 任务 2
- **描述**:
  - 改进执行结果的处理逻辑，支持不同格式的返回值
  - 使用 `columnMappings` 生成 header
  - 构建包含 `header` 和 `rows` 的结果结构
- **成功标准**:
  - 执行查询后返回格式化的结果，包含 `header` 和 `rows`
  - 结果中的 `header` 与 `columnMappings` 中的 `displayName` 对应
- **测试要求**:
  - `programmatic` TR-3.1: 验证返回的 `results` 字段包含 `header` 和 `rows`
  - `programmatic` TR-3.2: 验证 `header` 数组与 `columnMappings` 中的 `displayName` 一致

## 实现步骤

1. **任务 1**: 修改 `knex-sql-generator.ts` 文件
   - 更新 `generateSelect` 方法返回类型和实现
   - 更新 `buildSelectItems` 方法返回类型和实现
   - 更新 `generateSQLWithBindings` 方法返回类型

2. **任务 2**: 修改 `execute-query.response.ts` 文件
   - 更新 `ExecuteQueryResponse` 类定义

3. **任务 3**: 修改 `query.service.ts` 文件
   - 更新 `execute` 方法，处理执行结果并格式化

## 预期效果

执行查询后，返回的响应将包含：
- 生成的 SQL 语句
- 格式化的结果，包含：
  - `header`：列的显示名称数组
  - `rows`：查询结果数据数组
- 执行时间
- 列别名映射信息，包括：
  - 自动生成的列别名（如 column_1, column_2 等）
  - 列类型（dimension 或 metric）
  - 原始字段或指标对象
  - 原始名称
  - 显示名称（别名或原始名称）

这样，前端或其他调用方可以直接使用格式化后的结果，而不需要自己处理列名和数据的对应关系，同时可以使用列别名映射信息进行回显和复现。