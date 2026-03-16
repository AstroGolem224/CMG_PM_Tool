from __future__ import annotations

import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine

TEST_DB_PATH = Path(__file__).resolve().parent / "test.db"
os.environ["CMG_DATABASE_URL"] = f"sqlite:///{TEST_DB_PATH.as_posix()}"
os.environ["CMG_SEED_DEMO"] = "false"

from app.db import get_session  # noqa: E402
from app.main import app  # noqa: E402


test_engine = create_engine(
    f"sqlite:///{TEST_DB_PATH.as_posix()}",
    connect_args={"check_same_thread": False},
)


@pytest.fixture(autouse=True)
def reset_database():
    test_engine.dispose()
    if TEST_DB_PATH.exists():
        TEST_DB_PATH.unlink()
    yield
    test_engine.dispose()
    if TEST_DB_PATH.exists():
        TEST_DB_PATH.unlink()


@pytest.fixture
def client():
    def override_session():
        with Session(test_engine) as session:
            yield session

    app.dependency_overrides[get_session] = override_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
