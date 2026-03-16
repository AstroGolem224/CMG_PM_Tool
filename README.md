# CMG PM Tool

CMG PM Tool is a self-hosted project management app for LAN setups. The repo now contains a real FastAPI + SQLite backend, the existing React/Vite frontend, automated tests, Docker support, and structured docs instead of just a frontend shell.

## What Ships In V1

- dashboard backed by live aggregate data
- projects with create, edit, archive, restore, and hard delete
- kanban board with persistent tasks, project-wide label management, comments, pinned/default saved views, bulk slice actions, and move flows
- explicit done-lane semantics via column kinds instead of hard-coded column names
- archived project boards stay visible but switch to a read-only detail mode
- runtime info screen for checking backend wiring
- pytest, vitest, and Playwright end-to-end coverage

## Quick Start

1. Copy `.env.example` to `.env`.
2. Start the backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\python -m pip install -e .[dev]
.venv\Scripts\uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

3. Start the frontend:

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

4. Open `http://localhost:5173`.

## One-Command Helpers

1. Windows: `.\scripts\start-dev.ps1`
2. macOS/Linux: `./scripts/start-dev.sh`
3. Docker: `docker compose up --build`

## Documentation

1. [Architecture](docs/architecture.md)
2. [Data Model](docs/data-model.md)
3. [API Overview](docs/api.md)
4. [Setup Guide](docs/setup.md)
5. [Mac Mini Deployment](docs/deployment-mac-mini.md)
