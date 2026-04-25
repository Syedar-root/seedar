Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$composeFile = Join-Path $PSScriptRoot "docker-compose.prod.yml"
Write-Warning "Legacy deployment path. Prefer 'seedar uninstall' when using the CLI-managed runtime."
docker compose -f $composeFile down
