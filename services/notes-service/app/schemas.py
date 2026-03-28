from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class UserContext(BaseModel):
    id: str
    email: Optional[str] = None


class NoteCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1)


class NoteUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    body: Optional[str] = Field(default=None, min_length=1)


class NoteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: str
    title: str
    body: str
    created_at: datetime
    updated_at: datetime
