$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir

Write-Host "Stopping Postgres container..."
docker compose -f "$RootDir\docker-compose.yml" down

Write-Host "Postgres stopped."
