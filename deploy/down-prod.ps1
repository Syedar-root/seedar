Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$composeFile = Join-Path $PSScriptRoot "docker-compose.prod.yml"
docker compose -f $composeFile down
