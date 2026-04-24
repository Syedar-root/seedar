# Seedar Docker Compose (Production)

中文文档: [README.zh-CN.md](./README.zh-CN.md)

## 1. Prepare env files

From project root:

```powershell
Copy-Item .\apps\server\.env.production.example .\apps\server\.env.production
Copy-Item .\apps\web-client\.env.production.example .\apps\web-client\.env.production
```

Then edit:

- `apps/server/.env.production`
- `apps/web-client/.env.production`

## 2. Build and run

```powershell
.\deploy\up-prod.ps1
```

Or use docker compose directly:

```powershell
docker compose -f .\deploy\docker-compose.prod.yml up -d mysql
docker compose -f .\deploy\docker-compose.prod.yml run --rm --build migrate
docker compose -f .\deploy\docker-compose.prod.yml up -d --build server web
```

## 3. Stop services

```powershell
.\deploy\down-prod.ps1
```

## 4. Service ports

- Web: `8080` (override with shell env `WEB_PORT`)
- Server: `8090` (override with shell env `SERVER_PORT`)
- MySQL: `3306` (override with shell env `MYSQL_PORT`)

## 5. Notes

- Frontend calls backend with `/api`, and Nginx rewrites `/api/*` to backend routes.
- `apps/server/.env.production` is reused by both `mysql` and `server` services.
- `apps/web-client/.env.production` is reused during frontend image build.
- `apps/server/.env.production` must include `MYSQL_ROOT_PASSWORD`, `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`.
- `MYSQL_USER` must be a regular database user such as `seedar`; do not set it to `root`.
- Deployment order is `mysql -> migrate -> server/web`.
- Use `.\deploy\migrate-prod.ps1` to run migrations independently.

## 6. Troubleshooting

- If Docker BuildKit fails with mirror/EOF errors while resolving `node` or `nginx` metadata, either fix your Docker registry mirror configuration or temporarily run:

```powershell
$env:DOCKER_BUILDKIT = "0"
.\deploy\up-prod.ps1
```

- If port `3306` is already occupied on the host, override the published MySQL port for this shell session:

```powershell
$env:MYSQL_PORT = "3307"
.\deploy\up-prod.ps1
```
