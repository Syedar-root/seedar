Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$composeFile = Join-Path $PSScriptRoot "docker-compose.prod.yml"
$serverEnvFile = Join-Path $PSScriptRoot "..\apps\server\.env.production"
$migrateScript = Join-Path $PSScriptRoot "migrate-prod.ps1"
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

if (-not [Environment]::GetEnvironmentVariable("SEEDAR_VERSION", "Process")) {
  [Environment]::SetEnvironmentVariable("SEEDAR_VERSION", "latest", "Process")
}

$mysqlPort = Resolve-PublishedPort -ComposeFile $composeFile -EnvName "MYSQL_PORT" -DefaultPort 3306 -Service "mysql" -TargetPort 3306
$serverPort = Resolve-PublishedPort -ComposeFile $composeFile -EnvName "SERVER_PORT" -DefaultPort 8090 -Service "server" -TargetPort 3000
$webPort = Resolve-PublishedPort -ComposeFile $composeFile -EnvName "WEB_PORT" -DefaultPort 8080 -Service "web" -TargetPort 80

Write-Host "MySQL host port: $mysqlPort"
Write-Host "Server host port: $serverPort"
Write-Host "Web host port: $webPort"
Write-Warning "Legacy deployment path. Prefer 'seedar install' or 'seedar update'."

& $migrateScript
docker compose -f $composeFile up -d server web
