# Seedar Docker Compose（生产环境）

## 1. 准备环境变量文件

在项目根目录执行：

```powershell
Copy-Item .\apps\server\.env.production.example .\apps\server\.env.production
Copy-Item .\apps\web-client\.env.production.example .\apps\web-client\.env.production
```

然后编辑：

- `apps/server/.env.production`
- `apps/web-client/.env.production`

## 2. 构建并启动

```powershell
.\deploy\up-prod.ps1
```

或者手动执行 docker compose：

```powershell
docker compose -f .\deploy\docker-compose.prod.yml up -d mysql
docker compose -f .\deploy\docker-compose.prod.yml run --rm --build migrate
docker compose -f .\deploy\docker-compose.prod.yml up -d --build server web
```

## 3. 停止服务

```powershell
.\deploy\down-prod.ps1
```

## 4. 默认端口

- Web：`8080`（可通过 shell 环境变量 `WEB_PORT` 覆盖）
- Server：`8090`（可通过 shell 环境变量 `SERVER_PORT` 覆盖）
- MySQL：`3306`（可通过 shell 环境变量 `MYSQL_PORT` 覆盖）

## 5. 说明

- 前端默认通过 `/api` 访问后端，Nginx 会将 `/api/*` 重写并转发到后端服务。
- `apps/server/.env.production` 会被 `mysql` 和 `server` 服务共同复用。
- `apps/web-client/.env.production` 会在前端镜像构建阶段使用。
- `apps/server/.env.production` 必须包含：`MYSQL_ROOT_PASSWORD`、`MYSQL_DATABASE`、`MYSQL_USER`、`MYSQL_PASSWORD`。
- 部署顺序为：`mysql -> migrate -> server/web`。
- 需要单独执行迁移时可使用：`.\deploy\migrate-prod.ps1`。
