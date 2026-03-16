from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import selectinload
from sqlmodel import Session, select

from app.db import get_session
from app.models import Comment, Label, Task, TaskLabelLink
from app.schemas import (
    CommentRead,
    TaskBulkAction,
    TaskBulkActionResult,
    TaskCreate,
    TaskMove,
    TaskRead,
    TaskReorder,
    TaskUpdate,
)
from app.services.activity import record_event
from app.services.board import (
    ensure_active_project,
    get_column_or_404,
    get_project_or_404,
    get_task_or_404,
    insert_task_at_position,
    normalize_positions,
    touch,
)


router = APIRouter(tags=["tasks"])
VALID_BULK_OPERATIONS = {"move", "priority", "delete"}


def _task_statement(task_id: str):
    return (
        select(Task)
        .where(Task.id == task_id)
        .options(selectinload(Task.labels), selectinload(Task.comments))
    )


def _project_tasks_statement(project_id: str):
    return (
        select(Task)
        .where(Task.project_id == project_id)
        .options(selectinload(Task.labels))
        .order_by(Task.column_id, Task.position)
    )


@router.get("/projects/{project_id}/tasks", response_model=list[TaskRead])
def list_project_tasks(project_id: str, session: Session = Depends(get_session)) -> list[Task]:
    get_project_or_404(session, project_id)
    return session.exec(_project_tasks_statement(project_id)).all()


@router.post("/tasks", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
def create_task(payload: TaskCreate, session: Session = Depends(get_session)) -> Task:
    project = get_project_or_404(session, payload.project_id)
    ensure_active_project(project)
    column = get_column_or_404(session, payload.column_id)
    if column.project_id != payload.project_id:
        raise HTTPException(status_code=400, detail="Column does not belong to project")

    last_task = session.exec(
        select(Task).where(Task.column_id == payload.column_id).order_by(Task.position.desc())
    ).first()
    task = Task(
        project_id=payload.project_id,
        column_id=payload.column_id,
        title=payload.title.strip(),
        description=payload.description,
        priority=payload.priority,
        deadline=payload.deadline,
        position=0 if not last_task else last_task.position + 1,
    )
    session.add(task)
    touch(project)
    session.add(project)
    record_event(session, action="created task", project=project, task=task)
    session.commit()
    return session.exec(_task_statement(task.id)).one()


@router.get("/tasks/{task_id}", response_model=TaskRead)
def get_task(task_id: str, session: Session = Depends(get_session)) -> Task:
    task = session.exec(_task_statement(task_id)).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.comments.sort(key=lambda comment: comment.created_at)
    return task


@router.put("/tasks/{task_id}", response_model=TaskRead)
def update_task(task_id: str, payload: TaskUpdate, session: Session = Depends(get_session)) -> Task:
    task = get_task_or_404(session, task_id)
    project = get_project_or_404(session, task.project_id)
    ensure_active_project(project)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    touch(task)
    touch(project)
    session.add(task)
    session.add(project)
    record_event(session, action="updated task", project=project, task=task)
    session.commit()
    return session.exec(_task_statement(task.id)).one()


@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(task_id: str, session: Session = Depends(get_session)) -> Response:
    task = get_task_or_404(session, task_id)
    project = get_project_or_404(session, task.project_id)
    ensure_active_project(project)
    previous_column_id = task.column_id
    record_event(session, action="deleted task", project=project, task_title=task.title)
    session.delete(task)
    touch(project)
    session.add(project)
    session.commit()
    normalize_positions(session, previous_column_id)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.patch("/tasks/{task_id}/move", response_model=TaskRead)
def move_task(task_id: str, payload: TaskMove, session: Session = Depends(get_session)) -> Task:
    task = get_task_or_404(session, task_id)
    project = get_project_or_404(session, task.project_id)
    ensure_active_project(project)
    target_column = get_column_or_404(session, payload.column_id)
    if target_column.project_id != task.project_id:
        raise HTTPException(status_code=400, detail="Target column does not belong to project")

    source_column_id = task.column_id
    insert_task_at_position(session, task, target_column.id, payload.position)
    touch(project)
    session.add(project)
    record_event(session, action="moved task", project=project, task=task)
    session.commit()

    normalize_positions(session, source_column_id)
    normalize_positions(session, target_column.id)
    session.commit()
    return session.exec(_task_statement(task.id)).one()


@router.patch("/tasks/reorder", status_code=status.HTTP_204_NO_CONTENT)
def reorder_tasks(payload: TaskReorder, session: Session = Depends(get_session)) -> Response:
    tasks = session.exec(
        select(Task).where(Task.column_id == payload.column_id).order_by(Task.position)
    ).all()
    task_map = {task.id: task for task in tasks}
    if set(task_map) != set(payload.task_ids):
        raise HTTPException(status_code=400, detail="Task reorder payload does not match column tasks")

    for index, task_id in enumerate(payload.task_ids):
        task = task_map[task_id]
        task.position = index
        touch(task)
        session.add(task)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/projects/{project_id}/tasks/bulk", response_model=TaskBulkActionResult)
def bulk_task_action(
    project_id: str,
    payload: TaskBulkAction,
    session: Session = Depends(get_session),
) -> TaskBulkActionResult:
    project = get_project_or_404(session, project_id)
    ensure_active_project(project)
    if payload.operation not in VALID_BULK_OPERATIONS:
        raise HTTPException(status_code=400, detail="Invalid bulk operation")
    if not payload.task_ids:
        return TaskBulkActionResult(updated=0)

    tasks = session.exec(
        select(Task).where(Task.project_id == project_id, Task.id.in_(payload.task_ids))
    ).all()
    task_map = {task.id: task for task in tasks}
    if set(task_map) != set(payload.task_ids):
        raise HTTPException(status_code=400, detail="Bulk payload does not match project tasks")

    if payload.operation == "move":
        if not payload.column_id:
            raise HTTPException(status_code=400, detail="Target column is required")
        target_column = get_column_or_404(session, payload.column_id)
        if target_column.project_id != project_id:
            raise HTTPException(status_code=400, detail="Target column does not belong to project")

        target_tasks = session.exec(
            select(Task).where(Task.column_id == payload.column_id, Task.id.notin_(payload.task_ids)).order_by(Task.position)
        ).all()
        next_position = len(target_tasks)
        touched_columns = {payload.column_id}
        for task in sorted(tasks, key=lambda item: item.position):
            touched_columns.add(task.column_id)
            insert_task_at_position(session, task, payload.column_id, next_position)
            next_position += 1
            record_event(session, action="moved task", project=project, task=task)
        touch(project)
        session.add(project)
        session.commit()
        for column_id in touched_columns:
            normalize_positions(session, column_id)
        session.commit()
        return TaskBulkActionResult(updated=len(tasks))

    if payload.operation == "priority":
        if not payload.priority:
            raise HTTPException(status_code=400, detail="Priority is required")
        for task in tasks:
            task.priority = payload.priority
            touch(task)
            session.add(task)
            record_event(session, action="updated task", project=project, task=task)
        touch(project)
        session.add(project)
        session.commit()
        return TaskBulkActionResult(updated=len(tasks))

    touched_columns = {task.column_id for task in tasks}
    for task in tasks:
        record_event(session, action="deleted task", project=project, task_title=task.title)
        session.delete(task)
    touch(project)
    session.add(project)
    session.commit()
    for column_id in touched_columns:
        normalize_positions(session, column_id)
    session.commit()
    return TaskBulkActionResult(updated=len(tasks))


@router.get("/tasks/{task_id}/comments", response_model=list[CommentRead])
def list_task_comments(task_id: str, session: Session = Depends(get_session)) -> list[Comment]:
    get_task_or_404(session, task_id)
    return session.exec(
        select(Comment).where(Comment.task_id == task_id).order_by(Comment.created_at)
    ).all()


@router.post("/tasks/{task_id}/labels/{label_id}", status_code=status.HTTP_204_NO_CONTENT)
def assign_label_to_task(task_id: str, label_id: str, session: Session = Depends(get_session)) -> Response:
    task = get_task_or_404(session, task_id)
    project = get_project_or_404(session, task.project_id)
    ensure_active_project(project)
    label = session.get(Label, label_id)
    if not label or label.project_id != task.project_id:
        raise HTTPException(status_code=404, detail="Label not found")

    exists = session.get(TaskLabelLink, (task_id, label_id))
    if not exists:
        session.add(TaskLabelLink(task_id=task_id, label_id=label_id))
        touch(task)
        touch(project)
        session.add(task)
        session.add(project)
        record_event(session, action="assigned label", project=project, task=task)
        session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/tasks/{task_id}/labels/{label_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_label_from_task(task_id: str, label_id: str, session: Session = Depends(get_session)) -> Response:
    task = get_task_or_404(session, task_id)
    project = get_project_or_404(session, task.project_id)
    ensure_active_project(project)
    link = session.get(TaskLabelLink, (task_id, label_id))
    if link:
        session.delete(link)
        touch(task)
        touch(project)
        session.add(task)
        session.add(project)
        record_event(session, action="removed label", project=project, task=task)
        session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
