from datetime import datetime, timezone
from typing import Optional
from uuid import uuid4

from sqlmodel import Field, Relationship, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class ProjectStatus:
    ACTIVE = "active"
    ARCHIVED = "archived"


class TaskPriority:
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class ColumnKind:
    BACKLOG = "backlog"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"
    CUSTOM = "custom"


class TimestampedModel(SQLModel):
    created_at: datetime = Field(default_factory=utc_now, nullable=False)
    updated_at: datetime = Field(default_factory=utc_now, nullable=False)


class TaskLabelLink(SQLModel, table=True):
    task_id: str = Field(foreign_key="task.id", primary_key=True, ondelete="CASCADE")
    label_id: str = Field(foreign_key="label.id", primary_key=True, ondelete="CASCADE")


class Project(TimestampedModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    name: str
    description: str = ""
    color: str = "#6366f1"
    status: str = Field(default=ProjectStatus.ACTIVE, index=True)

    columns: list["Column"] = Relationship(
        back_populates="project",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    labels: list["Label"] = Relationship(
        back_populates="project",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    views: list["ProjectView"] = Relationship(
        back_populates="project",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )
    tasks: list["Task"] = Relationship(
        back_populates="project",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class Column(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    project_id: str = Field(foreign_key="project.id", nullable=False, index=True, ondelete="CASCADE")
    name: str
    kind: str = Field(default=ColumnKind.CUSTOM, nullable=False, index=True)
    position: int = Field(default=0, nullable=False)
    color: str = "#475569"
    created_at: datetime = Field(default_factory=utc_now, nullable=False)

    project: Project = Relationship(back_populates="columns")
    tasks: list["Task"] = Relationship(
        back_populates="column",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class Task(TimestampedModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    project_id: str = Field(foreign_key="project.id", nullable=False, index=True, ondelete="CASCADE")
    column_id: str = Field(foreign_key="column.id", nullable=False, index=True, ondelete="CASCADE")
    title: str
    description: str = ""
    priority: str = Field(default=TaskPriority.MEDIUM, nullable=False)
    position: int = Field(default=0, nullable=False, index=True)
    deadline: Optional[datetime] = Field(default=None)

    project: Project = Relationship(back_populates="tasks")
    column: Column = Relationship(back_populates="tasks")
    labels: list["Label"] = Relationship(back_populates="tasks", link_model=TaskLabelLink)
    comments: list["Comment"] = Relationship(
        back_populates="task",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"},
    )


class Label(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    project_id: str = Field(foreign_key="project.id", nullable=False, index=True, ondelete="CASCADE")
    name: str
    color: str = "#3b82f6"

    project: Project = Relationship(back_populates="labels")
    tasks: list[Task] = Relationship(back_populates="labels", link_model=TaskLabelLink)


class ProjectView(TimestampedModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    project_id: str = Field(foreign_key="project.id", nullable=False, index=True, ondelete="CASCADE")
    name: str
    is_pinned: bool = Field(default=False, nullable=False)
    is_default: bool = Field(default=False, nullable=False)
    position: int = Field(default=0, nullable=False)
    label_ids: str = ""
    priorities: str = ""
    completion: str = Field(default="all", nullable=False)

    project: Project = Relationship(back_populates="views")


class Comment(TimestampedModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    task_id: str = Field(foreign_key="task.id", nullable=False, index=True, ondelete="CASCADE")
    content: str

    task: Task = Relationship(back_populates="comments")


class ActivityEvent(SQLModel, table=True):
    id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    action: str
    task_title: str = ""
    project_name: str
    project_id: str
    task_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=utc_now, nullable=False, index=True)
