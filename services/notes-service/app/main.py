from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import CORS_CREDENTIALS, CORS_ORIGINS
from .db import init_db
from .routers.health import router as health_router
from .routers.notes import router as notes_router

app = FastAPI(
    title="notes-service",
    version="1.0.0",
    description="Simple notes CRUD service",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if "*" in CORS_ORIGINS else CORS_ORIGINS,
    allow_credentials=CORS_CREDENTIALS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()


app.include_router(health_router)
app.include_router(notes_router)
