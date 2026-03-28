from typing import Optional

from fastapi import Header, HTTPException, status

from .schemas import UserContext


def get_user_context(
    x_user_id: Optional[str] = Header(default=None),
    x_user_email: Optional[str] = Header(default=None),
) -> UserContext:
    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Отсутствует заголовок x-user-id",
        )

    return UserContext(id=x_user_id, email=x_user_email)
