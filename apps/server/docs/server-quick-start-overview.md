# Seedar 后端服务快速入门指南

## 1. 环境准备

### 1.1 基础要求

- Node.js 18.x 或更高版本
- pnpm 8.x 或更高版本
- MySQL 8.x 或 PostgreSQL 14.x（用于存储系统数据）

### 1.2 安装依赖

```bash
# 进入项目目录
cd d:\projects\seedar

# 安装根目录依赖
pnpm install

# 进入 server 目录
cd apps/server

# 安装 server 依赖
pnpm install
```

### 1.3 环境配置

在 `apps/server` 目录下创建 `.env` 文件：

```bash
# 复制示例配置
cp .env.example .env
```

配置项说明：

| 配置项 | 描述 | 示例值 |
|--------|------|--------|
| `PORT` | 服务端口 | `3000` |
| `NODE_ENV` | 运行环境 | `development` |
| `DB_HOST` | 数据库主机 | `localhost` |
| `DB_PORT` | 数据库端口 | `3306` |
| `DB_USERNAME` | 数据库用户名 | `root` |
| `DB_PASSWORD` | 数据库密码 | `password` |
| `DB_DATABASE` | 数据库名称 | `seedar` |

## 2. 启动服务

### 2.1 开发模式

```bash
cd apps/server
pnpm run start:dev
```

服务启动成功后，访问 http://localhost:3000

### 2.2 生产模式

```bash
cd apps/server
pnpm run build
pnpm run start:prod
```

## 3. 快速使用流程

### 3.1 第一步：创建数据源

使用 POST 请求创建数据源：

```bash
curl -X POST http://localhost:3000/datasource \
  -H "Content-Type: application/json" \
  -d '{
    "name": "MySQL数据库",
    "type": "mysql",
    "config": {
      "host": "localhost",
      "port": 3306,
      "database": "test_db",
      "username": "root",
      "password": "password"
    }
  }'
```

**支持的数据源类型**：
- `mysql`：MySQL 数据库
- `postgresql`：PostgreSQL 数据库
- `clickhouse`：ClickHouse 数据库
- `csv`：CSV 文件
- `excel`：Excel 文件

### 3.2 第二步：创建数据集

```bash
curl -X POST http://localhost:3000/dataset \
  -H "Content-Type: application/json" \
  -d '{
    "datasourceId": 1,
    "datasourceTableIds": [1, 2],
    "name": "销售数据集",
    "description": "用于销售数据分析",
    "mainTableId": 1,
    "fields": [
      {
        "tableId": 1,
        "dataSourceColumnId": 1,
        "name": "order_id",
        "businessName": "订单ID",
        "isPrimaryKey": true
      }
    ]
  }'
```

### 3.3 第三步：创建查询

```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "name": "月度销售查询",
    "datasetId": 1,
    "dsl": {
      "tableId": 1,
      "dimensions": ["month"],
      "metrics": ["sales_amount"]
    },
    "status": "ACTIVE"
  }'
```

### 3.4 第四步：执行查询

```bash
curl -X POST http://localhost:3000/query/execute \
  -H "Content-Type: application/json" \
  -d '{
    "queryId": 1
  }'
```

## 4. API 文档参考

- [API 总览文档](server-api-overview.md)
- [数据源模块 API 文档](module/datasource/docs/datasource-api-doc.md)
- [数据集模块 API 文档](module/dataset/docs/dataset-api-doc.md)
- [查询模块 API 文档](module/query/docs/query-api-doc.md)

## 5. 常用命令

| 命令 | 描述 |
|------|------|
| `pnpm run start:dev` | 启动开发服务器（热重载） |
| `pnpm run build` | 构建生产版本 |
| `pnpm run lint` | 代码检查和修复 |
| `pnpm run test` | 运行单元测试 |

## 6. 目录结构

```
apps/server/src/
├── main.ts                 # 应用入口
├── app.module.ts          # 根模块
├── config/                # 配置文件
│   ├── database.config.ts
│   └── logger.config.ts
├── logger/                # 日志模块
├── common/                # 公共模块
│   ├── global-exception.filter.ts
│   ├── global-logging.interceptor.ts
│   └── global-response.interceptor.ts
└── module/                # 功能模块
    ├── datasource/        # 数据源模块
    ├── dataset/           # 数据集模块
    └── query/             # 查询模块
```
