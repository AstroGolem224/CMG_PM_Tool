from __future__ import annotations

from pathlib import Path

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect, text

from app.core.config import ROOT_DIR, get_settings

LEGACY_BASELINE_REVISION = "20260316_0001"


def run_migrations() -> None:
    settings = get_settings()
    settings.database_path.parent.mkdir(parents=True, exist_ok=True)

    alembic_ini = ROOT_DIR / "backend" / "alembic.ini"
    alembic_dir = ROOT_DIR / "backend" / "alembic"

    config = Config(str(alembic_ini))
    config.set_main_option("script_location", str(alembic_dir))
    config.set_main_option("sqlalchemy.url", f"sqlite:///{settings.database_path.as_posix()}")
    inspection_engine = create_engine(
        f"sqlite:///{settings.database_path.as_posix()}",
        connect_args={"check_same_thread": False},
    )
    with inspection_engine.begin() as connection:
        tables = set(inspect(connection).get_table_names())
        if tables:
            current_revision = None
            if "alembic_version" in tables:
                current_revision = connection.execute(
                    text("SELECT version_num FROM alembic_version LIMIT 1")
                ).scalar()

            if not current_revision:
                if "alembic_version" not in tables:
                    connection.execute(
                        text("CREATE TABLE alembic_version (version_num VARCHAR(32) NOT NULL)")
                    )
                else:
                    connection.execute(text("DELETE FROM alembic_version"))

                connection.execute(
                    text("INSERT INTO alembic_version (version_num) VALUES (:revision)"),
                    {"revision": LEGACY_BASELINE_REVISION},
                )
    inspection_engine.dispose()

    command.upgrade(config, "head")
