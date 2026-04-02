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

| 配置项        | 描述         | 示例值        |
| ------------- | ------------ | ------------- |
| `PORT`        | 服务端口     | `3000`        |
| `NODE_ENV`    | 运行环境     | `development` |
| `DB_HOST`     | 数据库主机   | `localhost`   |
| `DB_PORT`     | 数据库端口   | `3306`        |
| `DB_USERNAME` | 数据库用户名 | `root`        |
| `DB_PASSWORD` | 数据库密码   | `password`    |
| `DB_DATABASE` | 数据库名称   | `seedar`      |

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

### 3.5 第五步：创建仪表盘

#### 3.5.1 创建面板

```bash
curl -X POST http://localhost:3000/panel \
  -H "Content-Type: application/json" \
  -d '{
    "title": "销售趋势",
    "type": "chart",
    "queryId": 1,
    "config": {
      "chartType": "line",
      "xAxis": "month",
      "yAxis": "sales_amount"
    },
    "width": 6,
    "height": 4
  }'
```

**支持的面板类型**：

| 类型 | 描述 | 适用场景 |
|------|------|----------|
| `chart` | 图表面板 | 展示趋势和对比数据 |
| `table` | 表格面板 | 展示详细数据列表 |
| `text` | 文本面板 | 展示说明文字或静态内容 |
| `card` | 卡片面板 | 展示单个关键指标 |

#### 3.5.2 创建仪表盘

```bash
curl -X POST http://localhost:3000/dashboard \
  -H "Content-Type: application/json" \
  -d '{
    "name": "销售分析仪表盘"
  }'
```

#### 3.5.3 向仪表盘添加面板

```bash
curl -X POST http://localhost:3000/dashboard/1/panels \
  -H "Content-Type: application/json" \
  -d '{
    "panelId": 1
  }'
```

#### 3.5.4 更新仪表盘布局

```bash
curl -X PUT http://localhost:3000/dashboard/1/layout \
  -H "Content-Type: application/json" \
  -d '{
    "lg": [
      {
        "i": "1",
        "x": 0,
        "y": 0,
        "w": 6,
        "h": 4
      }
    ],
    "md": [
      {
        "i": "1",
        "x": 0,
        "y": 0,
        "w": 4,
        "h": 4
      }
    ]
  }'
```

**响应式布局断点**：

| 断点 | 描述 | 典型屏幕宽度 |
|------|------|-------------|
| `lg` | 大屏幕 | ≥1200px |
| `md` | 中等屏幕 | ≥996px |
| `sm` | 小屏幕 | ≥768px |
| `xs` | 超小屏幕 | ≥480px |
| `xxs` | 极小屏幕 | <480px |

## 4. API 文档参考

- [API 总览文档](server-api-overview.md)
- [数据源模块 API 文档](module/datasource/docs/datasource-api-doc.md)
- [数据集模块 API 文档](module/dataset/docs/dataset-api-doc.md)
- [查询模块 API 文档](module/query/docs/query-api-doc.md)
- [仪表盘模块 API 文档](module/dashboard/docs/dashboard-api-doc.md)

## 5. 常用命令

| 命令                 | 描述                     |
| -------------------- | ------------------------ |
| `pnpm run start:dev` | 启动开发服务器（热重载） |
| `pnpm run build`     | 构建生产版本             |
| `pnpm run lint`      | 代码检查和修复           |
| `pnpm run test`      | 运行单元测试             |

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
    ├── query/             # 查询模块
    └── dashboard/         # 仪表盘模块
```

## 7. 典型业务场景

### 7.1 创建销售分析仪表盘

1. 创建 MySQL 数据源连接到销售数据库
2. 创建销售数据集，选择订单表和产品表
3. 创建查询：月度销售趋势、产品销量排行
4. 创建仪表盘，添加图表面板展示趋势
5. 配置响应式布局，适配不同屏幕

### 7.2 创建实时监控仪表盘

1. 创建 ClickHouse 数据源连接到日志数据库
2. 创建日志数据集
3. 创建查询：实时访问量、错误统计
4. 创建仪表盘，添加卡片面板展示关键指标
5. 配置自动刷新

## 8. 常见问题

### 8.1 数据源连接失败

请检查：
- 数据库服务是否正常运行
- 连接配置是否正确
- 网络连接是否畅通
- 数据库用户权限是否足够

### 8.2 查询执行失败

请检查：
- DSL 定义是否正确
- 数据集字段是否存在
- 数据源连接是否正常

### 8.3 仪表盘布局更新失败

请检查：
- 布局 JSON 格式是否正确
- 布局中的面板 ID 是否存在
- 是否有面板重叠

更多问题参考 [FAQ 文档](server-faq-overview.md)

## 9. 下一步

- 了解 [业务逻辑文档](server-business-logic-overview.md)，深入理解模块工作原理
- 查看 [数据模型文档](server-data-model-overview.md)，了解数据结构设计
- 参考 [API 文档](server-api-overview.md)，获取完整的接口信息

---

> 【更新于 2026-03-15】：新增仪表盘模块快速入门步骤（第五步），包含创建面板、创建仪表盘、添加面板到仪表盘、更新布局等操作，新增响应式布局断点说明，新增典型业务场景示例，新增仪表盘相关常见问题。
