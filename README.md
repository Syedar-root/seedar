# Seedar

Seedar 是一个基于 AI 的数据分析与可视化平台，支持多数据源连接、语义化数据集建模、智能查询、仪表盘搭建和 AI 对话分析。

## 技术栈

- **前端**：React 18 + Vite + TypeScript + Tailwind CSS + Ant Design X
- **后端**：NestJS + TypeORM + MySQL/PostgreSQL
- **AI 能力**：LangChain + LangGraph + 多模型支持（OpenAI / DeepSeek / Anthropic）
- **查询引擎**：自研 Metric DSL → SQL 生成引擎
- **部署**：Docker + Docker Compose

## 环境要求

- [Node.js](https://nodejs.org/) >= 18（仅开发模式需要）
- [pnpm](https://pnpm.io/) >= 8（仅开发模式需要）
- [Docker](https://www.docker.com/) + Docker Compose（生产部署需要）
- MySQL 8.x 或 PostgreSQL（由 Docker Compose 自动启动）

## 快速部署（推荐）

无需克隆源码，一键部署 Seedar：

```bash
npx @syedar/seedar-cli@latest install
```

部署完成后访问 `http://localhost:8090`（默认）即可使用。

### 常用 CLI 命令

```bash
seedar update        # 更新到最新版本
seedar status        # 查看运行状态
seedar logs server   # 查看服务端日志
seedar doctor        # 诊断环境问题
seedar uninstall     # 卸载
```

### 运行时文件位置

- Linux/macOS：`~/.seedar`
- Windows：`%USERPROFILE%\.seedar`

目录结构：

```
~/.seedar/
├── docker-compose.yml   # 运行时编排配置
├── .env                 # 环境变量
├── data/                # MySQL 数据持久化
├── logs/                # 服务日志
└── backups/             # 数据备份
```

## 开发模式

如果需要定制开发或二次开发，可以从源码启动。

### 1. 克隆仓库

```bash
git clone https://github.com/Syedar-root/seedar.git
cd seedar
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

```bash
cp apps/server/.env.production.example apps/server/.env.production
```

编辑 `apps/server/.env.production`，修改数据库连接等配置：

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=seedar
DB_PASSWORD=your_db_password
DB_DATABASE=seedar
PORT=3000
AES_SECRET=your_long_random_secret
```

### 4. 启动服务

```bash
# 同时启动前端和后端
pnpm dev

# 单独启动后端
pnpm dev:server

# 单独启动前端
pnpm dev:web
```

服务地址：

- 前端：http://localhost:5173
- 后端：http://localhost:3000

### 数据库迁移

```bash
cd apps/server

# 执行迁移
pnpm migration:run

# 生成迁移（修改实体后）
pnpm migration:generate

# 创建空迁移
pnpm migration:create

# 回滚上一次迁移
pnpm migration:revert
```

### 构建

```bash
# 构建所有工作区
pnpm build

# 仅构建后端
pnpm --filter server build

# 仅构建前端
pnpm --filter web-client build
```

### 测试

```bash
# 后端单元测试
pnpm --filter server test

# 后端测试（监听模式）
pnpm --filter server test:watch

# 后端 E2E 测试
pnpm --filter server test:e2e

# Metric 引擎测试
pnpm --filter @metric-engine/core test
```

## 从源码部署生产环境（Legacy）

如果你需要从源码构建并部署生产环境，可以使用 PowerShell 脚本：

```powershell
$env:SEEDAR_VERSION = "latest"
.\deploy\up-prod.ps1
```

前置条件：配置好 `apps/server/.env.production` 并安装 Docker。

## 项目结构

```
seedar/
├── apps/
│   ├── server/          # NestJS 后端服务
│   ├── web-client/      # React 前端应用
│   └── cli/             # Seedar CLI 部署工具
├── packages/
│   ├── types/           # 前后端共享类型定义
│   ├── ui-core/         # 前端 API SDK（基于 Axios）
│   ├── ui-react/        # 共享 React UI 组件
│   └── metric_engine/   # Metric DSL 与 SQL 生成引擎
├── deploy/              # Docker 部署模板与脚本
└── package.json         # pnpm workspace 根配置
```

## 主要功能模块

| 模块 | 说明 |
|------|------|
| **数据源 (Datasource)** | 连接 MySQL、PostgreSQL 等外部数据库，自动同步元数据 |
| **数据集 (Dataset)** | 基于数据源定义语义化数据集，支持表关联、字段配置、指标计算 |
| **查询 (Query)** | 使用可视化 DSL 或 AI 生成查询，底层自动转换为 SQL |
| **仪表盘 (Dashboard)** | 拖拽式面板布局，支持多种图表类型 |
| **AI 对话 (AI Chat)** | 基于 LangGraph 的智能分析助手，支持多轮对话、工具调用 |

## 贡献

请确保代码通过以下检查：

```bash
# 后端代码检查
pnpm --filter server lint

# 前端类型检查
pnpm typecheck:web

# CLI 类型检查
pnpm typecheck:cli
```

## 许可证

[MIT](LICENSE)
