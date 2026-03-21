# 临时查询功能实现计划

## 需求概述

在 `query` 模块新增一个临时查询接口 `POST /query/temp`，允许用户直接传入 DSL，通过 metric-engine 生成 SQL 并执行查询，不落库保存。

## 需求确认

| 项目 | 确认内容 |
|------|----------|
| DSL 结构 | 复用现有 `QueryDSL` 结构 |
| 查询记录 | 纯执行不落库 |
| 返回格式 | 复用 `ExecuteQueryResponse` |
| 接口路径 | `POST /query/temp` |

## 实现步骤

### 步骤 1：新增请求 DTO

**文件**: `d:\Program\projects\seedar\apps\server\src\module\query\dto\execute-temp-query.request.ts`

创建临时查询请求 DTO：
- 引入 `class-validator` 装饰器进行参数校验
- 接收 `dsl` 字段，类型为 `QueryDSL`
- 使用 `@ValidateNested()` 和 `@Type()` 进行嵌套对象验证

### 步骤 2：修改 QueryService

**文件**: `d:\Program\projects\seedar\apps\server\src\module\query\query.service.ts`

#### 2.1 添加类型导入
- 添加 `QueryDSL` 类型导入

#### 2.2 重构 execute 方法
- 将现有 `execute` 方法的核心执行逻辑抽取为私有方法 `executeDSL(dsl: QueryDSL, datasetId: number)`
- `execute` 方法调用 `executeDSL` 完成查询

#### 2.3 新增 executeTemp 方法
- 接收 `dsl` 参数
- 直接调用 `executeDSL(dsl, dsl.datasetId)` 执行查询
- 不保存任何记录到数据库

### 步骤 3：修改 QueryController

**文件**: `d:\Program\projects\seedar\apps\server\src\module\query\query.controller.ts`

#### 3.1 添加导入
- 导入 `ExecuteTempQueryRequest`

#### 3.2 新增接口
- 路由: `@Post('temp')`
- 方法: `executeTemp(@Body() executeTempQueryRequest: ExecuteTempQueryRequest)`
- 调用 `queryService.executeTemp(executeTempQueryRequest.dsl)`

### 步骤 4：验证

- 运行 TypeScript 类型检查，确保无编译错误
- 检查代码风格一致性

## 文件变更清单

| 操作 | 文件路径 |
|------|----------|
| 新增 | `dto/execute-temp-query.request.ts` |
| 修改 | `query.service.ts` |
| 修改 | `query.controller.ts` |

## 接口设计

### 请求示例

```http
POST /query/temp
Content-Type: application/json

{
  "dsl": {
    "datasetId": 1,
    "tableId": 1,
    "dimensions": [{ "fieldId": 1, "alias": "日期" }],
    "metrics": [{ "id": 1, "alias": "销售额" }],
    "filters": [{ "fieldId": 2, "op": "eq", "value": "2024" }],
    "limit": 100
  }
}
```

### 响应示例

```json
{
  "sql": "SELECT `date` AS `日期`, SUM(amount) AS `销售额` FROM sales WHERE year = ? LIMIT 100",
  "results": {
    "header": ["日期", "销售额"],
    "rows": [["2024-01", "10000"], ["2024-02", "12000"]]
  },
  "executionTime": 45
}
```

## 执行流程

```
用户请求 → Controller 接收 DSL → Service.executeTemp()
    ↓
DatasetService.findOne(datasetId) → 获取数据集元信息
    ↓
DatasourceRepository.findOne() → 获取数据源配置
    ↓
DSLTransformer.transform() → 转换 DSL 为 metric-engine Query
    ↓
KnexSQLGenerator.generateSQLWithBindings() → 生成 SQL
    ↓
执行 SQL → 返回结果
```
