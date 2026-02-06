#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Stopping Postgres container..."
docker compose -f "$ROOT_DIR/docker-compose.yml" down

echo "Postgres stopped."
