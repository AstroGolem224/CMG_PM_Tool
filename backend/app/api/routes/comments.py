from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlmodel import Session

from app.db import get_session
from app.models import Comment
from app.schemas import CommentCreate, CommentRead, CommentUpdate
from app.services.activity import record_event
from app.services.board import get_project_or_404, get_task_or_404, touch


router = APIRouter(prefix="/comments", tags=["comments"])


@router.post("", response_model=CommentRead, status_code=status.HTTP_201_CREATED)
def create_comment(payload: CommentCreate, session: Session = Depends(get_session)) -> Comment:
    task = get_task_or_404(session, payload.task_id)
    project = get_project_or_404(session, task.project_id)
    comment = Comment(content=payload.content.strip(), task_id=payload.task_id)
    session.add(comment)
    touch(task)
    touch(project)
    session.add(task)
    session.add(project)
    record_event(session, action="commented on task", project=project, task=task)
    session.commit()
    session.refresh(comment)
    return comment


@router.put("/{comment_id}", response_model=CommentRead)
def update_comment(
    comment_id: str,
    payload: CommentUpdate,
    session: Session = Depends(get_session),
) -> Comment:
    comment = session.get(Comment, comment_id)
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    comment.content = payload.content.strip()
    touch(comment)
    session.add(comment)
    session.commit()
    session.refresh(comment)
    return comment


@router.delete("/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(comment_id: str, session: Session = Depends(get_session)) -> Response:
    comment = session.get(Comment, comment_id)
    if comment:
        session.delete(comment)
        session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
