from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from .models import NoteModel
from .schemas import NoteCreate, NoteUpdate


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def get_note_for_user(db: Session, note_id: int, user_id: str) -> NoteModel:
    note = (
        db.query(NoteModel)
        .filter(NoteModel.id == note_id, NoteModel.user_id == user_id)
        .first()
    )

    if not note or note.user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Заметка не найдена",
        )

    return note


def create_note(db: Session, user_id: str, payload: NoteCreate) -> NoteModel:
    note = NoteModel(
        user_id=user_id,
        title=payload.title,
        body=payload.body,
    )
    db.add(note)
    db.commit()
    db.refresh(note)
    return note


def list_notes(db: Session, user_id: str) -> list[NoteModel]:
    return (
        db.query(NoteModel)
        .filter(NoteModel.user_id == user_id)
        .order_by(NoteModel.created_at.desc())
        .all()
    )


def update_note(
    db: Session,
    note_id: int,
    user_id: str,
    payload: NoteUpdate,
) -> NoteModel:
    note = get_note_for_user(db, note_id, user_id)

    if payload.title is not None:
        note.title = payload.title
    if payload.body is not None:
        note.body = payload.body

    note.updated_at = utc_now()
    db.commit()
    db.refresh(note)
    return note


def delete_note(db: Session, note_id: int, user_id: str) -> NoteModel:
    note = get_note_for_user(db, note_id, user_id)
    db.delete(note)
    db.commit()
    return note
