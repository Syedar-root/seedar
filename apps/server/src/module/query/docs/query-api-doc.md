# 查询模块 API 文档

## 概述

查询模块提供了对查询的完整生命周期管理，包括创建、查询、更新、删除和执行查询等功能。通过这些 API，您可以管理查询定义并执行数据查询操作。

## 接口列表

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 创建查询 | POST | /query | 创建新的查询定义 |
| 获取查询列表 | GET | /query | 获取查询列表，支持按状态过滤 |
| 获取查询详情 | GET | /query/:id | 获取单个查询的详细信息 |
| 更新查询 | PATCH | /query/:id | 更新查询定义 |
| 删除查询 | DELETE | /query/:id | 删除查询 |
| 执行查询 | POST | /query/execute | 执行指定的查询并返回结果 |

## 详细接口说明

### 1. 创建查询

**请求方法**: POST

**请求路径**: `/query`

**请求体**:

```json
{
  "name": "销售数据分析",
  "datasetId": 1,
  "dsl": {
    "datasetId": 1,
    "tableId": 1,
    "dimensions": [1, 2],
    "metrics": [
      {
        "id": 1,
        "alias": "销售额"
      }
    ],
    "filters": [
      {
        "fieldId": 3,
        "op": "=",
        "value": "2024"
      }
    ],
    "joins": [
      {
        "id": 1,
        "type": "left"
      }
    ]
  },
  "status": "draft"
}
```

**参数说明**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| name | string | 是 | 查询名称 |
| datasetId | number | 是 | 数据集ID |
| dsl | object | 否 | 查询DSL定义 |
| status | string | 否 | 查询状态（draft/active/stopped） |

**响应**:

```json
{
  "id": 1,
  "name": "销售数据分析",
  "datasetId": 1,
  "dsl": {...},
  "status": "draft",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 2. 获取查询列表

**请求方法**: GET

**请求路径**: `/query`

**查询参数**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| status | string | 否 | 过滤状态（draft/active/stopped） |

**响应**:

```json
[
  {
    "id": 1,
    "name": "销售数据分析",
    "datasetId": 1,
    "status": "draft",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### 3. 获取查询详情

**请求方法**: GET

**请求路径**: `/query/:id`

**路径参数**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| id | number | 是 | 查询ID |

**响应**:

```json
{
  "id": 1,
  "name": "销售数据分析",
  "datasetId": 1,
  "dsl": {...},
  "status": "draft",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 4. 更新查询

**请求方法**: PATCH

**请求路径**: `/query/:id`

**路径参数**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| id | number | 是 | 查询ID |

**请求体**:

```json
{
  "name": "销售数据分析（更新）",
  "dsl": {...},
  "status": "active"
}
```

**参数说明**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| name | string | 否 | 查询名称 |
| dsl | object | 否 | 查询DSL定义 |
| status | string | 否 | 查询状态 |

**响应**:

```json
{
  "id": 1,
  "name": "销售数据分析（更新）",
  "datasetId": 1,
  "dsl": {...},
  "status": "active",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### 5. 删除查询

**请求方法**: DELETE

**请求路径**: `/query/:id`

**路径参数**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| id | number | 是 | 查询ID |

**响应**:

- 成功: 200 OK (无响应体)
- 失败: 404 Not Found (查询不存在)

### 6. 执行查询

**请求方法**: POST

**请求路径**: `/query/execute`

**请求体**:

```json
{
  "queryId": 1
}
```

**参数说明**:

| 参数 | 类型 | 必填 | 描述 |
|------|------|------|------|
| queryId | number | 是 | 查询ID |

**响应**:

```json
{
  "sql": "SELECT ...",
  "results": {
    "header": ["日期", "销售额"],
    "rows": [
      ["2024-01-01", "10000"],
      ["2024-01-02", "15000"]
    ]
  },
  "executionTime": 150
}
```

**响应说明**:

| 字段 | 类型 | 描述 |
|------|------|------|
| sql | string | 生成的SQL语句 |
| results | object | 查询结果 |
| results.header | array | 结果表头 |
| results.rows | array | 结果数据行 |
| executionTime | number | 执行时间（毫秒） |

## 错误处理

| 错误码 | 描述 |
|--------|------|
| 404 | 查询不存在 |
| 400 | 请求参数错误 |
| 500 | 服务器内部错误 |

## 使用示例

### 创建并执行查询

1. **创建查询**:
   ```bash
   curl -X POST http://localhost:3000/query \
     -H "Content-Type: application/json" \
     -d '{"name": "测试查询", "datasetId": 1, "status": "active"}'
   ```

2. **执行查询**:
   ```bash
   curl -X POST http://localhost:3000/query/execute \
     -H "Content-Type: application/json" \
     -d '{"queryId": 1}'
   ```

### 获取查询列表

```bash
curl http://localhost:3000/query?status=active
```