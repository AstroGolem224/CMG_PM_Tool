#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "created .env from .env.example"
fi

docker compose up -d --build

PUBLIC_PORT="$(grep -E '^CMG_PUBLIC_PORT=' .env | cut -d'=' -f2- || true)"
PUBLIC_PORT="${PUBLIC_PORT:-4173}"

LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || true)"
if [[ -z "$LAN_IP" ]]; then
  LAN_IP="$(ipconfig getifaddr en1 2>/dev/null || true)"
fi
if [[ -z "$LAN_IP" ]]; then
  LAN_IP="mac-mini.local"
fi

echo
echo "cmg pm tool is starting."
echo "open: http://${LAN_IP}:${PUBLIC_PORT}"
echo "logs: docker compose logs -f"
