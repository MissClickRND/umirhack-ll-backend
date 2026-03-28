from fastapi import Depends, FastAPI, HTTPException, Query, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from .auth import AuthContext, require_authenticated_user
from .db import Base, engine, get_db
from .models import Post
from .schemas import PostCreate, PostRead, PostUpdate

app = FastAPI(title="Post Service", version="1.0.0")


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health() -> dict[str, bool]:
    return {"ok": True}


@app.get("/posts", response_model=list[PostRead])
def list_posts(
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
    _auth: AuthContext = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
) -> list[Post]:
    query = select(Post).order_by(Post.id.desc()).offset(skip).limit(limit)
    return list(db.execute(query).scalars().all())


@app.get("/posts/{post_id}", response_model=PostRead)
def get_post(
    post_id: int,
    _auth: AuthContext = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
) -> Post:
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    return post


@app.post("/posts", response_model=PostRead, status_code=status.HTTP_201_CREATED)
def create_post(
    payload: PostCreate,
    _auth: AuthContext = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
) -> Post:
    post = Post(
        title=payload.title,
        content=payload.content,
        published=payload.published,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


@app.put("/posts/{post_id}", response_model=PostRead)
def update_post(
    post_id: int,
    payload: PostUpdate,
    _auth: AuthContext = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
) -> Post:
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    if payload.title is not None:
        post.title = payload.title
    if payload.content is not None:
        post.content = payload.content
    if payload.published is not None:
        post.published = payload.published

    db.add(post)
    db.commit()
    db.refresh(post)
    return post


@app.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: int,
    _auth: AuthContext = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
) -> Response:
    post = db.get(Post, post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    db.delete(post)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
