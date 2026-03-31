# DTO一致性检查与同步计划

## 任务概述
检查 `d:\Program\projects\seedar\apps\server\` 中的DTO和 `d:\Program\projects\seedar\packages\types\` 中的DTO是否一致，以后端为准，并进行同步更新。

## 发现的差异汇总

### 1. Dashboard模块
- **Server端**: 使用class + class-validator装饰器
- **Types端**: 使用interface定义
- **差异**: Types端缺少完整的PanelResponse和DashboardResponse定义

### 2. Dataset模块
- **Server端**: UpdateDatasetRequest仅包含基本字段（dataSetId, name, description, fields, metrics, joins, tables）
- **Types端**: UpdateDatasetRequest结构相同，但AddField/UpdateField等类型定义不同
- **差异**: Types端使用独立类型定义，Server端使用Pick从Entity提取

### 3. Datasource模块
- **Server端**: DatasourceResponse包含normalizedType: FieldType
- **Types端**: DatasourceResponse包含normalizedType: any
- **差异**: normalizedType类型不一致

### 4. Query模块
- **Server端**: 使用class + class-validator装饰器
- **Types端**: 使用interface定义
- **差异**: 结构基本一致，但实现方式不同

## 执行计划

### 阶段1: 详细对比分析（并行执行）
**任务1.1**: 对比Dashboard模块DTO差异
- 对比CreateDashboardRequest、UpdateDashboardRequest、CreatePanelRequest、UpdatePanelRequest
- 对比DashboardResponse、PanelResponse
- 识别字段、类型、结构差异

**任务1.2**: 对比Dataset模块DTO差异
- 对比CreateDatasetRequest、UpdateDatasetRequest
- 对比EntityActionRequest及其相关类型
- 对比CreateDatasetFieldRequest、CreateDatasetJoinRequest
- 识别AddField、UpdateField、AddMetric、UpdateMetric等类型差异

**任务1.3**: 对比Datasource模块DTO差异
- 对比CreateDatasourceRequest、UpdateDatasourceRequest
- 对比DatasourceResponse
- 识别normalizedType等字段类型差异

**任务1.4**: 对比Query模块DTO差异
- 对比CreateQueryRequest、UpdateQueryRequest
- 对比ExecuteQueryRequest、ExecuteTempQueryRequest
- 对比ExecuteQueryResponse
- 识别所有字段和类型差异

**依赖关系**: 任务1.1-1.4可以并行执行，无依赖

### 阶段2: 同步packages/types中的DTO（串行执行）
**任务2.1**: 同步Dashboard模块DTO到packages/types
- 以后端CreateDashboardRequest为准，更新types中的CreateDashboardRequest interface
- 以后端UpdateDashboardRequest为准，更新types中的UpdateDashboardRequest interface
- 以后端CreatePanelRequest为准，更新types中的CreatePanelRequest interface
- 以后端UpdatePanelRequest为准，更新types中的UpdatePanelRequest interface
- 确保DashboardResponse和PanelResponse与后端一致

**任务2.2**: 同步Dataset模块DTO到packages/types
- 以后端CreateDatasetRequest为准，更新types中的CreateDatasetRequest interface
- 以后端UpdateDatasetRequest为准，更新types中的UpdateDatasetRequest interface
- 以后端EntityActionRequest为准，更新types中的EntityActionRequest interface
- 以后端CreateDatasetFieldRequest为准，更新types中的CreateDatasetFieldRequest interface
- 以后端CreateDatasetJoinRequest为准，更新types中的CreateDatasetJoinRequest interface
- 同步AddField、UpdateField、AddMetric、UpdateMetric等类型定义

**任务2.3**: 同步Datasource模块DTO到packages/types
- 以后端CreateDatasourceRequest为准，更新types中的CreateDatasourceRequest interface
- 以后端UpdateDatasourceRequest为准，更新types中的UpdateDatasourceRequest interface
- 以后端DatasourceResponse为准，更新types中的DatasourceResponse interface
- 修复normalizedType类型为FieldType

**任务2.4**: 同步Query模块DTO到packages/types
- 以后端CreateQueryRequest为准，更新types中的CreateQueryRequest interface
- 以后端UpdateQueryRequest为准，更新types中的UpdateQueryRequest interface
- 以后端ExecuteQueryRequest为准，更新types中的ExecuteQueryRequest interface
- 以后端ExecuteTempQueryRequest为准，更新types中的ExecuteTempQueryRequest interface
- 以后端ExecuteQueryResponse为准，更新types中的ExecuteQueryResponse interface

**依赖关系**: 任务2.1-2.4可以并行执行，无依赖

### 阶段3: 验证与修复（并行执行）
**任务3.1**: 检查Dashboard模块类型错误
- 运行TypeScript类型检查
- 修复发现的类型错误
- 确保所有导入正确

**任务3.2**: 检查Dataset模块类型错误
- 运行TypeScript类型检查
- 修复发现的类型错误
- 确保所有导入正确

**任务3.3**: 检查Datasource模块类型错误
- 运行TypeScript类型检查
- 修复发现的类型错误
- 确保所有导入正确

**任务3.4**: 检查Query模块类型错误
- 运行TypeScript类型检查
- 修复发现的类型错误
- 确保所有导入正确

**依赖关系**: 任务3.1-3.4可以并行执行，无依赖

### 阶段4: Lint检查与修复（并行执行）
**任务4.1**: 运行Dashboard模块Lint检查
- 运行eslint检查
- 修复发现的lint错误

**任务4.2**: 运行Dataset模块Lint检查
- 运行eslint检查
- 修复发现的lint错误

**任务4.3**: 运行Datasource模块Lint检查
- 运行eslint检查
- 修复发现的lint错误

**任务4.4**: 运行Query模块Lint检查
- 运行eslint检查
- 修复发现的lint错误

**依赖关系**: 任务4.1-4.4可以并行执行，无依赖

### 阶段5: 最终验证（串行执行）
**任务5.1**: 运行完整的TypeScript类型检查
- 在apps/server目录运行tsc --noEmit
- 确保无类型错误

**任务5.2**: 运行完整的Lint检查
- 在apps/server目录运行eslint
- 确保无lint错误

**任务5.3**: 验证packages/types导出
- 确保所有更新的DTO都正确导出
- 检查index.ts文件

**依赖关系**: 任务5.1-5.3串行执行

## 执行策略

### 并行执行时机
- 阶段1: 使用4个subagent并行执行对比分析任务
- 阶段2: 使用4个subagent并行执行同步任务
- 阶段3: 使用4个subagent并行执行类型检查任务
- 阶段4: 使用4个subagent并行执行lint检查任务

### Subagent使用说明
每个subagent将负责一个模块的完整处理流程，包括：
1. 读取相关DTO文件
2. 对比差异
3. 更新packages/types中的DTO
4. 验证类型和lint错误
5. 报告处理结果

## 预期输出
- 所有packages/types中的DTO与apps/server中的DTO保持一致
- 无TypeScript类型错误
- 无ESLint错误
- 所有模块的DTO正确导出

## 注意事项
1. 严格以apps/server中的DTO为准进行同步
2. 保持packages/types中的interface定义方式（不改为class）
3. 确保所有导入路径正确
4. 保持代码格式一致性
5. 同步过程中注意保留types端特有的类型定义（如各种Response接口）
