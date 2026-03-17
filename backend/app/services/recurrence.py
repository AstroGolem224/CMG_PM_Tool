"""Helpers for recurring task logic."""
from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import uuid4

from sqlmodel import Session, select

from app.models import Column, ColumnKind, RecurrenceType, Task


def compute_next_due_date(
    recurrence_type: str,
    interval: int,
    base: datetime | None = None,
) -> datetime | None:
    """Return the next due date based on recurrence settings."""
    now = base or datetime.now(timezone.utc)
    if recurrence_type == RecurrenceType.DAILY:
        return now + timedelta(days=interval)
    if recurrence_type == RecurrenceType.WEEKLY:
        return now + timedelta(weeks=interval)
    if recurrence_type == RecurrenceType.MONTHLY:
        month = now.month + interval
        year = now.year + (month - 1) // 12
        month = (month - 1) % 12 + 1
        day = min(now.day, 28)  # safe for all months
        return now.replace(year=year, month=month, day=day)
    if recurrence_type == RecurrenceType.CUSTOM_DAYS:
        return now + timedelta(days=interval)
    return None


def clone_recurring_task(session: Session, original: Task) -> Task:
    """Clone a recurring task into the backlog column of the same project."""
    backlog = session.exec(
        select(Column)
        .where(Column.project_id == original.project_id, Column.kind == ColumnKind.BACKLOG)
        .order_by(Column.position)
    ).first()

    if not backlog:
        # Fallback: first non-done column
        backlog = session.exec(
            select(Column)
            .where(Column.project_id == original.project_id, Column.kind != ColumnKind.DONE)
            .order_by(Column.position)
        ).first()

    if not backlog:
        raise ValueError("No suitable column found for recurring task")

    # Find next position in target column
    last_task = session.exec(
        select(Task)
        .where(Task.column_id == backlog.id)
        .order_by(Task.position.desc())
    ).first()
    next_position = 0 if not last_task else last_task.position + 1

    next_due = compute_next_due_date(
        original.recurrence_type,
        original.recurrence_interval,
    )

    clone = Task(
        id=str(uuid4()),
        project_id=original.project_id,
        column_id=backlog.id,
        title=original.title.removeprefix("\u2705 "),
        description=original.description,
        priority=original.priority,
        position=next_position,
        deadline=next_due,
        recurrence_type=original.recurrence_type,
        recurrence_interval=original.recurrence_interval,
        recurrence_days=original.recurrence_days,
        next_due_date=next_due,
    )
    session.add(clone)
    return clone
