function Get-ComposePublishedPort {
  param(
    [string]$ComposeFile,
    [string]$Service,
    [int]$TargetPort
  )

  try {
    $portMapping = docker compose -f $ComposeFile port $Service $TargetPort 2>$null | Select-Object -First 1
  } catch {
    $portMapping = $null
  }
  if (-not $portMapping) {
    return $null
  }

  if ($portMapping -match ':(\d+)\s*$') {
    return [int]$Matches[1]
  }

  return $null
}

function Test-PortInUse {
  param(
    [int]$Port
  )

  return [bool](Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue)
}

function Get-AvailablePort {
  param(
    [int]$PreferredPort
  )

  $port = $PreferredPort
  while (Test-PortInUse -Port $port) {
    $port++
  }

  return $port
}

function Resolve-PublishedPort {
  param(
    [string]$ComposeFile,
    [string]$EnvName,
    [int]$DefaultPort,
    [string]$Service,
    [int]$TargetPort
  )

  $envValue = [Environment]::GetEnvironmentVariable($EnvName, "Process")
  if ($envValue) {
    return [int]$envValue
  }

  $existingPort = Get-ComposePublishedPort -ComposeFile $ComposeFile -Service $Service -TargetPort $TargetPort
  if ($existingPort) {
    [Environment]::SetEnvironmentVariable($EnvName, [string]$existingPort, "Process")
    return $existingPort
  }

  $selectedPort = Get-AvailablePort -PreferredPort $DefaultPort
  [Environment]::SetEnvironmentVariable($EnvName, [string]$selectedPort, "Process")
  return $selectedPort
}
