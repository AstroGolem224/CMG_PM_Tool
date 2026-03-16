from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select

from app.db import get_session
from app.models import ActivityEvent, Label, Project, ProjectStatus, Task, TaskLabelLink, TaskPriority
from app.schemas import ActivityItem, DashboardLabelItem, DashboardStats, DeadlineItem
from app.services.board import project_done_column_ids


router = APIRouter(prefix="/dashboard", tags=["dashboard"])
VALID_PRIORITIES = {
    TaskPriority.LOW,
    TaskPriority.MEDIUM,
    TaskPriority.HIGH,
    TaskPriority.URGENT,
}
VALID_COMPLETION = {"all", "open", "done"}


def _normalize_timestamp(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _active_project_ids(session: Session) -> list[str]:
    return session.exec(select(Project.id).where(Project.status == ProjectStatus.ACTIVE)).all()


def _parse_label_ids(raw_value: str | None) -> list[str]:
    if not raw_value:
        return []
    return [item.strip() for item in raw_value.split(",") if item.strip()]


def _parse_priorities(raw_value: str | None) -> list[str]:
    if not raw_value:
        return []
    return [
        item.strip().lower()
        for item in raw_value.split(",")
        if item.strip() and item.strip().lower() in VALID_PRIORITIES
    ]


def _parse_completion(raw_value: str | None) -> str:
    if not raw_value:
        return "all"
    normalized = raw_value.strip().lower()
    return normalized if normalized in VALID_COMPLETION else "all"


def _matching_task_ids(session: Session, project_ids: list[str], label_ids: list[str]) -> set[str] | None:
    if not label_ids:
        return None

    task_ids = session.exec(
        select(TaskLabelLink.task_id)
        .join(Task, Task.id == TaskLabelLink.task_id)
        .where(Task.project_id.in_(project_ids), TaskLabelLink.label_id.in_(label_ids))
    ).all()
    return set(task_ids)


def _filtered_tasks(
    session: Session,
    project_ids: list[str],
    label_ids: list[str],
    priorities: list[str],
    completion: str,
    *,
    require_deadline: bool = False,
) -> list[Task]:
    if not project_ids:
        return []

    statement = select(Task).where(Task.project_id.in_(project_ids))
    if require_deadline:
        statement = statement.where(Task.deadline.is_not(None))

    tasks = session.exec(statement.order_by(Task.deadline, Task.created_at)).all()
    matching_task_ids = _matching_task_ids(session, project_ids, label_ids)
    done_column_ids = project_done_column_ids(session, project_ids)

    filtered_tasks: list[Task] = []
    for task in tasks:
        if matching_task_ids is not None and task.id not in matching_task_ids:
            continue
        if priorities and task.priority not in priorities:
            continue
        if completion == "done" and task.column_id not in done_column_ids:
            continue
        if completion == "open" and task.column_id in done_column_ids:
            continue
        filtered_tasks.append(task)
    return filtered_tasks


@router.get("", response_model=DashboardStats)
def get_dashboard_stats(
    label_ids: str | None = Query(default=None),
    priorities: str | None = Query(default=None),
    completion: str | None = Query(default=None),
    session: Session = Depends(get_session),
) -> DashboardStats:
    project_ids = _active_project_ids(session)
    if not project_ids:
        return DashboardStats(total_tasks=0, in_progress=0, completed=0, overdue=0)

    parsed_label_ids = _parse_label_ids(label_ids)
    parsed_priorities = _parse_priorities(priorities)
    parsed_completion = _parse_completion(completion)
    tasks = _filtered_tasks(
        session,
        project_ids,
        parsed_label_ids,
        parsed_priorities,
        parsed_completion,
    )
    done_column_ids = project_done_column_ids(session, project_ids)
    now = datetime.now(timezone.utc)

    total_tasks = len(tasks)
    completed = sum(1 for task in tasks if task.column_id in done_column_ids)
    in_progress = total_tasks - completed
    overdue = sum(
        1
        for task in tasks
        if task.deadline
        and _normalize_timestamp(task.deadline) < now
        and task.column_id not in done_column_ids
    )
    return DashboardStats(
        total_tasks=total_tasks,
        in_progress=in_progress,
        completed=completed,
        overdue=overdue,
    )


@router.get("/deadlines", response_model=list[DeadlineItem])
def get_upcoming_deadlines(
    label_ids: str | None = Query(default=None),
    priorities: str | None = Query(default=None),
    completion: str | None = Query(default=None),
    session: Session = Depends(get_session),
) -> list[DeadlineItem]:
    project_ids = _active_project_ids(session)
    if not project_ids:
        return []

    parsed_label_ids = _parse_label_ids(label_ids)
    parsed_priorities = _parse_priorities(priorities)
    parsed_completion = _parse_completion(completion)
    projects = {project.id: project for project in session.exec(select(Project)).all()}
    done_column_ids = project_done_column_ids(session, project_ids)
    tasks = _filtered_tasks(
        session,
        project_ids,
        parsed_label_ids,
        parsed_priorities,
        parsed_completion,
        require_deadline=True,
    )

    items: list[DeadlineItem] = []
    for task in tasks:
        if task.column_id in done_column_ids or not task.deadline:
            continue
        project = projects.get(task.project_id)
        if not project:
            continue
        items.append(
            DeadlineItem(
                task_id=task.id,
                task_title=task.title,
                project_id=project.id,
                project_name=project.name,
                deadline=task.deadline,
                priority=task.priority,
            )
        )
        if len(items) >= 5:
            break
    return items


@router.get("/activity", response_model=list[ActivityItem])
def get_recent_activity(
    label_ids: str | None = Query(default=None),
    priorities: str | None = Query(default=None),
    completion: str | None = Query(default=None),
    session: Session = Depends(get_session),
) -> list[ActivityEvent]:
    project_ids = _active_project_ids(session)
    if not project_ids:
        return []

    parsed_label_ids = _parse_label_ids(label_ids)
    parsed_priorities = _parse_priorities(priorities)
    parsed_completion = _parse_completion(completion)
    filtered_tasks = _filtered_tasks(
        session,
        project_ids,
        parsed_label_ids,
        parsed_priorities,
        parsed_completion,
    )
    matching_task_ids = {task.id for task in filtered_tasks}

    statement = select(ActivityEvent).where(ActivityEvent.project_id.in_(project_ids))
    if parsed_label_ids or parsed_priorities or parsed_completion != "all":
        if not matching_task_ids:
            return []
        statement = statement.where(ActivityEvent.task_id.in_(matching_task_ids))

    return session.exec(statement.order_by(ActivityEvent.timestamp.desc()).limit(20)).all()


@router.get("/labels", response_model=list[DashboardLabelItem])
def get_dashboard_labels(session: Session = Depends(get_session)) -> list[DashboardLabelItem]:
    project_ids = _active_project_ids(session)
    if not project_ids:
        return []

    projects = {
        project.id: project
        for project in session.exec(select(Project).where(Project.id.in_(project_ids))).all()
    }
    labels = session.exec(
        select(Label).where(Label.project_id.in_(project_ids)).order_by(Label.name)
    ).all()
    return [
        DashboardLabelItem(
            id=label.id,
            project_id=label.project_id,
            project_name=projects[label.project_id].name,
            name=label.name,
            color=label.color,
        )
        for label in labels
        if label.project_id in projects
    ]
