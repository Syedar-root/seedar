# DSL 类型优化实施计划

## 任务列表

### [x] 任务 1: 修改 create-query.request.ts 文件
- **Priority**: P0
- **Depends On**: 无
- **Description**:
  - 导入 QueryDSL 类型
  - 将 dsl 字段类型从 any 改为 QueryDSL
  - 添加 @IsOptional() 装饰器使其成为可选字段
- **Success Criteria**:
  - CreateQueryRequest 类中的 dsl 字段为可选的 QueryDSL 类型
- **Test Requirements**:
  - `programmatic` TR-1.1: 编译通过，无类型错误
  - `human-judgement` TR-1.2: 代码结构清晰，类型定义明确

### [x] 任务 2: 修改 query.entity.ts 文件
- **Priority**: P0
- **Depends On**: 无
- **Description**:
  - 导入 QueryDSL 类型
  - 将 dsl 字段类型从 any 改为 QueryDSL | null
  - 添加 nullable: true 选项使其在数据库中可以为 null
- **Success Criteria**:
  - Query 实体中的 dsl 字段为可选的 QueryDSL 类型
- **Test Requirements**:
  - `programmatic` TR-2.1: 编译通过，无类型错误
  - `human-judgement` TR-2.2: 代码结构清晰，类型定义明确

### [x] 任务 3: 修改 query.service.ts 文件
- **Priority**: P0
- **Depends On**: 任务 1, 任务 2
- **Description**:
  - 移除类型断言 as QueryDSL
  - 添加对 dsl 为空的检查，确保在执行查询时 DSL 存在
- **Success Criteria**:
  - 执行查询时会检查 DSL 是否存在
  - 不再需要类型断言
- **Test Requirements**:
  - `programmatic` TR-3.1: 编译通过，无类型错误
  - `human-judgement` TR-3.2: 代码结构清晰，错误处理完善

### [x] 任务 4: 验证修改
- **Priority**: P1
- **Depends On**: 任务 1, 任务 2, 任务 3
- **Description**:
  - 运行类型检查，确保所有类型定义正确
  - 验证代码编译通过
- **Success Criteria**:
  - 所有类型检查通过
  - 代码编译成功
- **Test Requirements**:
  - `programmatic` TR-4.1: 类型检查通过，无错误
  - `programmatic` TR-4.2: 编译成功，无错误

## 实施策略

1. 按照优先级顺序执行任务
2. 每个任务完成后进行测试验证
3. 确保修改后的代码类型安全且可扩展
4. 保持代码风格与现有代码一致

## 预期结果

- 类型定义明确，接口文档清晰
- 支持创建查询时不提供 DSL
- 执行查询时确保 DSL 存在
- 代码类型安全，无类型断言
- 后续 DSL 版本迭代时具有良好的可扩展性