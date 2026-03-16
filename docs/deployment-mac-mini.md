# Mac Mini LAN Deployment

This is the clean production path for a dedicated M4 Mac mini on your LAN: Docker Compose, persistent SQLite, Nginx in front, FastAPI behind it.

## Target Topology

```mermaid
flowchart LR
  Browser["LAN browser"] -->|"http://mac-mini.local:4173"| Frontend["Nginx container"]
  Frontend -->|"/api"| Backend["FastAPI container"]
  Backend --> Database["SQLite file in backend/data"]
```

## 1. Prerequisites

1. Install Docker Desktop for Mac.
2. Make sure the Mac mini stays on the same LAN as your clients.
3. Reserve a stable LAN IP for the Mac mini in your router if possible.
4. Open macOS System Settings -> General -> Sharing and confirm the local hostname you want to expose.

## 2. Prepare the Host

1. Clone the repo onto the Mac mini.
2. Open Terminal in the repo root.
3. Copy the environment file:

```bash
cp .env.example .env
```

4. Edit `.env`:
   1. set `CMG_FRONTEND_ORIGIN` to your real LAN URL, for example `http://mac-mini.local:4173`
   2. set `CMG_CORS_ORIGINS` to the same LAN URL plus any extra admin URLs you need
   3. keep `CMG_SEED_DEMO=false` for production
   4. change `CMG_PUBLIC_PORT` if you do not want `4173`

## 3. Start the Stack

1. run the helper:

```bash
./scripts/deploy-mac-mini.sh
```

2. or run Compose directly:

```bash
docker compose up -d --build
```

3. verify health:

```bash
docker compose ps
docker compose logs -f
```

## 4. Validate from Another Device

1. open `http://mac-mini.local:4173`
2. if mDNS name resolution is flaky on your network, use `http://<mac-mini-lan-ip>:4173`
3. confirm projects load and task operations persist across a container restart

## 5. Ops Notes

1. persistent data lives in `backend/data/cmg_pm_tool.db`
2. update flow:

```bash
git pull
docker compose up -d --build
```

3. stop the stack:

```bash
docker compose down
```

4. back up the database file before risky updates

## 6. macOS Firewall

1. if clients cannot connect, open System Settings -> Network -> Firewall
2. allow Docker Desktop incoming connections
3. re-test with both `mac-mini.local` and the raw LAN IP
