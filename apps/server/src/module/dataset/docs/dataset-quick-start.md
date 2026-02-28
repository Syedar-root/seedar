# 数据集模块快速入门指南

## 模块介绍

数据集模块是系统中负责管理和处理数据模型的核心模块，主要提供数据集的创建、查询、更新和删除功能。该模块支持语义型和宽表型数据集，通过关联数据源和数据表，构建完整的数据模型。

## 环境准备

### 前置条件

- Node.js 16+ 环境
- NestJS 框架
- TypeORM ORM 框架
- 数据库（MySQL/PostgreSQL 等）
- 数据源模块已配置完成

### 依赖安装

```bash
# 安装项目依赖
npm install

# 启动开发服务器
npm run start:dev
```

## 核心概念

### 数据集（Dataset）

数据集是数据模型的核心实体，代表一个完整的数据集合，包含多个表、字段、指标和关联关系。

### 数据集表（DatasetTable）

代表数据集中包含的表，关联到数据源中的表。

### 数据集字段（DatasetField）

代表数据集中表的字段，关联到数据源表的列。

### 数据集关联关系（DatasetJoin）

代表数据集中表之间的关联关系。

### 数据集指标（DatasetMetric）

代表数据集中的指标，支持多种类型的指标计算。

## 快速开始

### 1. 创建数据集

**功能说明**：创建一个新的数据集，包含数据源验证、表选择、字段配置和关联关系设置。

**请求示例**：

```bash
POST /dataset
Content-Type: application/json

{
  "datasourceId": 1,
  "datasourceTableIds": [1, 2],
  "name": "销售数据",
  "description": "销售业务数据集",
  "mainTableId": 1,
  "fields": [
    {
      "tableId": 1,
      "dataSourceColumnId": 1,
      "name": "id",
      "description": "销售 ID",
      "businessName": "销售ID",
      "isPrimaryKey": true
    },
    {
      "tableId": 1,
      "dataSourceColumnId": 2,
      "name": "amount",
      "description": "销售金额",
      "businessName": "销售金额",
      "isPrimaryKey": false
    }
  ],
  "joins": [
    {
      "leftTableId": 1,
      "rightTableId": 2,
      "leftColumnId": 3,
      "rightColumnId": 1,
      "joinType": "inner"
    }
  ]
}
```

**响应示例**：

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

**功能说明**：查询所有数据集的完整信息，包括关联的表、字段、指标和关联关系。

**请求示例**：

```bash
GET /dataset
```

**响应示例**：

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

**功能说明**：根据 ID 查询单个数据集的完整信息。

**请求示例**：

```bash
GET /dataset/1
```

**响应示例**：

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

**功能说明**：更新数据集的基本信息和关联实体。

**请求示例**：

```bash
PATCH /dataset
Content-Type: application/json

{
  "dataSetId": 1,
  "name": "销售数据（更新）",
  "description": "更新后的销售业务数据集",
  "fields": [
    {
      "action": "addField",
      "data": {
        "tableId": 1,
        "dataSourceColumnId": 3,
        "name": "customer_id",
        "description": "客户 ID",
        "businessName": "客户ID",
        "isPrimaryKey": false
      }
    }
  ]
}
```

**响应示例**：

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
    },
    {
      "id": 2,
      "name": "customer_id",
      "type": "number",
      "description": "客户 ID",
      "businessName": "客户ID",
      "isPrimaryKey": false,
      "tableId": 1,
      "tableName": "sales",
      "datasourceColumnId": 3
    }
  ],
  "metrics": [],
  "joins": []
}
```

### 5. 删除数据集

**功能说明**：删除指定 ID 的数据集。

**请求示例**：

```bash
DELETE /dataset/1
```

**响应示例**：

```json
"This action removes a #1 dataset"
```

## 常见操作示例

### 示例 1：创建包含多个表的数据集

**功能说明**：创建一个包含销售表、客户表和产品表的数据集。

**请求示例**：

```bash
POST /dataset
Content-Type: application/json

{
  "datasourceId": 1,
  "datasourceTableIds": [1, 2, 3],
  "name": "销售分析数据集",
  "description": "包含销售、客户和产品信息的数据集",
  "mainTableId": 1,
  "fields": [
    # 销售表字段
    {
      "tableId": 1,
      "dataSourceColumnId": 1,
      "name": "id",
      "description": "销售 ID",
      "businessName": "销售ID",
      "isPrimaryKey": true
    },
    {
      "tableId": 1,
      "dataSourceColumnId": 2,
      "name": "amount",
      "description": "销售金额",
      "businessName": "销售金额",
      "isPrimaryKey": false
    },
    {
      "tableId": 1,
      "dataSourceColumnId": 3,
      "name": "customer_id",
      "description": "客户 ID",
      "businessName": "客户ID",
      "isPrimaryKey": false
    },
    {
      "tableId": 1,
      "dataSourceColumnId": 4,
      "name": "product_id",
      "description": "产品 ID",
      "businessName": "产品ID",
      "isPrimaryKey": false
    },
    # 客户表字段
    {
      "tableId": 2,
      "dataSourceColumnId": 5,
      "name": "id",
      "description": "客户 ID",
      "businessName": "客户ID",
      "isPrimaryKey": true
    },
    {
      "tableId": 2,
      "dataSourceColumnId": 6,
      "name": "name",
      "description": "客户名称",
      "businessName": "客户名称",
      "isPrimaryKey": false
    },
    # 产品表字段
    {
      "tableId": 3,
      "dataSourceColumnId": 7,
      "name": "id",
      "description": "产品 ID",
      "businessName": "产品ID",
      "isPrimaryKey": true
    },
    {
      "tableId": 3,
      "dataSourceColumnId": 8,
      "name": "name",
      "description": "产品名称",
      "businessName": "产品名称",
      "isPrimaryKey": false
    }
  ],
  "joins": [
    # 销售表与客户表关联
    {
      "leftTableId": 1,
      "rightTableId": 2,
      "leftColumnId": 3,
      "rightColumnId": 5,
      "joinType": "inner"
    },
    # 销售表与产品表关联
    {
      "leftTableId": 1,
      "rightTableId": 3,
      "leftColumnId": 4,
      "rightColumnId": 7,
      "joinType": "inner"
    }
  ]
}
```

### 示例 2：更新数据集指标

**功能说明**：向现有数据集添加销售总额指标。

**请求示例**：

```bash
PATCH /dataset
Content-Type: application/json

{
  "dataSetId": 1,
  "metrics": [
    {
      "action": "addMetric",
      "data": {
        "name": "sales_total",
        "description": "销售总额",
        "businessName": "销售总额",
        "metricType": "aggregate",
        "dataSourceColumnId": 2,
        "aggregateFunction": "sum",
        "distinct": false
      }
    }
  ]
}
```

## 开发指南

### 目录结构

```
dataset/
├── dto/                  # 数据传输对象
│   ├── create-dataset.request.ts
│   ├── dataset-field.dto.ts
│   ├── dataset-join.dto.ts
│   ├── entity-action.request.ts
│   └── update-dataset.req.ts
├── entities/             # 数据库实体
│   ├── dataset.entity.ts
│   ├── dataset-field.entity.ts
│   ├── dataset-join.entity.ts
│   ├── dataset-metric.entity.ts
│   ├── dataset-table.entity.ts
│   └── wide-table-config.entity.ts
├── services/             # 业务逻辑
│   ├── dataset.service.ts
│   └── helper/           # 辅助工具
│       └── dataset.helper.ts
├── dataset.controller.ts # 控制器
├── dataset.module.ts     # 模块定义
└── dataset.types.ts      # 类型定义
```

### 核心服务

#### DatasetService

主要提供以下功能：
- `create()`: 创建数据集
- `findAllWithDetails()`: 查询所有数据集（带完整信息）
- `findOne()`: 根据 ID 查询单个数据集
- `update()`: 更新数据集
- `remove()`: 删除数据集

### 开发建议

1. **使用事务**：创建和更新操作应使用事务确保数据一致性
2. **批量查询**：使用 `In` 查询和分组操作减少数据库查询次数
3. **错误处理**：使用 `ExceptionFactory` 统一处理错误
4. **管理器模式**：使用管理器模式处理不同类型的实体操作

## 故障排除

### 常见错误

1. **数据源不存在**
   - 错误信息：`数据源不存在`
   - 解决方案：确保请求中的 `datasourceId` 对应的数据源存在

2. **部分数据表不存在**
   - 错误信息：`部分数据表不存在`
   - 解决方案：确保请求中的 `datasourceTableIds` 列表中的所有表都存在

3. **数据集字段不能为空**
   - 错误信息：`数据集字段不能为空，必须包含至少一个字段`
   - 解决方案：确保请求中包含字段列表，且至少有一个字段

4. **主键字段必须包含**
   - 错误信息：`表 "{tableName}" 的主键字段必须包含在数据集中`
   - 解决方案：确保每个表的主键字段都包含在数据集中

5. **数据源没有外键关系**
   - 错误信息：`数据源没有外键关系，需要配置表之间的关联关系`
   - 解决方案：手动配置表之间的关联关系，或确保数据源有外键关系

### 调试技巧

1. **日志输出**：使用 `console.log()` 输出关键信息
2. **数据库查询**：检查数据库中的数据是否正确
3. **API 测试**：使用 Postman 或其他 API 测试工具测试接口
4. **错误信息**：仔细阅读错误信息，定位问题所在

## 总结

本快速入门指南介绍了数据集模块的核心功能和使用方法，包括数据集的创建、查询、更新和删除操作。通过本指南，您应该能够快速上手使用数据集模块，构建和管理数据模型。

如果您在使用过程中遇到任何问题，请参考故障排除部分，或联系开发团队获取帮助。