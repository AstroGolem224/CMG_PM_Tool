$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot

if (-not (Test-Path "$root\.env")) {
  Copy-Item "$root\.env.example" "$root\.env"
}

Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; if (-not (Test-Path '.venv')) { python -m venv .venv }; .\.venv\Scripts\python -m pip install -e .[dev]; .\.venv\Scripts\uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm install; npm run dev -- --host 0.0.0.0"
