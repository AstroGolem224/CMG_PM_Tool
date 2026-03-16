from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlmodel import SQLModel


class ColumnRead(SQLModel):
    id: str
    project_id: str
    name: str
    kind: str
    position: int
    color: str
    created_at: datetime


class ProjectCreate(SQLModel):
    name: str
    description: str = ""
    color: str = "#6366f1"


class ProjectUpdate(SQLModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None


class ProjectRead(SQLModel):
    id: str
    name: str
    description: str
    color: str
    status: str
    created_at: datetime
    updated_at: datetime
    columns: list[ColumnRead] | None = None


class ColumnCreate(SQLModel):
    name: str
    color: str = "#475569"


class ColumnUpdate(SQLModel):
    name: Optional[str] = None
    color: Optional[str] = None
    kind: Optional[str] = None


class ColumnReorder(SQLModel):
    column_ids: list[str]


class LabelRead(SQLModel):
    id: str
    project_id: str
    name: str
    color: str


class ProjectViewCreate(SQLModel):
    name: str
    is_pinned: bool = False
    is_default: bool = False
    label_ids: list[str] = []
    priorities: list[str] = []
    completion: str = "all"


class ProjectViewUpdate(SQLModel):
    name: Optional[str] = None
    is_pinned: Optional[bool] = None
    is_default: Optional[bool] = None
    label_ids: list[str] | None = None
    priorities: list[str] | None = None
    completion: Optional[str] = None


class ProjectViewReorder(SQLModel):
    is_pinned: bool
    view_ids: list[str]


class ProjectViewRead(SQLModel):
    id: str
    project_id: str
    name: str
    is_pinned: bool
    is_default: bool
    position: int
    label_ids: list[str]
    priorities: list[str]
    completion: str
    created_at: datetime
    updated_at: datetime


class CommentRead(SQLModel):
    id: str
    task_id: str
    content: str
    created_at: datetime
    updated_at: datetime


class TaskCreate(SQLModel):
    project_id: str
    column_id: str
    title: str
    description: str = ""
    priority: str = "medium"
    deadline: datetime | None = None


class TaskUpdate(SQLModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    deadline: datetime | None = None


class TaskMove(SQLModel):
    column_id: str
    position: int


class TaskReorder(SQLModel):
    column_id: str
    task_ids: list[str]


class TaskBulkAction(SQLModel):
    task_ids: list[str]
    operation: str
    column_id: Optional[str] = None
    priority: Optional[str] = None


class TaskBulkActionResult(SQLModel):
    updated: int


class TaskRead(SQLModel):
    id: str
    project_id: str
    column_id: str
    title: str
    description: str
    priority: str
    position: int
    deadline: datetime | None = None
    created_at: datetime
    updated_at: datetime
    labels: list[LabelRead] | None = None
    comments: list[CommentRead] | None = None


class LabelCreate(SQLModel):
    project_id: str
    name: str
    color: str


class LabelUpdate(SQLModel):
    name: Optional[str] = None
    color: Optional[str] = None


class CommentCreate(SQLModel):
    task_id: str
    content: str


class CommentUpdate(SQLModel):
    content: str


class DashboardStats(SQLModel):
    total_tasks: int
    in_progress: int
    completed: int
    overdue: int


class DeadlineItem(SQLModel):
    task_id: str
    task_title: str
    project_id: str
    project_name: str
    deadline: datetime
    priority: str


class ActivityItem(SQLModel):
    id: str
    action: str
    task_title: str
    project_name: str
    timestamp: datetime


class DashboardLabelItem(SQLModel):
    id: str
    project_id: str
    project_name: str
    name: str
    color: str


class RuntimeInfo(SQLModel):
    app_name: str
    version: str
    environment: str
    api_base: str
    frontend_origin: str
    database_path: str
    seeded_demo: bool
    current_time: datetime
