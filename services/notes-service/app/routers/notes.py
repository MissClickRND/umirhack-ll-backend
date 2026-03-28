from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..crud import (
    create_note,
    delete_note,
    get_note_for_user,
    list_notes,
    update_note,
)
from ..db import get_db
from ..deps import get_user_context
from ..schemas import NoteCreate, NoteRead, NoteUpdate, UserContext

router = APIRouter()


@router.post("/notes", response_model=NoteRead)
def create_note_endpoint(
    payload: NoteCreate,
    user: UserContext = Depends(get_user_context),
    db: Session = Depends(get_db),
) -> NoteRead:
    note = create_note(db, user.id, payload)
    return NoteRead.model_validate(note)


@router.get("/notes", response_model=list[NoteRead])
def list_notes_endpoint(
    user: UserContext = Depends(get_user_context),
    db: Session = Depends(get_db),
) -> list[NoteRead]:
    notes = list_notes(db, user.id)
    return [NoteRead.model_validate(note) for note in notes]


@router.get("/notes/{note_id}", response_model=NoteRead)
def get_note_endpoint(
    note_id: int,
    user: UserContext = Depends(get_user_context),
    db: Session = Depends(get_db),
) -> NoteRead:
    note = get_note_for_user(db, note_id, user.id)
    return NoteRead.model_validate(note)


@router.patch("/notes/{note_id}", response_model=NoteRead)
def update_note_endpoint(
    note_id: int,
    payload: NoteUpdate,
    user: UserContext = Depends(get_user_context),
    db: Session = Depends(get_db),
) -> NoteRead:
    note = update_note(db, note_id, user.id, payload)
    return NoteRead.model_validate(note)


@router.delete("/notes/{note_id}", response_model=NoteRead)
def delete_note_endpoint(
    note_id: int,
    user: UserContext = Depends(get_user_context),
    db: Session = Depends(get_db),
) -> NoteRead:
    note = delete_note(db, note_id, user.id)
    return NoteRead.model_validate(note)
