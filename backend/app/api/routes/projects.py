from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.exc import IntegrityError
from sqlmodel import Session, select

from app.db import get_session
from app.models import Column, ColumnKind, Label, Project, ProjectStatus, ProjectView
from app.schemas import (
    ColumnCreate,
    ColumnRead,
    ColumnReorder,
    ColumnUpdate,
    LabelRead,
    ProjectCreate,
    ProjectRead,
    ProjectUpdate,
    ProjectViewCreate,
    ProjectViewReorder,
    ProjectViewRead,
    ProjectViewUpdate,
)
from app.services.activity import record_event
from app.services.board import (
    VALID_COLUMN_KINDS,
    create_default_columns,
    ensure_active_project,
    get_project_or_404,
    parse_filter_list,
    project_done_columns,
    serialize_filter_list,
    touch,
)


router = APIRouter(prefix="/projects", tags=["projects"])
VALID_VIEW_COMPLETION = {"all", "open", "done"}


def _serialize_view(view: ProjectView) -> ProjectViewRead:
    return ProjectViewRead(
        id=view.id,
        project_id=view.project_id,
        name=view.name,
        is_pinned=view.is_pinned,
        is_default=view.is_default,
        position=view.position,
        label_ids=parse_filter_list(view.label_ids),
        priorities=parse_filter_list(view.priorities),
        completion=view.completion,
        created_at=view.created_at,
        updated_at=view.updated_at,
    )


def _list_project_views(session: Session, project_id: str) -> list[ProjectView]:
    return session.exec(
        select(ProjectView)
        .where(ProjectView.project_id == project_id)
        .order_by(ProjectView.is_pinned.desc(), ProjectView.is_default.desc(), ProjectView.position, ProjectView.updated_at.desc())
    ).all()


def _next_view_position(session: Session, project_id: str, is_pinned: bool) -> int:
    views = session.exec(
        select(ProjectView)
        .where(ProjectView.project_id == project_id, ProjectView.is_pinned == is_pinned)
        .order_by(ProjectView.position.desc())
    ).all()
    return 0 if not views else views[0].position + 1


def _normalize_view_positions(session: Session, project_id: str, is_pinned: bool) -> None:
    views = session.exec(
        select(ProjectView)
        .where(ProjectView.project_id == project_id, ProjectView.is_pinned == is_pinned)
        .order_by(ProjectView.position, ProjectView.updated_at.desc())
    ).all()
    for index, view in enumerate(views):
        if view.position != index:
            view.position = index
            touch(view)
            session.add(view)


def _set_default_view(session: Session, project_id: str, view_id: str | None) -> None:
    views = session.exec(select(ProjectView).where(ProjectView.project_id == project_id)).all()
    for view in views:
        next_default = view.id == view_id if view_id else False
        if view.is_default != next_default:
            view.is_default = next_default
            touch(view)
            session.add(view)
        if next_default and not view.is_pinned:
            view.is_pinned = True
            view.position = _next_view_position(session, project_id, True)
            touch(view)
            session.add(view)


def _raise_project_view_integrity_error(session: Session, exc: IntegrityError) -> None:
    session.rollback()
    message = str(getattr(exc, "orig", exc)).lower()
    if (
        "projectview.project_id, projectview.name" in message
        or "project_view.project_id, project_view.name" in message
    ):
        detail = "View name already exists"
    elif "projectview.project_id" in message or "project_view.project_id" in message:
        detail = "Project already has a default view"
    else:
        detail = "View could not be saved"
    raise HTTPException(status_code=400, detail=detail) from exc


def _ensure_done_column_guardrail(
    session: Session,
    project_id: str,
    column: Column,
    next_kind: str,
) -> None:
    if next_kind == column.kind:
        return

    done_columns = project_done_columns(session, project_id)
    if column.kind == ColumnKind.DONE and next_kind != ColumnKind.DONE and len(done_columns) == 1:
        raise HTTPException(status_code=400, detail="Project needs at least one done column")

    if next_kind == ColumnKind.DONE:
        for item in done_columns:
            if item.id != column.id:
                item.kind = ColumnKind.CUSTOM
                session.add(item)


@router.get("", response_model=list[ProjectRead])
def list_projects(session: Session = Depends(get_session)) -> list[Project]:
    return session.exec(select(Project).order_by(Project.updated_at.desc())).all()


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate, session: Session = Depends(get_session)) -> Project:
    project = Project.model_validate(payload)
    session.add(project)
    session.commit()
    session.refresh(project)
    create_default_columns(session, project)
    record_event(session, action="created project", project=project)
    session.commit()
    session.refresh(project)
    return project


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(project_id: str, session: Session = Depends(get_session)) -> Project:
    project = get_project_or_404(session, project_id)
    project.columns.sort(key=lambda column: column.position)
    return project


@router.put("/{project_id}", response_model=ProjectRead)
def update_project(
    project_id: str,
    payload: ProjectUpdate,
    session: Session = Depends(get_session),
) -> Project:
    project = get_project_or_404(session, project_id)
    ensure_active_project(project)
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        return project

    for field, value in updates.items():
        setattr(project, field, value)
    touch(project)
    session.add(project)
    session.commit()
    session.refresh(project)
    return project


@router.patch("/{project_id}/archive", response_model=ProjectRead)
def archive_project(project_id: str, session: Session = Depends(get_session)) -> Project:
    project = get_project_or_404(session, project_id)
    project.status = ProjectStatus.ARCHIVED
    touch(project)
    session.add(project)
    record_event(session, action="archived project", project=project)
    session.commit()
    session.refresh(project)
    return project


@router.patch("/{project_id}/restore", response_model=ProjectRead)
def restore_project(project_id: str, session: Session = Depends(get_session)) -> Project:
    project = get_project_or_404(session, project_id)
    project.status = ProjectStatus.ACTIVE
    touch(project)
    session.add(project)
    record_event(session, action="restored project", project=project)
    session.commit()
    session.refresh(project)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(project_id: str, session: Session = Depends(get_session)) -> Response:
    project = get_project_or_404(session, project_id)
    session.delete(project)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{project_id}/columns", response_model=list[ColumnRead])
def list_columns(project_id: str, session: Session = Depends(get_session)) -> list[Column]:
    get_project_or_404(session, project_id)
    return session.exec(
        select(Column).where(Column.project_id == project_id).order_by(Column.position)
    ).all()


@router.post("/{project_id}/columns", response_model=ColumnRead, status_code=status.HTTP_201_CREATED)
def create_column(
    project_id: str,
    payload: ColumnCreate,
    session: Session = Depends(get_session),
) -> Column:
    project = get_project_or_404(session, project_id)
    ensure_active_project(project)
    existing = session.exec(
        select(Column).where(Column.project_id == project_id).order_by(Column.position.desc())
    ).first()
    column = Column(
        project_id=project_id,
        name=payload.name,
        color=payload.color,
        position=0 if not existing else existing.position + 1,
    )
    session.add(column)
    touch(project)
    session.add(project)
    session.commit()
    session.refresh(column)
    return column


@router.get("/{project_id}/labels", response_model=list[LabelRead])
def list_labels(project_id: str, session: Session = Depends(get_session)) -> list[Label]:
    get_project_or_404(session, project_id)
    return session.exec(select(Label).where(Label.project_id == project_id).order_by(Label.name)).all()


@router.get("/{project_id}/views", response_model=list[ProjectViewRead])
def list_project_views(project_id: str, session: Session = Depends(get_session)) -> list[ProjectViewRead]:
    get_project_or_404(session, project_id)
    views = _list_project_views(session, project_id)
    return [_serialize_view(view) for view in views]


@router.post("/{project_id}/views", response_model=ProjectViewRead, status_code=status.HTTP_201_CREATED)
def create_project_view(
    project_id: str,
    payload: ProjectViewCreate,
    session: Session = Depends(get_session),
) -> ProjectViewRead:
    project = get_project_or_404(session, project_id)
    ensure_active_project(project)
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="View name is required")
    if payload.completion not in VALID_VIEW_COMPLETION:
        raise HTTPException(status_code=400, detail="Invalid completion filter")

    existing_views = session.exec(select(ProjectView).where(ProjectView.project_id == project_id)).all()
    existing = session.exec(
        select(ProjectView).where(ProjectView.project_id == project_id, ProjectView.name == payload.name.strip())
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="View name already exists")

    is_default = payload.is_default or not existing_views
    is_pinned = payload.is_pinned or is_default
    view = ProjectView(
        project_id=project_id,
        name=payload.name.strip(),
        is_pinned=is_pinned,
        is_default=is_default,
        position=_next_view_position(session, project_id, is_pinned),
        label_ids=serialize_filter_list(payload.label_ids),
        priorities=serialize_filter_list(payload.priorities),
        completion=payload.completion,
    )
    if is_default:
        _set_default_view(session, project_id, None)
    touch(project)
    session.add(project)
    session.add(view)
    try:
        session.commit()
    except IntegrityError as exc:
        _raise_project_view_integrity_error(session, exc)
    session.refresh(view)
    return _serialize_view(view)


@router.put("/{project_id}/views/{view_id}", response_model=ProjectViewRead)
def update_project_view(
    project_id: str,
    view_id: str,
    payload: ProjectViewUpdate,
    session: Session = Depends(get_session),
) -> ProjectViewRead:
    project = get_project_or_404(session, project_id)
    ensure_active_project(project)
    view = session.get(ProjectView, view_id)
    if not view or view.project_id != project_id:
        raise HTTPException(status_code=404, detail="View not found")

    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        return _serialize_view(view)

    next_name = updates.get("name", view.name)
    if not str(next_name).strip():
        raise HTTPException(status_code=400, detail="View name is required")
    if "completion" in updates and updates["completion"] not in VALID_VIEW_COMPLETION:
        raise HTTPException(status_code=400, detail="Invalid completion filter")

    existing = session.exec(
        select(ProjectView).where(
            ProjectView.project_id == project_id,
            ProjectView.name == str(next_name).strip(),
            ProjectView.id != view_id,
        )
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="View name already exists")

    next_default = updates.get("is_default", view.is_default)
    next_pinned = True if next_default else updates.get("is_pinned", view.is_pinned)
    previous_group = view.is_pinned

    view.name = str(next_name).strip()
    view.is_pinned = next_pinned
    view.is_default = next_default
    if "label_ids" in updates:
        view.label_ids = serialize_filter_list(updates["label_ids"] or [])
    if "priorities" in updates:
        view.priorities = serialize_filter_list(updates["priorities"] or [])
    if "completion" in updates:
        view.completion = updates["completion"]
    if previous_group != next_pinned:
        view.position = _next_view_position(session, project_id, next_pinned)
    touch(view)
    touch(project)
    session.add(view)
    session.add(project)
    if next_default:
        _set_default_view(session, project_id, view.id)
    elif "is_default" in updates and not next_default:
        _set_default_view(session, project_id, None)
    try:
        session.commit()
    except IntegrityError as exc:
        _raise_project_view_integrity_error(session, exc)
    if previous_group != next_pinned:
        _normalize_view_positions(session, project_id, previous_group)
        _normalize_view_positions(session, project_id, next_pinned)
        session.commit()
    session.refresh(view)
    return _serialize_view(view)


@router.patch("/{project_id}/views/reorder", status_code=status.HTTP_204_NO_CONTENT)
def reorder_project_views(
    project_id: str,
    payload: ProjectViewReorder,
    session: Session = Depends(get_session),
) -> Response:
    project = get_project_or_404(session, project_id)
    ensure_active_project(project)
    views = session.exec(
        select(ProjectView)
        .where(ProjectView.project_id == project_id, ProjectView.is_pinned == payload.is_pinned)
        .order_by(ProjectView.position, ProjectView.updated_at.desc())
    ).all()
    view_map = {view.id: view for view in views}
    if set(view_map) != set(payload.view_ids):
        raise HTTPException(status_code=400, detail="View reorder payload does not match project views")

    for index, view_id in enumerate(payload.view_ids):
        view = view_map[view_id]
        view.position = index
        touch(view)
        session.add(view)
    touch(project)
    session.add(project)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put("/{project_id}/columns/{column_id}", response_model=ColumnRead)
def update_column(
    project_id: str,
    column_id: str,
    payload: ColumnUpdate,
    session: Session = Depends(get_session),
) -> Column:
    project = get_project_or_404(session, project_id)
    ensure_active_project(project)
    column = session.get(Column, column_id)
    if not column or column.project_id != project_id:
        raise HTTPException(status_code=404, detail="Column not found")

    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        return column

    next_kind = updates.get("kind", column.kind)
    if next_kind not in VALID_COLUMN_KINDS:
        raise HTTPException(status_code=400, detail="Invalid column kind")
    _ensure_done_column_guardrail(session, project_id, column, next_kind)

    for field, value in updates.items():
        setattr(column, field, value)
    touch(project)
    session.add(column)
    session.add(project)
    session.commit()
    session.refresh(column)
    return column


@router.patch("/{project_id}/columns/reorder", status_code=status.HTTP_204_NO_CONTENT)
def reorder_columns(
    project_id: str,
    payload: ColumnReorder,
    session: Session = Depends(get_session),
) -> Response:
    project = get_project_or_404(session, project_id)
    ensure_active_project(project)
    columns = session.exec(
        select(Column).where(Column.project_id == project_id).order_by(Column.position)
    ).all()
    column_map = {column.id: column for column in columns}
    if set(column_map) != set(payload.column_ids):
        raise HTTPException(status_code=400, detail="Column reorder payload does not match project columns")

    for index, column_id in enumerate(payload.column_ids):
        column = column_map[column_id]
        column.position = index
        session.add(column)
    touch(project)
    session.add(project)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/{project_id}/columns/{column_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_column(project_id: str, column_id: str, session: Session = Depends(get_session)) -> Response:
    project = get_project_or_404(session, project_id)
    ensure_active_project(project)
    column = session.get(Column, column_id)
    if not column or column.project_id != project_id:
        raise HTTPException(status_code=404, detail="Column not found")
    if column.kind == ColumnKind.DONE:
        raise HTTPException(status_code=400, detail="Done column cannot be deleted")
    if column.tasks:
        raise HTTPException(status_code=400, detail="Column must be empty before deletion")

    deleted_position = column.position
    session.delete(column)
    remaining = session.exec(
        select(Column).where(Column.project_id == project_id).order_by(Column.position)
    ).all()
    for item in remaining:
        if item.position > deleted_position:
            item.position -= 1
            session.add(item)
    touch(project)
    session.add(project)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.delete("/{project_id}/views/{view_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project_view(project_id: str, view_id: str, session: Session = Depends(get_session)) -> Response:
    project = get_project_or_404(session, project_id)
    ensure_active_project(project)
    view = session.get(ProjectView, view_id)
    if not view or view.project_id != project_id:
        raise HTTPException(status_code=404, detail="View not found")
    deleted_group = view.is_pinned
    session.delete(view)
    touch(project)
    session.add(project)
    session.commit()
    _normalize_view_positions(session, project_id, deleted_group)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
