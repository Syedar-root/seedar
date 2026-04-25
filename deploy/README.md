# Seedar Production Deployment

The default production path is now the Seedar CLI.

## Recommended path

Run Seedar without cloning the repo:

```bash
npx @seedar/cli@latest install
```

Common commands:

```bash
seedar update
seedar status
seedar logs server --follow
seedar doctor
seedar uninstall
```

Runtime files are stored under:

- Linux/macOS: `~/.seedar`
- Windows: `%USERPROFILE%\.seedar`

The CLI generates:

- `runtime/docker-compose.yml`
- `runtime/.env`
- `runtime/.installed-version`
- `data/`
- `logs/`
- `backups/`

## Release model

- Docker images are published to DockerHub:
  - `seedarhq/seedar-server:<version>`
  - `seedarhq/seedar-web:<version>`
- CLI is published to npm as `@seedar/cli`.
- Git tags use `vX.Y.Z`.

## Legacy path

The PowerShell scripts are still available as a compatibility path:

```powershell
$env:SEEDAR_VERSION = "latest"
.\deploy\up-prod.ps1
```

Notes:

- Legacy scripts now **pull remote images** instead of building locally.
- Only `apps/server/.env.production` is required for legacy deployment.
- New deployments should prefer the CLI.

## Templates

Reusable runtime templates live in [templates](./templates/):

- `docker-compose.runtime.yml`
- `runtime.env.example`
