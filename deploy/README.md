# Seedar Production Deployment

The default production path is now the Seedar CLI.

## Recommended Path

Run Seedar without cloning the repo:

```bash
npx @syedar/seedar-cli@latest install
```

Common commands:

```bash
seedar install [version] [-y]
seedar update [version]
seedar status
seedar logs [service] [-f]
seedar doctor
seedar uninstall [--remove-data] [--all] [--force]
seedar remove --force
seedar purge --force
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

## Release Model

- Docker images are published to DockerHub:
  - `syedarhandsome/seedar-server:<version>`
  - `syedarhandsome/seedar-web:<version>`
- CLI is published to npm as `@syedar/seedar-cli`.
- Git tags use `vX.Y.Z`.

## Test Branch Flow

- Pushes to the `test` branch run the `Test Release` workflow.
- Test images are published with the `test` and `test-<sha>` tags.
- The CLI is packed as a workflow artifact on every `test` branch push.
- If `NPM_TOKEN` is configured, the CLI is also published to npm with a prerelease version and the `test` dist-tag.

Examples:

```bash
npx @syedar/seedar-cli@test install
docker pull syedarhandsome/seedar-server:test
docker pull syedarhandsome/seedar-web:test
```

## Legacy Path

The PowerShell scripts are still available as a compatibility path:

```powershell
$env:SEEDAR_VERSION = "latest"
.\deploy\up-prod.ps1
```

Notes:

- Legacy scripts now **pull remote images** instead of building locally.
- Only `apps/server/.env.production` is required for legacy deployment.
- New deployments should prefer `seedar install [version] [-y]` and `seedar update [version]`.

## Templates

Reusable runtime templates live in [templates](./templates/):

- `docker-compose.runtime.yml`
- `runtime.env.example`
