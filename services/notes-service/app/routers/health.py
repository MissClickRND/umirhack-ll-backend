from fastapi import APIRouter
from sqlalchemy import text

from ..db import engine

router = APIRouter()


@router.get("/health")
def health() -> dict:
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return {
        "service": "notes-service",
        "status": "ok",
        "database": "ok",
    }
