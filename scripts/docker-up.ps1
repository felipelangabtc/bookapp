$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir

Write-Host "Starting Postgres container..."
docker compose -f "$RootDir\docker-compose.yml" up -d

Write-Host "Waiting for Postgres to be ready..."
do {
    Start-Sleep -Seconds 1
    $ready = docker exec bookapp-postgres pg_isready -U postgres 2>$null
} while ($LASTEXITCODE -ne 0)

Write-Host "Postgres is ready on localhost:5432"
