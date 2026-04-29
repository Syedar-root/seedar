# Seedar 快速开始

## 1. 适用场景

本文面向以下需求：

- 本地把前后端跑起来
- 快速验证核心业务链路
- 了解 CLI 与生产运行时入口

## 2. 环境要求

根据根目录 [package.json](/D:/Program/projects/seedar/package.json) 与各子包配置，可以确认：

- Node.js `>=18`
- pnpm `>=8`

按实际功能推断，建议额外具备：

- MySQL 8.x 或可访问的开发数据库
- 可选：Docker / Docker Compose，用于 CLI 与部署模板验证

## 3. 安装依赖

在仓库根目录执行：

```bash
pnpm install
```

## 4. 主要启动方式

### 4.1 前端开发

```bash
pnpm dev:web
```

对应脚本：

- 根目录 `pnpm --filter web-client run start:dev`
- 实际由 `vite` 启动

### 4.2 后端开发

```bash
pnpm dev:server
```

对应脚本：

- 根目录 `pnpm --filter server run start:dev`
- 实际由 Nest watch 模式启动

### 4.3 不推荐直接用的全量开发命令

根脚本还提供：

```bash
pnpm dev
```

它会递归并行执行所有 workspace 的 `start:dev`，在当前仓库里可读性较差，也更容易把无关包一起带起来。日常开发更建议分别启动前后端。

## 5. 本地配置说明

### 5.1 后端环境文件加载顺序

后端 `ConfigModule` 会按顺序读取：

1. `.env.${NODE_ENV}`
2. `.env.local`
3. `.env`

### 5.2 后端数据库默认值

根据 [database.config.ts](/D:/Program/projects/seedar/apps/server/src/config/database.config.ts)，未显式配置时默认：

- `DB_HOST=localhost`
- `DB_PORT=3305`
- `DB_USERNAME=root`
- `DB_DATABASE=seedar_db`

注意：

- 代码里还写了默认密码，这不应当被视为可直接用于生产的配置。
- 开发时请优先使用本地 `.env.local` 覆盖。

### 5.3 前端 API 地址

前端默认读取：

- `VITE_API_BASE_URL`

未配置时，默认请求：

```text
/api
```

这意味着：

- 如果前端开发服务器未配置代理，需要你显式把 `VITE_API_BASE_URL` 指向后端
- 如果使用反向代理，则 `/api` 可以直接工作

## 6. 常用检查命令

### 6.1 前端类型检查

```bash
pnpm typecheck:web
```

### 6.2 前端 lint

```bash
pnpm lint:web
```

### 6.3 CLI 类型检查

```bash
pnpm typecheck:cli
```

### 6.4 全仓构建

```bash
pnpm build
```

### 6.5 仅构建 CLI

```bash
pnpm build:cli
```

## 7. 建议的本地验证路径

如果你第一次接手项目，建议按下面顺序验证：

1. 先启动后端。
2. 再启动前端。
3. 访问 `/datasource`，确认能打开数据源列表。
4. 创建一个可连接的数据源，确认连接测试通过。
5. 进入 `/dataset/create`，尝试基于该数据源创建数据集。
6. 进入 `/panel/create`，选择数据集并运行一次临时查询。
7. 进入 `/dashboard/:id`，确认能看到面板被挂载和渲染。
8. 打开右侧 SeeMind，确认 AI 面板能创建会话并发起流式请求。

## 8. CLI 与生产运行时

推荐的生产入口不是仓库脚本，而是 CLI。

推荐命令：

```bash
npx @syedar/seedar-cli@latest install
```

常用 CLI 命令：

```bash
seedar update
seedar status
seedar logs server --follow
seedar doctor
seedar uninstall
```

## 9. 运行时目录

根据 [deploy/README.zh-CN.md](/D:/Program/projects/seedar/deploy/README.zh-CN.md)，CLI 会生成：

- `runtime/docker-compose.yml`
- `runtime/.env`
- `runtime/.installed-version`
- `data/`
- `logs/`
- `backups/`

Windows 默认根目录：

```text
%USERPROFILE%\.seedar
```

Linux/macOS 默认根目录：

```text
~/.seedar
```

## 10. 运行时容器拓扑

部署模板来自 [docker-compose.runtime.yml](/D:/Program/projects/seedar/deploy/templates/docker-compose.runtime.yml)，核心容器包括：

- `mysql`
- `server`
- `migrate`
- `web`

`migrate` 是一次性迁移容器，负责在运行 `server` 之前执行 TypeORM migration。

## 11. 如果你只想看最小闭环

最小闭环是：

1. 后端连接可用 MySQL
2. 前端能请求后端
3. 创建一个数据源
4. 创建一个数据集
5. 在面板页运行一次临时查询

只要这 5 步走通，说明项目的核心骨架已经可以工作。
