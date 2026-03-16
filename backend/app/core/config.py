from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT_DIR = Path(__file__).resolve().parents[3]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(ROOT_DIR / ".env"),
        env_prefix="CMG_",
        extra="ignore",
    )

    app_name: str = "CMG PM Tool"
    env: str = "development"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    database_url: str = "sqlite:///./backend/data/cmg_pm_tool.db"
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"
    seed_demo: bool = True
    frontend_origin: str = "http://localhost:5173"

    @property
    def database_path(self) -> Path:
        raw_path = self.database_url.removeprefix("sqlite:///")
        path = Path(raw_path)
        if not path.is_absolute():
            path = (ROOT_DIR / path).resolve()
        return path

    @computed_field
    @property
    def cors_origin_list(self) -> list[str]:
        return [item.strip() for item in self.cors_origins.split(",") if item.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
