# Post Service (FastAPI)

FastAPI сервис для CRUD операций с постами.

Эндпоинты `/posts/*` защищены JWT access token из `auth-service`.

На каждый запрос post-service делает проверку через `auth-service` endpoint `/auth/status`.

- можно передавать `Authorization: Bearer <accessToken>`
- или cookie `accessToken`

Требуемая переменная окружения:

- `AUTH_SERVICE_URL` (например `http://localhost:3001`)

## Запуск локально в Docker

Из корня backend:

```bash
docker compose up -d --build post-service
```

Health check:

- <http://localhost:8002/health>

Swagger:

- <http://localhost:8002/docs>

Для вызова защищенных ручек в Swagger:

1. Получи `accessToken` через `auth-service`.
2. Нажми `Authorize` и вставь `Bearer <accessToken>`.
