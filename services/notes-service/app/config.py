import os
import re
from typing import Optional


def parse_cors_origins(raw: Optional[str]) -> list[str]:
    if not raw:
        return ["http://localhost:5173", "http://localhost:3000"]

    return [origin.strip() for origin in raw.split(",") if origin.strip()]


def parse_cors_credentials(raw: Optional[str]) -> bool:
    return (raw or "true").lower() == "true"


CORS_ORIGINS = parse_cors_origins(os.getenv("CORS_ORIGINS"))
CORS_CREDENTIALS = parse_cors_credentials(os.getenv("CORS_CREDENTIALS"))

NOTES_DATABASE_URL = os.getenv(
    "NOTES_DATABASE_URL",
    "postgresql+psycopg2://postgres:postgres@postgres:5432/backnew",
)
NOTES_DB_SCHEMA = os.getenv("NOTES_DB_SCHEMA", "notes")

if not re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", NOTES_DB_SCHEMA):
    raise ValueError("NOTES_DB_SCHEMA должен содержать только буквы, цифры и _")
