#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Stopping Postgres container and removing volume..."
docker compose -f "$ROOT_DIR/docker-compose.yml" down -v

echo "Postgres stopped and data volume removed."
