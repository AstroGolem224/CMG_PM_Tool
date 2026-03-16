#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

wait_for_port() {
  local host="$1"
  local port="$2"
  local timeout="${3:-60}"
  local end=$((SECONDS + timeout))

  while [ "$SECONDS" -lt "$end" ]; do
    if python - <<PY >/dev/null 2>&1
import socket
s = socket.socket()
s.settimeout(0.5)
try:
    s.connect(("${host}", ${port}))
except OSError:
    raise SystemExit(1)
finally:
    s.close()
PY
    then
      return 0
    fi
    sleep 0.3
  done

  echo "timed out waiting for ${host}:${port}" >&2
  exit 1
}

cleanup() {
  if [ -n "${BACKEND_PID:-}" ] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID"
  fi

  if [ -n "${FRONTEND_PID:-}" ] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill "$FRONTEND_PID"
  fi
}

trap cleanup EXIT

(cd "$BACKEND_DIR" && ./.venv/bin/python -m uvicorn app.main:app --host 127.0.0.1 --port 8010) &
BACKEND_PID=$!

(cd "$FRONTEND_DIR" && CMG_FRONTEND_PROXY_TARGET="http://127.0.0.1:8010" node ./node_modules/vite/bin/vite.js --host 127.0.0.1 --port 4173 --strictPort) &
FRONTEND_PID=$!

wait_for_port "127.0.0.1" "8010"
wait_for_port "127.0.0.1" "4173"

wait
