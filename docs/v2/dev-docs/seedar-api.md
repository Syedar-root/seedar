# Seedar API 文档

## 1. 统一响应约定

后端通过全局响应拦截器包装成功响应，结构为：

```ts
{
  success: true,
  code: "SUCCESS",
  message: string,
  data: T
}
```

错误由全局异常过滤器包装，结构为：

```ts
{
  success: false,
  code: string,
  message: string,
  data: null
}
```

前端 `ApiClient` 默认会自动解包成功响应中的 `data`。

## 2. 数据源接口

前缀：`/datasource`

### 2.1 查询数据源列表

- 方法：`GET`
- 路径：`/datasource`
- 调用方：数据源列表页、下游选择器
- 返回：`DatasourceResponse[]`

### 2.2 查询单个数据源

- 方法：`GET`
- 路径：`/datasource/:id`
- 调用方：数据源详情页
- 返回：单个 `DatasourceResponse`
- 返回内容除了基础信息外，还包含表、列、外键信息

### 2.3 创建数据源

- 方法：`POST`
- 路径：`/datasource`
- 调用方：创建数据源弹窗
- 请求核心字段：
  - `name`
  - `type`
  - `config`

### 2.4 测试连接

- 方法：`POST`
- 路径：`/datasource/test-connection`
- 调用方：创建或编辑数据源表单
- 请求核心字段：
  - `type`
  - `config`
- 返回：
  - `success`
  - `message`

### 2.5 更新数据源

- 方法：`PATCH`
- 路径：`/datasource/:id`
- 调用方：数据源编辑流程
- 特征：
  - 若连接配置变化，会重新测试连接
  - 更新后会重新拉取表/列/外键信息

### 2.6 删除数据源

- 方法：`DELETE`
- 路径：`/datasource/:id`
- 调用方：列表页删除弹窗
- 行为：软删除

## 3. 数据集接口

前缀：`/dataset`

### 3.1 查询数据集列表

- 方法：`GET`
- 路径：`/dataset`
- 调用方：数据集列表页
- 返回：带完整细节的 `DatasetResponse[]`
- 特点：不是轻量列表，而是已经包含表、字段、指标、join

### 3.2 查询单个数据集

- 方法：`GET`
- 路径：`/dataset/:id`
- 调用方：详情页、编辑页
- 返回：完整 `DatasetResponse`

### 3.3 创建数据集

- 方法：`POST`
- 路径：`/dataset`
- 调用方：数据集多步骤编辑器
- 请求核心字段：
  - `name`
  - `datasourceId`
  - `datasourceTableIds`
  - `description`
  - `type`
  - `mainTableId?`
  - `fields?`
  - `joins?`

### 3.4 更新数据集

- 方法：`PATCH`
- 路径：`/dataset`
- 调用方：数据集编辑页
- 请求核心字段：
  - `dataSetId`
  - `name?`
  - `description?`
  - `fields?`
  - `metrics?`
  - `joins?`
  - `tables?`

### 3.5 删除数据集

- 方法：`DELETE`
- 路径：`/dataset/:id`
- 调用方：数据集列表页
- 删除限制：
  - 若存在 Query 依赖，会返回阻断错误

## 4. 查询接口

前缀：`/query`

### 4.1 查询 Query 列表

- 方法：`GET`
- 路径：`/query`
- 查询参数：
  - `status?`
- 调用方：面板编辑、可能的查询选择器

### 4.2 查询单个 Query

- 方法：`GET`
- 路径：`/query/:id`

### 4.3 创建 Query

- 方法：`POST`
- 路径：`/query`
- 请求核心字段：
  - `name`
  - `datasetId`
  - `dsl?`
  - `status?`

### 4.4 更新 Query

- 方法：`PATCH`
- 路径：`/query/:id`

### 4.5 删除 Query

- 方法：`DELETE`
- 路径：`/query/:id`

### 4.6 执行已保存 Query

- 方法：`POST`
- 路径：`/query/execute`
- 请求：

```ts
{
  queryId: string
}
```

- 返回重点：
  - `sql`
  - `results.header`
  - `results.rows`
  - `executionTime`
  - `columnMappings`

### 4.7 执行临时 Query

- 方法：`POST`
- 路径：`/query/temp`
- 请求：

```ts
{
  dsl: QueryDSL
}
```

- 用途：
  - 面板编辑时的即时预览

## 5. 面板接口

前缀：`/panel`

### 5.1 查询面板列表

- 方法：`GET`
- 路径：`/panel`

### 5.2 查询单个面板

- 方法：`GET`
- 路径：`/panel/:id`

### 5.3 创建面板

- 方法：`POST`
- 路径：`/panel`
- 请求核心字段：
  - `title`
  - `type`
  - `queryId`
  - `config`
  - `width`
  - `height`

### 5.4 更新面板

- 方法：`PATCH`
- 路径：`/panel/:id`

### 5.5 删除面板

- 方法：`DELETE`
- 路径：`/panel/:id`
- 特征：
  - 删除面板时会连带删除其关联 Query

## 6. 仪表盘接口

前缀：`/dashboard`

### 6.1 查询仪表盘列表

- 方法：`GET`
- 路径：`/dashboard`

### 6.2 查询单个仪表盘

- 方法：`GET`
- 路径：`/dashboard/:id`
- 返回重点：
  - 基础信息
  - layout
  - panelRelations

### 6.3 创建仪表盘

- 方法：`POST`
- 路径：`/dashboard`
- 请求核心字段：
  - `name`
  - `layout?`

### 6.4 更新仪表盘基础信息

- 方法：`PATCH`
- 路径：`/dashboard/:id`
- 当前典型用途：
  - 修改仪表盘名称

### 6.5 删除仪表盘

- 方法：`DELETE`
- 路径：`/dashboard/:id`

### 6.6 更新布局

- 方法：`PUT`
- 路径：`/dashboard/:id/layout`
- 请求体：`Layouts`
- 约束：
  - 布局中的所有 `panelId` 必须真实存在

### 6.7 添加面板到仪表盘

- 方法：`POST`
- 路径：`/dashboard/:id/panels`
- 请求：

```ts
{
  panelId: string
}
```

### 6.8 从仪表盘移除面板

- 方法：`DELETE`
- 路径：`/dashboard/:id/panels/:panelId`

## 7. AI 接口

前缀：`/v1/ai`

### 7.1 创建 AI 模型配置

- 方法：`POST`
- 路径：`/v1/ai`

### 7.2 查询 AI 模型列表

- 方法：`GET`
- 路径：`/v1/ai`
- 查询参数：
  - `page?`
  - `pageSize?`

### 7.3 查询单个 AI 模型

- 方法：`GET`
- 路径：`/v1/ai/:id`

### 7.4 更新 AI 模型

- 方法：`PATCH`
- 路径：`/v1/ai`

### 7.5 删除 AI 模型

- 方法：`DELETE`
- 路径：`/v1/ai/:id`

### 7.6 创建会话

- 方法：`POST`
- 路径：`/v1/ai/session`

### 7.7 流式聊天

- 方法：`POST`
- 路径：`/v1/ai/chat/stream`
- 传输方式：SSE
- 请求核心字段：
  - `aiId`
  - `message`
  - `sessionId?`
  - `mode`
  - `scenes?`
  - `isResume?`
  - `resumePayload?`

流事件类型包括：

- `ping`
- `session`
- `message`
- `done`
- `error`

### 7.8 生成字段业务名

- 方法：`POST`
- 路径：`/v1/ai/field-business-name`

## 8. 调用约束与注意事项

1. 前端默认假设后端返回统一包装；如果后端单独返回裸数据，会破坏 `ApiClient` 自动解包逻辑。
2. `/dataset` 的更新接口使用 `PATCH /dataset` 而不是 `PATCH /dataset/:id`，这一点和其他资源不同。
3. 面板预览通常依赖临时 Query 执行，因此问题定位时不要只看 `panel`，还要看 `query/temp`。
4. AI 聊天是流式接口，不适合用普通 REST 调用器等价替代。
