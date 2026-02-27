# 数据源模块 API 文档

## 接口列表

| 接口路径 | 方法 | 功能描述 |
|---------|------|----------|
| `/datasource` | `POST` | 创建数据源 |
| `/datasource/:id` | `GET` | 获取单个数据源详情 |
| `/datasource/:id` | `PATCH` | 更新数据源 |
| `/datasource/:id` | `DELETE` | 删除数据源 |

## 接口详情

### 1. 创建数据源

**接口路径**: `/datasource`
**请求方法**: `POST`

**请求参数**:

| 参数名 | 类型 | 必须 | 描述 |
|--------|------|------|------|
| `name` | `string` | 是 | 数据源名称 |
| `type` | `string` | 是 | 数据源类型 (mysql, postgres, clickhouse, csv, excel) |
| `config` | `object` | 是 | 数据源配置，根据类型不同而不同 |

**配置参数说明**:

#### MySQL 配置
| 参数名 | 类型 | 必须 | 默认值 | 描述 |
|--------|------|------|--------|------|
| `host` | `string` | 是 | - | 主机地址 |
| `port` | `string` | 否 | "3306" | 端口号 |
| `database` | `string` | 是 | - | 数据库名称 |
| `username` | `string` | 是 | - | 用户名 |
| `password` | `string` | 是 | - | 密码 |

#### PostgreSQL 配置
| 参数名 | 类型 | 必须 | 默认值 | 描述 |
|--------|------|------|--------|------|
| `host` | `string` | 是 | - | 主机地址 |
| `port` | `string` | 否 | "5432" | 端口号 |
| `database` | `string` | 是 | - | 数据库名称 |
| `username` | `string` | 是 | - | 用户名 |
| `password` | `string` | 是 | - | 密码 |

#### ClickHouse 配置
| 参数名 | 类型 | 必须 | 默认值 | 描述 |
|--------|------|------|--------|------|
| `host` | `string` | 是 | - | 主机地址 |
| `port` | `string` | 否 | "8123" | 端口号 |
| `database` | `string` | 是 | - | 数据库名称 |
| `username` | `string` | 是 | - | 用户名 |
| `password` | `string` | 是 | - | 密码 |

#### CSV 配置
| 参数名 | 类型 | 必须 | 默认值 | 描述 |
|--------|------|------|--------|------|
| `filePath` | `string` | 是 | - | 文件路径 |
| `delimiter` | `string` | 否 | "," | 分隔符 |
| `encoding` | `string` | 否 | "utf-8" | 编码格式 |

#### Excel 配置
| 参数名 | 类型 | 必须 | 默认值 | 描述 |
|--------|------|------|--------|------|
| `filePath` | `string` | 是 | - | 文件路径 |
| `sheetName` | `string` | 否 | - | 工作表名称 |

**请求示例**:

```json
{
  "name": "测试MySQL数据源",
  "type": "mysql",
  "config": {
    "host": "localhost",
    "port": "3306",
    "database": "test_db",
    "username": "root",
    "password": "123456"
  }
}
```

**响应示例**:

```json
{
  "id": 1,
  "name": "测试MySQL数据源",
  "type": "mysql",
  "config": {
    "host": "localhost",
    "port": "3306",
    "database": "test_db",
    "username": "root",
    "password": "123456"
  },
  "status": "active",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "tables": [],
  "foreignKeys": []
}
```

### 2. 获取单个数据源详情

**接口路径**: `/datasource/:id`
**请求方法**: `GET`

**路径参数**:
| 参数名 | 类型 | 必须 | 描述 |
|--------|------|------|------|
| `id` | `number` | 是 | 数据源ID |

**响应示例**:

```json
{
  "id": 1,
  "name": "测试MySQL数据源",
  "type": "mysql",
  "config": {
    "host": "localhost",
    "port": "3306",
    "database": "test_db",
    "username": "root",
    "password": "123456"
  },
  "status": "active",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z",
  "tables": [
    {
      "tableId": 1,
      "tableName": "users",
      "columns": [
        {
          "columnId": 1,
          "columnName": "id",
          "rawDataType": "int",
          "normalizedType": "number",
          "nullable": false,
          "isPrimaryKey": true
        },
        {
          "columnId": 2,
          "columnName": "name",
          "rawDataType": "varchar",
          "normalizedType": "string",
          "nullable": false,
          "isPrimaryKey": false
        }
      ]
    }
  ],
  "foreignKeys": [
    {
      "fkName": "fk_user_role",
      "sourceTableName": "users",
      "sourceColumnName": "role_id",
      "targetTableName": "roles",
      "targetColumnName": "id"
    }
  ]
}
```

### 3. 更新数据源

**接口路径**: `/datasource/:id`
**请求方法**: `PATCH`

**路径参数**:
| 参数名 | 类型 | 必须 | 描述 |
|--------|------|------|------|
| `id` | `number` | 是 | 数据源ID |

**请求参数**:
| 参数名 | 类型 | 必须 | 描述 |
|--------|------|------|------|
| `name` | `string` | 否 | 数据源名称 |
| `type` | `string` | 否 | 数据源类型 |
| `config` | `object` | 否 | 数据源配置 |

**请求示例**:

```json
{
  "name": "更新后的数据源名称",
  "config": {
    "host": "newhost",
    "port": "3306",
    "database": "test_db",
    "username": "root",
    "password": "654321"
  }
}
```

**响应示例**:

```json
{
  "id": 1,
  "name": "更新后的数据源名称",
  "type": "mysql",
  "config": {
    "host": "newhost",
    "port": "3306",
    "database": "test_db",
    "username": "root",
    "password": "654321"
  },
  "status": "active",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-02T00:00:00Z",
  "tables": [],
  "foreignKeys": []
}
```

### 4. 删除数据源

**接口路径**: `/datasource/:id`
**请求方法**: `DELETE`

**路径参数**:
| 参数名 | 类型 | 必须 | 描述 |
|--------|------|------|------|
| `id` | `number` | 是 | 数据源ID |

**响应示例**:

```json
{
  "message": "数据源删除成功"
}
```

## 错误响应

| 状态码 | 错误码 | 描述 |
|--------|--------|------|
| 400 | `DATASOURCE_CONFIG_INVALID` | 数据源配置无效 |
| 400 | `DATASOURCE_CONNECTION_FAILED` | 数据源连接失败 |
| 404 | `DATASOURCE_NOT_FOUND` | 数据源不存在 |
| 500 | `INTERNAL_SERVER_ERROR` | 服务器内部错误 |

## 注意事项

1. 所有数据库密码会在存储前进行加密处理
2. 创建和更新数据源时会自动测试连接
3. 数据源创建成功后会自动获取表结构和外键关系
4. 删除操作采用软删除方式