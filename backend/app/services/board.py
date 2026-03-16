from __future__ import annotations

from datetime import datetime, timezone

from fastapi import HTTPException
from sqlmodel import Session, select

from app.models import Column, ColumnKind, Project, ProjectStatus, Task


DEFAULT_COLUMNS = [
    ("Backlog", ColumnKind.BACKLOG, "#64748b"),
    ("In Progress", ColumnKind.IN_PROGRESS, "#3b82f6"),
    ("Review", ColumnKind.REVIEW, "#f59e0b"),
    ("Done", ColumnKind.DONE, "#22c55e"),
]
VALID_COLUMN_KINDS = {
    ColumnKind.BACKLOG,
    ColumnKind.IN_PROGRESS,
    ColumnKind.REVIEW,
    ColumnKind.DONE,
    ColumnKind.CUSTOM,
}


def touch(model) -> None:
    if hasattr(model, "updated_at"):
        model.updated_at = datetime.now(timezone.utc)


def get_project_or_404(session: Session, project_id: str) -> Project:
    project = session.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def get_column_or_404(session: Session, column_id: str) -> Column:
    column = session.get(Column, column_id)
    if not column:
        raise HTTPException(status_code=404, detail="Column not found")
    return column


def get_task_or_404(session: Session, task_id: str) -> Task:
    task = session.get(Task, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


def ensure_active_project(project: Project) -> None:
    if project.status == ProjectStatus.ARCHIVED:
        raise HTTPException(status_code=400, detail="Archived projects are read-only")


def create_default_columns(session: Session, project: Project) -> None:
    for position, (name, kind, color) in enumerate(DEFAULT_COLUMNS):
        session.add(
            Column(
                project_id=project.id,
                name=name,
                kind=kind,
                color=color,
                position=position,
            )
        )


def parse_filter_list(raw_value: str) -> list[str]:
    if not raw_value:
        return []
    return [item for item in raw_value.split(",") if item]


def serialize_filter_list(values: list[str]) -> str:
    return ",".join(item for item in values if item)


def project_done_column_ids(session: Session, project_ids: list[str]) -> set[str]:
    if not project_ids:
        return set()
    return set(
        session.exec(
            select(Column.id).where(Column.project_id.in_(project_ids), Column.kind == ColumnKind.DONE)
        ).all()
    )


def project_done_columns(session: Session, project_id: str) -> list[Column]:
    return session.exec(
        select(Column).where(Column.project_id == project_id, Column.kind == ColumnKind.DONE).order_by(Column.position)
    ).all()


def normalize_positions(session: Session, column_id: str) -> None:
    tasks = session.exec(
        select(Task).where(Task.column_id == column_id).order_by(Task.position, Task.created_at)
    ).all()
    for index, task in enumerate(tasks):
        task.position = index
        touch(task)
        session.add(task)


def insert_task_at_position(session: Session, task: Task, column_id: str, position: int) -> None:
    tasks = session.exec(
        select(Task).where(Task.column_id == column_id, Task.id != task.id).order_by(Task.position)
    ).all()
    safe_position = max(0, min(position, len(tasks)))
    tasks.insert(safe_position, task)
    for index, current in enumerate(tasks):
        current.column_id = column_id
        current.position = index
        touch(current)
        session.add(current)
