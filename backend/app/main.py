from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session

from app.api.routes.comments import router as comments_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.labels import router as labels_router
from app.api.routes.meta import router as meta_router
from app.api.routes.projects import router as projects_router
from app.api.routes.tasks import router as tasks_router
from app.core.config import get_settings
from app.db import engine
from app.migrations import run_migrations
from app.services.seed import seed_demo_data


@asynccontextmanager
async def lifespan(_app: FastAPI):
    run_migrations()
    settings = get_settings()
    if settings.seed_demo:
        with Session(engine) as session:
            seed_demo_data(session)
    yield


settings = get_settings()
app = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api")
@app.get("/api/")
def api_root() -> dict[str, str]:
    return {"status": "ok", "service": "cmg-pm-tool"}

@app.get("/api/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(projects_router, prefix="/api")
app.include_router(tasks_router, prefix="/api")
app.include_router(labels_router, prefix="/api")
app.include_router(comments_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(meta_router, prefix="/api")
