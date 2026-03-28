import os
import json
from dataclasses import dataclass
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import Request as UrlRequest, urlopen

from fastapi import Depends, HTTPException, Request as FastAPIRequest, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

bearer_scheme = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class AuthContext:
    user_id: int
    email: str
    role: str


def _auth_service_url() -> str:
    return os.getenv("AUTH_SERVICE_URL", "http://localhost:3001").rstrip("/")


def _extract_access_token(
    request: FastAPIRequest,
    credentials: HTTPAuthorizationCredentials | None,
) -> str:
    if credentials and credentials.scheme.lower() == "bearer" and credentials.credentials:
        return credentials.credentials

    cookie_token = request.cookies.get("accessToken")
    if cookie_token:
        return cookie_token

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No access token",
    )


def require_authenticated_user(
    request: FastAPIRequest,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> AuthContext:
    token = _extract_access_token(request, credentials)

    status_url = f"{_auth_service_url()}/auth/status"
    cookie_token = quote(token, safe="")
    upstream_request = UrlRequest(
        status_url,
        method="GET",
        headers={
            "Accept": "application/json",
            "Authorization": f"Bearer {token}",
            "Cookie": f"accessToken={cookie_token}",
        },
    )

    try:
        with urlopen(upstream_request, timeout=5) as response:
            raw = response.read().decode("utf-8")
    except HTTPError as exc:
        if exc.code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Unauthorized",
            ) from None

        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Auth status error: HTTP {exc.code}",
        ) from None
    except URLError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Auth status is unavailable",
        ) from None

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Auth status returned non-JSON response",
        ) from None

    if not isinstance(payload, dict):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Auth status returned invalid payload",
        )

    data = payload.get("data")
    if isinstance(data, dict):
        payload = data

    user_payload = payload.get("user") if isinstance(payload.get("user"), dict) else payload
    if not isinstance(user_payload, dict):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Auth status did not return user payload",
        )

    user_id = user_payload.get("userId")
    email = user_payload.get("email")
    role = user_payload.get("role")

    if isinstance(user_id, str) and user_id.isdigit():
        user_id = int(user_id)

    if not isinstance(user_id, int):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Auth status returned invalid userId",
        )

    return AuthContext(
        user_id=user_id,
        email=email if isinstance(email, str) else "",
        role=role if isinstance(role, str) else "",
    )
