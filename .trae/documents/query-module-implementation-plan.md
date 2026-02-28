# Query 模块实现计划

## 任务分解和优先级排序

### [x] 任务 1: 更新 dsl-transformer.ts 文件，使用 metric-engine 导出的类型
- **优先级**: P0
- **依赖关系**: 无
- **描述**:
  - 移除本地定义的接口（JoinCondition, Join, Metric, Filter, Dimension）
  - 导入并使用 metric-engine 导出的 MinimalDSL, MinimalMetric, MinimalFilter, MinimalJoin 类型
  - 更新 QueryDSL 接口，继承自 MinimalDSL
  - 修复类型错误和导入问题
- **成功标准**:
  - dsl-transformer.ts 文件能够成功编译
  - 所有类型引用正确
- **测试要求**:
  - `programmatic` TR-1.1: 运行 `pnpm --filter server run build` 命令，确保无编译错误
  - `human-judgement` TR-1.2: 代码可读性良好，类型使用正确

### [x] 任务 2: 修复 query.service.ts 中的 KnexSQLGenerator 使用问题
- **优先级**: P0
- **依赖关系**: 任务 1
- **描述**:
  - 修复 KnexSQLGenerator.generate 方法的调用
  - 确保正确处理 SQL 生成结果
  - 修复 knex 导入和类型问题
- **成功标准**:
  - query.service.ts 文件能够成功编译
  - KnexSQLGenerator 正确使用
- **测试要求**:
  - `programmatic` TR-2.1: 运行 `pnpm --filter server run build` 命令，确保无编译错误
  - `human-judgement` TR-2.2: 代码逻辑清晰，错误处理完善

### [x] 任务 3: 验证整个 Query 模块的编译和运行
- **优先级**: P1
- **依赖关系**: 任务 1, 任务 2
- **描述**:
  - 运行完整的构建命令，确保整个 Query 模块能够成功编译
  - 验证所有依赖关系正确
  - 确保类型定义和导入都正确
- **成功标准**:
  - 整个 server 包能够成功构建
  - 无编译错误
- **测试要求**:
  - `programmatic` TR-3.1: 运行 `pnpm --filter server run build` 命令，确保无编译错误
  - `programmatic` TR-3.2: 验证所有导入路径正确

## 实现策略

1. **使用 metric-engine 导出的类型**:
   - 从 `@metric-engine/core` 导入 MinimalDSL, MinimalMetric, MinimalFilter, MinimalJoin 类型
   - 更新 QueryDSL 接口，继承自 MinimalDSL 并添加 datasetId 字段

2. **修复类型错误**:
   - 确保所有类型引用正确
   - 修复可能的类型不匹配问题
   - 确保函数参数和返回值类型正确

3. **修复 KnexSQLGenerator 使用**:
   - 检查 KnexSQLGenerator 的正确用法
   - 确保 SQL 生成和执行逻辑正确

4. **验证构建**:
   - 运行构建命令，确保无编译错误
   - 验证所有依赖关系正确

## 预期结果

- Query 模块能够成功编译
- 所有类型使用正确，无类型错误
- KnexSQLGenerator 正确使用
- 整个 server 包能够成功构建
