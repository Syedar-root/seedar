Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$composeFile = Join-Path $PSScriptRoot "docker-compose.prod.yml"
$serverEnvFile = Join-Path $PSScriptRoot "..\apps\server\.env.production"
. (Join-Path $PSScriptRoot "Resolve-ProdPorts.ps1")

function Get-EnvValue {
  param(
    [string]$Path,
    [string]$Key
  )

  $match = Select-String -Path $Path -Pattern "^\s*$Key\s*=\s*(.*)\s*$" | Select-Object -First 1

  if (-not $match) {
    return $null
  }

  return $match.Matches[0].Groups[1].Value.Trim()
}

if (-not (Test-Path $serverEnvFile)) {
  throw "Missing $serverEnvFile. Copy apps/server/.env.production.example to apps/server/.env.production first."
}

$requiredServerKeys = @(
  "DB_PORT",
  "DB_USERNAME",
  "DB_PASSWORD",
  "DB_DATABASE",
  "MYSQL_ROOT_PASSWORD",
  "MYSQL_DATABASE",
  "MYSQL_USER",
  "MYSQL_PASSWORD",
  "AES_SECRET"
)

foreach ($key in $requiredServerKeys) {
  if (-not (Select-String -Path $serverEnvFile -Pattern "^\s*$key\s*=" -Quiet)) {
    throw "Missing key '$key' in $serverEnvFile."
  }
}

$mysqlUser = Get-EnvValue -Path $serverEnvFile -Key "MYSQL_USER"
if ($mysqlUser -eq "root") {
  throw "Invalid MYSQL_USER in $serverEnvFile. MySQL Docker image does not allow MYSQL_USER=root. Use a regular user such as 'seedar' and keep MYSQL_ROOT_PASSWORD for the root account."
}

$mysqlPort = Resolve-PublishedPort -ComposeFile $composeFile -EnvName "MYSQL_PORT" -DefaultPort 3306 -Service "mysql" -TargetPort 3306
Write-Host "MySQL host port: $mysqlPort"

docker compose -f $composeFile up -d mysql
docker compose -f $composeFile run --rm --build migrate
