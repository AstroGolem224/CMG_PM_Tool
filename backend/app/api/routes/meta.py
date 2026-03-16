from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter

from app.core.config import get_settings
from app.schemas import RuntimeInfo


router = APIRouter(prefix="/meta", tags=["meta"])


@router.get("/runtime", response_model=RuntimeInfo)
def get_runtime_info() -> RuntimeInfo:
    settings = get_settings()
    return RuntimeInfo(
        app_name=settings.app_name,
        version="1.0.0",
        environment=settings.env,
        api_base="/api",
        frontend_origin=settings.frontend_origin,
        database_path=str(settings.database_path),
        seeded_demo=settings.seed_demo,
        current_time=datetime.now(timezone.utc),
    )
