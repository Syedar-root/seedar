# Seedar 生产部署

现在默认的生产部署入口已经切换为 Seedar CLI。

## 推荐方式

用户机器不再需要源码仓库，直接执行：

```bash
npx @seedar/cli@latest install
```

常用命令：

```bash
seedar update
seedar status
seedar logs server --follow
seedar doctor
seedar uninstall
```

运行时文件默认位于：

- Linux/macOS：`~/.seedar`
- Windows：`%USERPROFILE%\.seedar`

CLI 会生成：

- `runtime/docker-compose.yml`
- `runtime/.env`
- `runtime/.installed-version`
- `data/`
- `logs/`
- `backups/`

## 发布模型

- Docker 镜像发布到 DockerHub：
  - `syedarhandsome/seedar-server:<version>`
  - `syedarhandsome/seedar-web:<version>`
- CLI 发布到 npm：`@seedar/cli`
- Git tag 采用 `vX.Y.Z`

## Legacy 兼容入口

PowerShell 脚本仍然保留，但只作为兼容方案：

```powershell
$env:SEEDAR_VERSION = "latest"
.\deploy\up-prod.ps1
```

说明：

- Legacy 脚本现在**只拉取远端镜像**，不再本地构建。
- Legacy 模式只要求 `apps/server/.env.production`。
- 新部署请优先使用 CLI。

## 模板文件

运行时模板位于 [templates](./templates/)：

- `docker-compose.runtime.yml`
- `runtime.env.example`
