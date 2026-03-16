from __future__ import annotations

from datetime import timedelta

from sqlmodel import Session, select

from app.models import Comment, Label, Project, Task, TaskLabelLink, TaskPriority
from app.services.activity import record_event
from app.services.board import create_default_columns


def seed_demo_data(session: Session) -> None:
    existing = session.exec(select(Project.id)).first()
    if existing:
        return

    project = Project(
        name="CMG Launch Board",
        description="Demo workspace seeded on first boot.",
        color="#06b6d4",
    )
    session.add(project)
    session.commit()
    session.refresh(project)

    create_default_columns(session, project)
    session.commit()
    session.refresh(project)

    columns = {column.name: column for column in project.columns}
    backlog = columns["Backlog"]
    in_progress = columns["In Progress"]
    review = columns["Review"]

    task_specs = [
        (
            "Wire the FastAPI backend",
            "Implement the API slice that powers the kanban board.",
            TaskPriority.HIGH,
            in_progress.id,
            0,
            2,
        ),
        (
            "Write setup documentation",
            "Document local startup, LAN access, and Docker usage.",
            TaskPriority.MEDIUM,
            review.id,
            0,
            4,
        ),
        (
            "Refine dashboard cards",
            "Make the dashboard feel like real project telemetry, not placeholder chrome.",
            TaskPriority.LOW,
            backlog.id,
            0,
            7,
        ),
    ]

    labels = [
        Label(project_id=project.id, name="backend", color="#3b82f6"),
        Label(project_id=project.id, name="docs", color="#f59e0b"),
        Label(project_id=project.id, name="ux", color="#ec4899"),
    ]
    for label in labels:
        session.add(label)
    session.commit()

    created_tasks: list[Task] = []
    for title, description, priority, column_id, position, deadline_days in task_specs:
        task = Task(
            project_id=project.id,
            column_id=column_id,
            title=title,
            description=description,
            priority=priority,
            position=position,
            deadline=project.created_at + timedelta(days=deadline_days),
        )
        session.add(task)
        created_tasks.append(task)
    session.commit()

    session.add(TaskLabelLink(task_id=created_tasks[0].id, label_id=labels[0].id))
    session.add(TaskLabelLink(task_id=created_tasks[1].id, label_id=labels[1].id))
    session.add(TaskLabelLink(task_id=created_tasks[2].id, label_id=labels[2].id))
    session.add(
        Comment(task_id=created_tasks[0].id, content="Backend slice is the real missing backbone here.")
    )
    record_event(session, action="created project", project=project)
    for task in created_tasks:
        record_event(session, action="created task", project=project, task=task)
    session.commit()
