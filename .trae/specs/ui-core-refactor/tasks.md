# Tasks

## 阶段 1：创建共享类型包

- [x] Task 1.1: 创建 @seedar/types 包基础结构

  - [x] 创建 packages/types 目录
  - [x] 创建 packages/types/src 目录
  - [x] 创建 packages/types/src/datasource 目录
  - [x] 创建 packages/types/src/dataset 目录
  - [x] 创建 packages/types/src/query 目录
  - [x] 创建 packages/types/src/common 目录
  - [x] 创建 packages/types/package.json 文件
  - [x] 创建 packages/types/tsconfig.json 文件
  - [x] 创建 packages/types/src/index.ts 文件

- [x] Task 1.2: 配置 @seedar/types 的 package.json

  - [x] 设置包名为 @seedar/types
  - [x] 设置版本号为 1.0.0
  - [x] 配置 main 为 dist/index.js
  - [x] 配置 types 为 dist/index.d.ts
  - [x] 配置 module 为 dist/index.mjs
  - [x] 配置 exports 字段
  - [x] 添加构建脚本（build, type-check, clean）
  - [x] 添加 devDependencies（typescript, @types/node）
  - [x] 配置 sideEffects 为 false

- [x] Task 1.3: 配置 @seedar/types 的 tsconfig.json

  - [x] 设置编译目标为 ES2020
  - [x] 设置模块系统为 ESNext
  - [x] 启用严格模式
  - [x] 配置输出目录为 dist
  - [x] 配置声明文件生成
  - [x] 配置 sourceMap 生成
  - [x] 配置模块解析为 node

- [x] Task 1.4: 从 server 导出 datasource 相关类型

  - [x] 创建 packages/types/src/datasource/datasource.types.ts
  - [x] 从 server/src/module/datasource/datasource.types.ts 复制所有枚举（DataSourceType, DataSourceStatus, NormalizedDataType）
  - [x] 从 server/src/module/datasource/datasource.types.ts 复制所有配置类（MySqlConfig, PgConfig, ClickHouseConfig, CsvConfig, ExcelConfig）
  - [x] 从 server/src/module/datasource/datasource.types.ts 复制 DataSourceConfig 类型
  - [x] 创建 packages/types/src/datasource/datasource.dto.ts
  - [x] 从 server/src/module/datasource/dto/create-datasource.request.ts 复制 CreateDatasourceRequest
  - [x] 从 server/src/module/datasource/dto/update-datasource.request.ts 复制 UpdateDatasourceRequest
  - [x] 从 server/src/module/datasource/dto/datasource.response.ts 复制 DatasourceResponse
  - [x] 创建 packages/types/src/datasource/index.ts
  - [x] 导出所有 datasource 相关类型

- [x] Task 1.5: 从 server 导出 dataset 相关类型

  - [x] 创建 packages/types/src/dataset/dataset.types.ts
  - [x] 从 server/src/module/dataset/dataset.types.ts 复制所有枚举（DatasetType, DatasetStatus, JoinType, FieldRole, Aggregation, FieldType, MetricType, MetricAggregateFunction, MetricOperator, PeriodOverPeriodType, PeriodCalculationMode, UpdateDatasetAction）
  - [x] 从 server/src/module/dataset/dataset.types.ts 复制所有接口（AggregateConditionConfig, DatasourceResponse, MainTableResponse, DatasetTableResponse, DatasetFieldResponse, DatasetMetricResponse, DatasetJoinResponse, DatasetResponse）
  - [x] 创建 packages/types/src/dataset/dataset.dto.ts
  - [x] 从 server/src/module/dataset/dto/create-dataset.request.ts 复制 CreateDatasetRequest
  - [x] 从 server/src/module/dataset/dto/update-dataset.req.ts 复制 UpdateDatasetRequest
  - [x] 从 server/src/module/dataset/dto/dataset-field.dto.ts 复制 CreateDatasetFieldRequest
  - [x] 从 server/src/module/dataset/dto/dataset-join.dto.ts 复制 CreateDatasetJoinRequest
  - [x] 从 server/src/module/dataset/dto/entity-action.request.ts 复制 EntityActionRequest
  - [x] 创建 packages/types/src/dataset/index.ts
  - [x] 导出所有 dataset 相关类型

- [x] Task 1.6: 从 server 导出 query 相关类型

  - [x] 创建 packages/types/src/query/query.types.ts
  - [x] 从 server/src/module/query/query-status.enum.ts 复制 QueryStatus 枚举
  - [x] 从 server/src/module/query/dto/query.response.ts 复制 QueryResponse 接口
  - [x] 创建 packages/types/src/query/query.dto.ts
  - [x] 从 server/src/module/query/dto/create-query.request.ts 复制 CreateQueryRequest
  - [x] 从 server/src/module/query/dto/update-query.request.ts 复制 UpdateQueryRequest
  - [x] 从 server/src/module/query/dto/execute-query.request.ts 复制 ExecuteQueryRequest
  - [x] 从 server/src/module/query/dto/execute-query.response.ts 复制 ExecuteQueryResponse
  - [x] 创建 packages/types/src/query/index.ts
  - [x] 导出所有 query 相关类型

- [x] Task 1.7: 创建通用类型定义

  - [x] 创建 packages/types/src/common/api.types.ts
  - [x] 定义 ApiResponse<T> 接口（包含 success, code, message, data 字段）
  - [x] 定义 ApiError 接口（包含 message, code, details 字段）
  - [x] 定义 ApiConfig 接口（包含 baseURL, timeout, headers 等配置）
  - [x] 定义 RequestOptions 接口（包含 params, headers, onError 等选项）
  - [x] 创建 packages/types/src/common/index.ts
  - [x] 导出所有通用类型

- [x] Task 1.8: 配置 @seedar/types 的主入口文件

  - [x] 在 packages/types/src/index.ts 中重新导出所有模块
  - [x] 导出 datasource 模块的所有类型
  - [x] 导出 dataset 模块的所有类型
  - [x] 导出 query 模块的所有类型
  - [x] 导出 common 模块的所有类型

- [x] Task 1.9: 测试 @seedar/types 包构建
  - [x] 运行 pnpm install 安装依赖
  - [x] 运行 pnpm build 构建 types 包
  - [x] 验证 dist 目录生成正确
  - [x] 验证类型定义文件生成正确
  - [x] 运行 pnpm type-check 检查类型错误

## 阶段 2：重构 ui-core 包

- [x] Task 2.1: 清理 ui-core 包的现有代码

  - [x] 删除 packages/ui-core/src/types/chart.ts 文件
  - [x] 删除 packages/ui-core/src/config/defaults.ts 文件
  - [x] 删除 packages/ui-core/src/config/theme.ts 文件
  - [x] 删除 packages/ui-core/src/config 目录
  - [x] 更新 packages/ui-core/src/index.ts，移除对已删除文件的引用

- [x] Task 2.2: 更新 ui-core 的 package.json

  - [x] 移除 @visactor/vchart 依赖
  - [x] 添加 @seedar/types 依赖（workspace:\*）
  - [x] 添加 axios 依赖
  - [x] 配置 main 为 src/index.ts
  - [x] 配置 types 为 src/index.ts
  - [x] 配置 exports 字段

- [x] Task 2.3: 创建 ui-core 的目录结构

  - [x] 创建 packages/ui-core/src/api 目录
  - [x] 创建 packages/ui-core/src/types 目录
  - [x] 创建 packages/ui-core/src/utils 目录
  - [x] 创建 packages/ui-core/src/config 目录

- [x] Task 2.4: 实现 API 客户端核心类

  - [x] 创建 packages/ui-core/src/api/client.ts
  - [x] 定义 ApiClient 类
  - [x] 实现 init(config) 静态方法，接收 ApiConfig 参数
  - [x] 实现 get(url, options) 方法
  - [x] 实现 post(url, data, options) 方法
  - [x] 实现 put(url, data, options) 方法
  - [x] 实现 patch(url, data, options) 方法
  - [x] 实现 delete(url, options) 方法
  - [x] 实现响应解析逻辑（根据 autoParseResponse 配置）
  - [x] 实现错误处理逻辑（支持全局和单个错误处理）
  - [x] 实现错误处理优先级机制（单个 > 全局）

- [x] Task 2.5: 实现 Datasource API

  - [x] 创建 packages/ui-core/src/api/datasource.ts
  - [x] 定义 DatasourceApi 类
  - [x] 实现 findAll(options) 方法（GET /datasource）
  - [x] 实现 findOne(id, options) 方法（GET /datasource/:id）
  - [x] 实现 create(data, options) 方法（POST /datasource）
  - [x] 实现 update(id, data, options) 方法（PATCH /datasource/:id）
  - [x] 实现 remove(id, options) 方法（DELETE /datasource/:id）
  - [x] 所有方法支持可选的 onError 回调

- [x] Task 2.6: 实现 Dataset API

  - [x] 创建 packages/ui-core/src/api/dataset.ts
  - [x] 定义 DatasetApi 类
  - [x] 实现 findAll(options) 方法（GET /dataset）
  - [x] 实现 findOne(id, options) 方法（GET /dataset/:id）
  - [x] 实现 create(data, options) 方法（POST /dataset）
  - [x] 实现 update(data, options) 方法（PATCH /dataset）
  - [x] 实现 remove(id, options) 方法（DELETE /dataset/:id）
  - [x] 所有方法支持可选的 onError 回调

- [x] Task 2.7: 实现 Query API

  - [x] 创建 packages/ui-core/src/api/query.ts
  - [x] 定义 QueryApi 类
  - [x] 实现 findAll(status, options) 方法（GET /query）
  - [x] 实现 findOne(id, options) 方法（GET /query/:id）
  - [x] 实现 create(data, options) 方法（POST /query）
  - [x] 实现 update(id, data, options) 方法（PATCH /query/:id）
  - [x] 实现 remove(id, options) 方法（DELETE /query/:id）
  - [x] 实现 execute(queryId, options) 方法（POST /query/execute）
  - [x] 所有方法支持可选的 onError 回调

- [x] Task 2.8: 创建 API 客户端实例

  - [x] 在 packages/ui-core/src/api/client.ts 中创建默认实例
  - [x] 导出 ApiClient 类
  - [x] 导出 datasource API 实例
  - [x] 导出 dataset API 实例
  - [x] 导出 query API 实例

- [x] Task 2.9: 配置 ui-core 的类型导出

  - [x] 创建 packages/ui-core/src/types/index.ts
  - [x] 从 @seedar/types 重新导出所有 datasource 类型
  - [x] 从 @seedar/types 重新导出所有 dataset 类型
  - [x] 从 @seedar/types 重新导出所有 query 类型
  - [x] 从 @seedar/types 重新导出所有 common 类型

- [x] Task 2.10: 增强数据处理工具

  - [x] 保留 packages/ui-core/src/utils/data.ts 中的 validateData 函数
  - [x] 保留 packages/ui-core/src/utils/data.ts 中的 transformData 函数
  - [x] 添加 filterData(data, predicate) 函数
  - [x] 添加 sortData(data, key, order) 函数
  - [x] 添加 groupData(data, key) 函数
  - [x] 添加 aggregateData(data, key, aggregator) 函数
  - [x] 添加 paginateData(data, page, pageSize) 函数

- [x] Task 2.11: 增强格式化工具

  - [x] 保留 packages/ui-core/src/utils/format.ts 中的 formatNumber 函数
  - [x] 保留 packages/ui-core/src/utils/format.ts 中的 formatPercent 函数
  - [x] 添加 formatDate(date, format) 函数
  - [x] 添加 formatCurrency(value, currency, decimals) 函数
  - [x] 添加 formatBytes(bytes, decimals) 函数
  - [x] 添加 formatDuration(seconds) 函数

- [x] Task 2.12: 创建配置管理模块

  - [x] 创建 packages/ui-core/src/config/index.ts
  - [x] 定义 ApiConfig 接口（从 @seedar/types 导入）
  - [x] 定义默认配置对象
  - [x] 导出配置类型和默认值

- [x] Task 2.13: 更新 ui-core 的主入口文件

  - [x] 在 packages/ui-core/src/index.ts 中导出 ApiClient
  - [x] 导出 datasource API
  - [x] 导出 dataset API
  - [x] 导出 query API
  - [x] 导出所有类型（从 types/index.ts）
  - [x] 导出数据处理工具（从 utils/data.ts）
  - [x] 导出格式化工具（从 utils/format.ts）
  - [x] 导出配置（从 config/index.ts）

- [x] Task 2.14: 测试 ui-core 包的类型检查
  - [x] 运行 pnpm install 安装依赖
  - [x] 运行 TypeScript 类型检查
  - [x] 验证所有类型导出正确
  - [x] 验证 API 方法签名正确

## 阶段 3：更新 ui-react 包

- [x] Task 3.1: 更新 ui-react 的 package.json

  - [x] 确认依赖 @seedar/ui-core（workspace:\*）
  - [x] 确认依赖 @visactor/react-vchart
  - [x] 确认依赖 @visactor/vchart
  - [x] 添加 react-query 依赖
  - [x] 更新 peerDependencies（react, react-dom）

- [x] Task 3.2: 更新 ui-react 的类型导入

  - [x] 修改 packages/ui-react/src/index.tsx
  - [x] 移除从 @seedar/ui-core 导入的图表类型（BaseChartProps, LineChartProps, BarChartProps, PieChartProps）
  - [x] 从 @seedar/ui-core 导入 API 相关类型（ApiResponse, ApiConfig, RequestOptions）
  - [x] 从 @seedar/ui-core 导入业务类型（DatasetResponse, QueryResponse 等）
  - [x] 在 ui-react 包中重新定义图表相关类型

- [x] Task 3.3: 创建图表类型定义

  - [x] 创建 packages/ui-react/src/types/chart.ts
  - [x] 定义 BaseChartProps 接口（包含 data, width, height, theme, padding）
  - [x] 定义 LineChartProps 接口（继承 BaseChartProps，添加 xField, yField, seriesName）
  - [x] 定义 BarChartProps 接口（继承 BaseChartProps，添加 xField, yField, seriesName）
  - [x] 定义 PieChartProps 接口（继承 BaseChartProps，添加 categoryField, valueField）
  - [x] 定义 ChartData 类型
  - [x] 定义 ChartSize 类型

- [x] Task 3.4: 创建 API Hooks

  - [x] 创建 packages/ui-react/src/hooks/useApi.ts
  - [x] 实现 useDatasourceApi hook（封装 ApiClient.datasource）
  - [x] 实现 useDatasetApi hook（封装 ApiClient.dataset）
  - [x] 实现 useQueryApi hook（封装 ApiClient.query）
  - [x] 所有 hooks 支持错误处理和加载状态

- [x] Task 3.5: 创建 React Query Hooks

  - [x] 创建 packages/ui-react/src/hooks/useDatasource.ts
  - [x] 实现 useDatasources hook（使用 useQuery 获取数据源列表）
  - [x] 实现 useDatasource hook（使用 useQuery 获取单个数据源）
  - [x] 实现 useCreateDatasource hook（使用 useMutation 创建数据源）
  - [x] 实现 useUpdateDatasource hook（使用 useMutation 更新数据源）
  - [x] 实现 useDeleteDatasource hook（使用 useMutation 删除数据源）

- [x] Task 3.6: 创建 Dataset React Query Hooks

  - [x] 创建 packages/ui-react/src/hooks/useDataset.ts
  - [x] 实现 useDatasets hook（使用 useQuery 获取数据集列表）
  - [x] 实现 useDataset hook（使用 useQuery 获取单个数据集）
  - [x] 实现 useCreateDataset hook（使用 useMutation 创建数据集）
  - [x] 实现 useUpdateDataset hook（使用 useMutation 更新数据集）
  - [x] 实现 useDeleteDataset hook（使用 useMutation 删除数据集）

- [x] Task 3.7: 创建 Query React Query Hooks

  - [x] 创建 packages/ui-react/src/hooks/useQuery.ts
  - [x] 实现 useQueries hook（使用 useQuery 获取查询列表）
  - [x] 实现 useQuery hook（使用 useQuery 获取单个查询）
  - [x] 实现 useCreateQuery hook（使用 useMutation 创建查询）
  - [x] 实现 useUpdateQuery hook（使用 useMutation 更新查询）
  - [x] 实现 useDeleteQuery hook（使用 useMutation 删除查询）
  - [x] 实现 useExecuteQuery hook（使用 useMutation 执行查询）

- [x] Task 3.8: 更新图表组件的类型引用

  - [x] 修改 packages/ui-react/src/components/charts/LineChart.tsx
  - [x] 从本地 types/chart.ts 导入 LineChartProps
  - [x] 更新组件实现以使用新的类型
  - [x] 修改 packages/ui-react/src/components/charts/BarChart.tsx
  - [x] 从本地 types/chart.ts 导入 BarChartProps
  - [x] 更新组件实现以使用新的类型
  - [x] 修改 packages/ui-react/src/components/charts/PieChart.tsx
  - [x] 从本地 types/chart.ts 导入 PieChartProps
  - [x] 更新组件实现以使用新的类型

- [x] Task 3.9: 更新 ui-react 的主入口文件

  - [x] 修改 packages/ui-react/src/index.tsx
  - [x] 导出所有图表组件
  - [x] 导出 ChartContainer 组件
  - [x] 导出所有 API hooks（useApi.ts）
  - [x] 导出所有 React Query hooks（useDatasource.ts, useDataset.ts, useQuery.ts）
  - [x] 导出所有图表类型（从 types/chart.ts）
  - [x] 导出 @seedar/ui-core 的类型和工具

- [x] Task 3.10: 测试 ui-react 包的类型检查
  - [x] 运行 pnpm install 安装依赖
  - [x] 运行 TypeScript 类型检查
  - [x] 验证所有类型导出正确
  - [x] 验证组件和 hooks 的类型正确

## 阶段 4：验证和测试

- [x] Task 4.1: 验证 @seedar/types 包

  - [x] 验证包能正常构建
  - [x] 验证所有类型能正确导出
  - [x] 验证类型定义文件生成正确
  - [x] 验证包能被其他包正确引用

- [x] Task 4.2: 验证 ui-core 包

  - [x] 验证包不再依赖 @visactor/vchart
  - [x] 验证包依赖 @seedar/types
  - [x] 验证 ApiClient 类能正常初始化
  - [x] 验证所有 API 方法能正常调用
  - [x] 验证错误处理机制正常工作
  - [x] 验证响应解析选项正常工作
  - [x] 验证数据处理工具正常工作
  - [x] 验证格式化工具正常工作

- [x] Task 4.3: 验证 ui-react 包

  - [x] 验证包依赖 @seedar/ui-core
  - [x] 验证包依赖 react-query
  - [x] 验证图表组件能正常渲染
  - [x] 验证 API hooks 能正常工作
  - [x] 验证 React Query hooks 能正常工作
  - [x] 验证类型导出正确

- [x] Task 4.4: 集成测试

  - [x] 在 web-client 中测试 ui-core 的 API 调用
  - [x] 在 web-client 中测试 ui-react 的组件
  - [x] 在 web-client 中测试 React Query hooks
  - [x] 验证开发环境热更新正常
  - [x] 验证生产构建正常

- [x] Task 4.5: 文档更新
  - [x] 更新 ui-core 包的 README（如果存在）
  - [x] 更新 ui-react 包的 README（如果存在）
  - [x] 更新项目的整体架构文档

## Task Dependencies

- [Task 1.1] 依赖于 []
- [Task 1.2] 依赖于 [Task 1.1]
- [Task 1.3] 依赖于 [Task 1.1]
- [Task 1.4] 依赖于 [Task 1.1, Task 1.2, Task 1.3]
- [Task 1.5] 依赖于 [Task 1.1, Task 1.2, Task 1.3]
- [Task 1.6] 依赖于 [Task 1.1, Task 1.2, Task 1.3]
- [Task 1.7] 依赖于 [Task 1.1, Task 1.2, Task 1.3]
- [Task 1.8] 依赖于 [Task 1.4, Task 1.5, Task 1.6, Task 1.7]
- [Task 1.9] 依赖于 [Task 1.2, Task 1.3, Task 1.8]

- [Task 2.1] 依赖于 [Task 1.9]
- [Task 2.2] 依赖于 [Task 2.1]
- [Task 2.3] 依赖于 [Task 2.1]
- [Task 2.4] 依赖于 [Task 2.2, Task 2.3]
- [Task 2.5] 依赖于 [Task 2.4]
- [Task 2.6] 依赖于 [Task 2.4]
- [Task 2.7] 依赖于 [Task 2.4]
- [Task 2.8] 依赖于 [Task 2.5, Task 2.6, Task 2.7]
- [Task 2.9] 依赖于 [Task 2.2]
- [Task 2.10] 依赖于 [Task 2.3]
- [Task 2.11] 依赖于 [Task 2.3]
- [Task 2.12] 依赖于 [Task 2.3]
- [Task 2.13] 依赖于 [Task 2.8, Task 2.9, Task 2.10, Task 2.11, Task 2.12]
- [Task 2.14] 依赖于 [Task 2.13]

- [Task 3.1] 依赖于 [Task 2.14]
- [Task 3.2] 依赖于 [Task 3.1]
- [Task 3.3] 依赖于 [Task 3.2]
- [Task 3.4] 依赖于 [Task 3.2]
- [Task 3.5] 依赖于 [Task 3.4]
- [Task 3.6] 依赖于 [Task 3.4]
- [Task 3.7] 依赖于 [Task 3.4]
- [Task 3.8] 依赖于 [Task 3.3]
- [Task 3.9] 依赖于 [Task 3.5, Task 3.6, Task 3.7, Task 3.8]
- [Task 3.10] 依赖于 [Task 3.9]

- [Task 4.1] 依赖于 [Task 1.9]
- [Task 4.2] 依赖于 [Task 2.14]
- [Task 4.3] 依赖于 [Task 3.10]
- [Task 4.4] 依赖于 [Task 4.1, Task 4.2, Task 4.3]
- [Task 4.5] 依赖于 [Task 4.4]
