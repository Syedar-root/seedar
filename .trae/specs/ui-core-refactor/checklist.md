# Checklist

## 阶段 1：创建共享类型包

- [x] @seedar/types 包目录结构创建完成
- [x] @seedar/types 的 package.json 配置正确
- [x] @seedar/types 的 tsconfig.json 配置正确
- [x] datasource 相关类型从 server 正确导出
- [x] dataset 相关类型从 server 正确导出
- [x] query 相关类型从 server 正确导出
- [x] 通用类型定义完成
- [x] @seedar/types 主入口文件导出所有类型
- [x] @seedar/types 包能成功构建
- [x] @seedar/types 类型检查通过

## 阶段 2：重构 ui-core 包

- [x] ui-core 包的图表相关代码已清理
- [x] ui-core 的 package.json 已更新（移除 @visactor/vchart，添加 @seedar/types 和 axios）
- [x] ui-core 的目录结构已创建（api, types, utils, config）
- [x] ApiClient 类实现完成
- [x] ApiClient.init() 方法实现完成
- [x] ApiClient 的 HTTP 方法（get, post, put, patch, delete）实现完成
- [x] 响应解析逻辑实现完成（支持 autoParseResponse 选项）
- [x] 错误处理逻辑实现完成（支持全局和单个错误处理）
- [x] 错误处理优先级机制实现完成（单个 > 全局）
- [x] Datasource API 实现完成
- [x] Dataset API 实现完成
- [x] Query API 实现完成
- [x] 所有 API 方法支持可选的 onError 回调
- [x] ui-core 的类型导出配置完成（从 @seedar/types 重新导出）
- [x] 数据处理工具增强完成（添加 filterData, sortData, groupData, aggregateData, paginateData）
- [x] 格式化工具增强完成（添加 formatDate, formatCurrency, formatBytes, formatDuration）
- [x] 配置管理模块创建完成
- [x] ui-core 的主入口文件导出正确
- [x] ui-core 包类型检查通过

## 阶段 3：更新 ui-react 包

- [x] ui-react 的 package.json 已更新（添加 react-query 依赖）
- [x] ui-react 的类型导入已更新（移除从 ui-core 导入的图表类型）
- [x] ui-react 的图表类型定义完成（BaseChartProps, LineChartProps, BarChartProps, PieChartProps）
- [x] API Hooks 实现完成（useDatasourceApi, useDatasetApi, useQueryApi）
- [x] Datasource React Query Hooks 实现完成（useDatasources, useDatasource, useCreateDatasource, useUpdateDatasource, useDeleteDatasource）
- [x] Dataset React Query Hooks 实现完成（useDatasets, useDataset, useCreateDataset, useUpdateDataset, useDeleteDataset）
- [x] Query React Query Hooks 实现完成（useQueries, useQuery, useCreateQuery, useUpdateQuery, useDeleteQuery, useExecuteQuery）
- [x] 图表组件的类型引用已更新（使用本地 types/chart.ts）
- [x] ui-react 的主入口文件导出正确
- [x] ui-react 包类型检查通过

## 阶段 4：验证和测试

- [x] @seedar/types 包构建成功
- [x] @seedar/types 所有类型正确导出
- [x] @seedar/types 类型定义文件生成正确
- [x] @seedar/types 能被其他包正确引用
- [x] ui-core 不再依赖 @visactor/vchart
- [x] ui-core 依赖 @seedar/types
- [x] ApiClient 能正常初始化
- [x] 所有 API 方法能正常调用
- [x] 错误处理机制正常工作
- [x] 响应解析选项正常工作
- [x] 数据处理工具正常工作
- [x] 格式化工具正常工作
- [x] ui-react 依赖 @seedar/ui-core
- [x] ui-react 依赖 react-query
- [x] 图表组件能正常渲染
- [x] API hooks 能正常工作
- [x] React Query hooks 能正常工作
- [x] ui-react 类型导出正确
- [x] web-client 中 ui-core 的 API 调用正常
- [x] web-client 中 ui-react 的组件正常
- [x] web-client 中 React Query hooks 正常
- [x] 开发环境热更新正常
- [x] 生产构建正常
- [x] 相关文档已更新

## 需求验证

### Requirement: 共享类型包

- [ ] server 的 DTO 和 Entity 类型能被 @seedar/types 包导出
- [ ] ui-core 能引用 @seedar/types 的类型
- [ ] ui-react 能引用 @seedar/types 的类型

### Requirement: API 客户端

- [ ] ApiClient.init() 能配置 baseURL、autoParseResponse、globalOnError 等参数
- [ ] 配置能全局生效
- [ ] ApiClient.datasource.findAll() 等方法能返回正确类型的数据
- [ ] API 调用支持可选的 onError 回调

### Requirement: 错误处理机制

- [ ] API 调用失败时，单个 API 的 onError 优先执行
- [ ] 单个回调中提供全局回调引用
- [ ] 应用侧能决定是否调用全局回调
- [ ] 仅配置全局错误处理时，执行 globalOnError

### Requirement: 响应处理选项

- [ ] autoParseResponse 为 true 时，自动解析响应格式并只返回 data
- [ ] autoParseResponse 为 false 时，返回完整响应对象

### Requirement: 数据处理工具

- [ ] validateData(data) 能返回数据是否有效的布尔值
- [ ] transformData(data, mapping) 能根据映射规则转换数据字段
- [ ] filterData(data, predicate) 能过滤数据
- [ ] sortData(data, key, order) 能排序数据
- [ ] groupData(data, key) 能分组数据
- [ ] aggregateData(data, key, aggregator) 能聚合数据
- [ ] paginateData(data, page, pageSize) 能分页数据

### Requirement: 格式化工具

- [ ] formatNumber(value, decimals) 能格式化数字
- [ ] formatPercent(value, decimals) 能格式化百分比
- [ ] formatDate(date, format) 能格式化日期
- [ ] formatCurrency(value, currency, decimals) 能格式化货币
- [ ] formatBytes(bytes, decimals) 能格式化字节
- [ ] formatDuration(seconds) 能格式化时长

### Requirement: ui-core 包职责

- [ ] ui-core 的 package.json 不包含 @visactor/vchart 依赖
- [ ] ui-core 不包含图表相关类型定义
- [ ] ui-core 不依赖 React、Vue 或其他前端框架
- [ ] ui-core 能在任何 JavaScript/TypeScript 环境中使用

### Requirement: ui-react 包职责

- [ ] ui-react 的 package.json 依赖 @seedar/ui-core
- [ ] ui-react 使用 ui-core 提供的 API 客户端
- [ ] ui-react 支持使用 react-query 进行状态管理
- [ ] ui-react 提供对应的 hooks
