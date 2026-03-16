from __future__ import annotations

from sqlmodel import Session

from app.models import ActivityEvent, Project, Task


def record_event(
    session: Session,
    *,
    action: str,
    project: Project,
    task: Task | None = None,
    task_title: str | None = None,
) -> ActivityEvent:
    event = ActivityEvent(
        action=action,
        project_name=project.name,
        project_id=project.id,
        task_id=task.id if task else None,
        task_title=task_title or (task.title if task else ""),
    )
    session.add(event)
    return event
