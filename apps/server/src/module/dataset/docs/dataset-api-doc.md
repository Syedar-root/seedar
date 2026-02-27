# 数据集模块 API 文档

## 接口列表

| 接口路径 | 方法 | 功能描述 |
|---------|------|---------|
| `/dataset` | POST | 创建新数据集 |
| `/dataset` | GET | 查询所有数据集（带完整信息） |
| `/dataset/:id` | GET | 根据 ID 查询单个数据集 |
| `/dataset` | PATCH | 更新数据集 |
| `/dataset/:id` | DELETE | 删除数据集 |

## 详细接口说明

### 1. 创建数据集

**接口路径**: `/dataset`
**请求方法**: POST
**请求体**: `CreateDatasetRequest`

#### 请求参数

| 字段名 | 类型 | 必选 | 描述 |
|--------|------|------|------|
| `datasourceId` | number | 是 | 数据源 ID |
| `datasourceTableIds` | number[] | 是 | 选中的数据表 ID 列表 |
| `name` | string | 是 | 数据集名称 |
| `description` | string | 否 | 数据集描述 |
| `mainTableId` | number | 否 | 主表 ID |
| `fields` | DatasetFieldDto[] | 是 | 数据集字段列表 |
| `joins` | DatasetJoinDto[] | 否 | 表关联关系列表 |

#### 响应格式

```json
{
  "id": 1,
  "name": "销售数据",
  "description": "销售业务数据集",
  "status": "active",
  "type": "semantic"
}
```

### 2. 查询所有数据集

**接口路径**: `/dataset`
**请求方法**: GET

#### 响应格式

```json
[
  {
    "id": 1,
    "name": "销售数据",
    "description": "销售业务数据集",
    "type": "semantic",
    "status": "active",
    "mainTableId": 1,
    "datasource": {
      "id": 1,
      "name": "MySQL 数据源",
      "type": "mysql"
    },
    "mainTable": {
      "id": 1,
      "tableName": "sales",
      "datasetName": "销售数据"
    },
    "tables": [
      {
        "id": 1,
        "datasourceTableId": 1,
        "tableName": "sales",
        "datasetName": "销售数据",
        "primaryFieldId": 1
      }
    ],
    "fields": [
      {
        "id": 1,
        "name": "id",
        "type": "number",
        "description": "销售 ID",
        "businessName": "销售ID",
        "isPrimaryKey": true,
        "tableId": 1,
        "tableName": "sales",
        "datasourceColumnId": 1
      }
    ],
    "metrics": [],
    "joins": []
  }
]
```

### 3. 查询单个数据集

**接口路径**: `/dataset/:id`
**请求方法**: GET
**路径参数**: `id` - 数据集 ID

#### 响应格式

```json
{
  "id": 1,
  "name": "销售数据",
  "description": "销售业务数据集",
  "type": "semantic",
  "status": "active",
  "mainTableId": 1,
  "datasource": {
    "id": 1,
    "name": "MySQL 数据源",
    "type": "mysql"
  },
  "mainTable": {
    "id": 1,
    "tableName": "sales",
    "datasetName": "销售数据"
  },
  "tables": [
    {
      "id": 1,
      "datasourceTableId": 1,
      "tableName": "sales",
      "datasetName": "销售数据",
      "primaryFieldId": 1
    }
  ],
  "fields": [
    {
      "id": 1,
      "name": "id",
      "type": "number",
      "description": "销售 ID",
      "businessName": "销售ID",
      "isPrimaryKey": true,
      "tableId": 1,
      "tableName": "sales",
      "datasourceColumnId": 1
    }
  ],
  "metrics": [],
  "joins": []
}
```

### 4. 更新数据集

**接口路径**: `/dataset`
**请求方法**: PATCH
**请求体**: `UpdateDatasetRequest`

#### 请求参数

| 字段名 | 类型 | 必选 | 描述 |
|--------|------|------|------|
| `dataSetId` | number | 是 | 数据集 ID |
| `name` | string | 否 | 数据集名称 |
| `description` | string | 否 | 数据集描述 |
| `fields` | DatasetFieldUpdateDto[] | 否 | 字段更新列表 |
| `metrics` | DatasetMetricUpdateDto[] | 否 | 指标更新列表 |
| `joins` | DatasetJoinUpdateDto[] | 否 | 关联关系更新列表 |
| `tables` | DatasetTableUpdateDto[] | 否 | 表更新列表 |

#### 响应格式

```json
{
  "id": 1,
  "name": "销售数据（更新）",
  "description": "更新后的销售业务数据集",
  "type": "semantic",
  "status": "active",
  "mainTableId": 1,
  "datasource": {
    "id": 1,
    "name": "MySQL 数据源",
    "type": "mysql"
  },
  "mainTable": {
    "id": 1,
    "tableName": "sales",
    "datasetName": "销售数据"
  },
  "tables": [
    {
      "id": 1,
      "datasourceTableId": 1,
      "tableName": "sales",
      "datasetName": "销售数据",
      "primaryFieldId": 1
    }
  ],
  "fields": [
    {
      "id": 1,
      "name": "id",
      "type": "number",
      "description": "销售 ID",
      "businessName": "销售ID",
      "isPrimaryKey": true,
      "tableId": 1,
      "tableName": "sales",
      "datasourceColumnId": 1
    }
  ],
  "metrics": [],
  "joins": []
}
```

### 5. 删除数据集

**接口路径**: `/dataset/:id`
**请求方法**: DELETE
**路径参数**: `id` - 数据集 ID

#### 响应格式

```json
"This action removes a #1 dataset"
```

## 数据结构定义

### CreateDatasetRequest

| 字段名 | 类型 | 描述 |
|--------|------|------|
| `datasourceId` | number | 数据源 ID |
| `datasourceTableIds` | number[] | 选中的数据表 ID 列表 |
| `name` | string | 数据集名称 |
| `description` | string | 数据集描述 |
| `mainTableId` | number | 主表 ID |
| `fields` | DatasetFieldDto[] | 数据集字段列表 |
| `joins` | DatasetJoinDto[] | 表关联关系列表 |

### UpdateDatasetRequest

| 字段名 | 类型 | 描述 |
|--------|------|------|
| `dataSetId` | number | 数据集 ID |
| `name` | string | 数据集名称 |
| `description` | string | 数据集描述 |
| `fields` | DatasetFieldUpdateDto[] | 字段更新列表 |
| `metrics` | DatasetMetricUpdateDto[] | 指标更新列表 |
| `joins` | DatasetJoinUpdateDto[] | 关联关系更新列表 |
| `tables` | DatasetTableUpdateDto[] | 表更新列表 |

### DatasetFieldDto

| 字段名 | 类型 | 描述 |
|--------|------|------|
| `tableId` | number | 表 ID |
| `dataSourceColumnId` | number | 数据源列 ID |
| `name` | string | 字段名称 |
| `description` | string | 字段描述 |
| `businessName` | string | 业务名称 |
| `isPrimaryKey` | boolean | 是否为主键 |

### DatasetJoinDto

| 字段名 | 类型 | 描述 |
|--------|------|------|
| `leftTableId` | number | 左表 ID |
| `rightTableId` | number | 右表 ID |
| `leftColumnId` | number | 左表列 ID |
| `rightColumnId` | number | 右表列 ID |
| `joinType` | string | 连接类型 |
