#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Starting Postgres container..."
docker compose -f "$ROOT_DIR/docker-compose.yml" up -d

echo "Waiting for Postgres to be ready..."
until docker exec bookapp-postgres pg_isready -U postgres > /dev/null 2>&1; do
  sleep 1
done

echo "Postgres is ready on localhost:5432"
