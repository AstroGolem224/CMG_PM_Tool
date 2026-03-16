from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlmodel import Session

from app.db import get_session
from app.models import Label
from app.schemas import LabelCreate, LabelRead, LabelUpdate
from app.services.board import ensure_active_project, get_project_or_404, touch


router = APIRouter(prefix="/labels", tags=["labels"])


@router.post("", response_model=LabelRead, status_code=status.HTTP_201_CREATED)
def create_label(payload: LabelCreate, session: Session = Depends(get_session)) -> Label:
    project = get_project_or_404(session, payload.project_id)
    ensure_active_project(project)
    label = Label.model_validate(payload)
    session.add(label)
    touch(project)
    session.add(project)
    session.commit()
    session.refresh(label)
    return label


@router.put("/{label_id}", response_model=LabelRead)
def update_label(label_id: str, payload: LabelUpdate, session: Session = Depends(get_session)) -> Label:
    label = session.get(Label, label_id)
    if not label:
        raise HTTPException(status_code=404, detail="Label not found")
    project = get_project_or_404(session, label.project_id)
    ensure_active_project(project)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(label, field, value)
    session.add(label)
    touch(project)
    session.add(project)
    session.commit()
    session.refresh(label)
    return label


@router.delete("/{label_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_label(label_id: str, session: Session = Depends(get_session)) -> Response:
    label = session.get(Label, label_id)
    if label:
        project = get_project_or_404(session, label.project_id)
        ensure_active_project(project)
        session.delete(label)
        touch(project)
        session.add(project)
        session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
