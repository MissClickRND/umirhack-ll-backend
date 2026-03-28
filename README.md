# backnew microservices

Готовый production-oriented комплект микросервисов с единой авторизацией через httpOnly cookie, gateway-проксированием и общей конфигурацией из корневого `.env`.

Хранилище данных:

- `auth-service` (Nest) работает через Prisma 7 + PostgreSQL.
- `posts-service` (Nest) работает через Prisma 7 + PostgreSQL.
- `notes-service` (FastAPI) работает через PostgreSQL (SQLAlchemy).
- Моков хранения данных нет.

## Состав сервисов

- `auth-service` (NestJS): регистрация, логин, refresh, status, logout
- `auth-gate` (NestJS): централизованная проверка access JWT
- `posts-service` (NestJS): защищенный CRUD постов
- `notes-service` (FastAPI): защищенный CRUD заметок
- `auth-proxy` (Express): единая внешняя точка входа на `:3000`
- `postgres` (PostgreSQL 17): единая БД с отдельными схемами (`auth`, `posts`, `notes`)

## Конфигурация окружения

Все сервисы читают переменные из одного файла: `backnew/.env`.

Минимально важные переменные:

- `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`
- `AUTH_DATABASE_URL`, `POSTS_DATABASE_URL`, `NOTES_DATABASE_URL`, `NOTES_DB_SCHEMA`
- `JWT_SECRET`, `JWT_ISSUER`, `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL`
- `ACCESS_COOKIE_NAME`, `REFRESH_COOKIE_NAME`, `COOKIE_SECURE`, `COOKIE_SAME_SITE`, `COOKIE_DOMAIN`
- `AUTH_SERVICE_URL`, `AUTH_GATE_URL`, `POSTS_SERVICE_URL`, `NOTES_SERVICE_URL`
- `CORS_ORIGINS`, `CORS_CREDENTIALS`

Пример:

```env
NODE_ENV=development

AUTH_PROXY_PORT=3000
AUTH_SERVICE_PORT=3001
AUTH_GATE_PORT=3002
POSTS_SERVICE_PORT=3003
NOTES_SERVICE_PORT=3004
POSTGRES_PORT=5432

POSTGRES_HOST=postgres
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=backnew

AUTH_DATABASE_URL=postgresql://postgres:postgres@postgres:5432/backnew?schema=auth
POSTS_DATABASE_URL=postgresql://postgres:postgres@postgres:5432/backnew?schema=posts
NOTES_DATABASE_URL=postgresql+psycopg2://postgres:postgres@postgres:5432/backnew
NOTES_DB_SCHEMA=notes

AUTH_SERVICE_URL=http://auth-service:3001
AUTH_GATE_URL=http://auth-gate:3002
POSTS_SERVICE_URL=http://posts-service:3003
NOTES_SERVICE_URL=http://notes-service:3004

JWT_SECRET=super-secret-local-key
JWT_ACCESS_SECRET=super-secret-local-key
JWT_REFRESH_SECRET=super-secret-local-key
JWT_ISSUER=backnew-auth
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
ACCESS_TOKEN_TTL=15m
REFRESH_TOKEN_TTL=7d

ACCESS_COOKIE_NAME=access_token
REFRESH_COOKIE_NAME=refresh_token
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
COOKIE_DOMAIN=

CORS_ORIGINS=http://localhost:5173,http://localhost:3000
CORS_CREDENTIALS=true

```

`CORS_ORIGINS` можно указать списком через запятую или `*`.

`AUTH_DATABASE_URL` должен указывать на `?schema=auth`.
`POSTS_DATABASE_URL` должен указывать на `?schema=posts`.
`NOTES_DATABASE_URL` использует ту же БД, а схема FastAPI выбирается через `NOTES_DB_SCHEMA` (обычно `notes`).

## Запуск

### DEV

```bash
npm run start:dev
```

Команда запускается из корня `backnew` и поднимает все сервисы с live-reload и готовой БД.

Эквивалент напрямую через docker compose:

```bash
docker compose -f docker-compose.dev.yml up --build
```

### PROD

```bash
docker compose up --build -d
```

PROD также сам инициализирует Prisma-клиенты и синхронизирует схемы Nest-сервисов.

### Остановка

```bash
npm run stop:dev
```

Для остановки production-стека:

```bash
npm run stop:prod
```

## Swagger

Внешний Swagger gateway (основной для клиентов):

- `http://localhost:3000/docs`

## Prisma и PostgreSQL

Для Nest-сервисов Prisma синхронизация запускается автоматически:

- `prisma generate`
- `prisma db push`

Это выполняется в `start:dev` и `start:prod` у `auth-service` и `posts-service`.

Для FastAPI `notes-service` таблицы создаются автоматически при старте приложения.

Если нужно сбросить локальные данные PostgreSQL:

```bash
docker compose down -v
```

## Как добавить новый микросервис

Ниже рабочий шаблон именно для этого репозитория: сервис поднимается в `docker-compose`, проксируется через `auth-proxy` и появляется в gateway Swagger.

### 1) Общий чеклист (для любого стека)

- Создай папку `services/<service-name>`.
- Добавь сервис в `docker-compose.dev.yml` и `docker-compose.yml`:
  - `build.context: ./services/<service-name>`
  - `build.target: development` для dev и `production` для prod
  - `env_file: ./.env`
  - `environment` с `PORT: ${<SERVICE>_PORT:-30xx}`
  - `expose` с внутренним портом сервиса
  - для dev: `command` и `volumes` (по аналогии с текущими сервисами)
  - если нужна БД: `depends_on.postgres.condition: service_healthy`
- Добавь переменные в `.env` и `.env.example`:
  - `<SERVICE>_PORT=30xx`
  - `<SERVICE>_URL=http://<service-name>:30xx`
  - при БД: `<SERVICE>_DATABASE_URL=...` и/или `<SERVICE>_DB_SCHEMA=...`
- Подключи URL нового сервиса в `auth-proxy` (оба compose-файла, секция `auth-proxy.environment`) и добавь сервис в `auth-proxy.depends_on`.
- Обнови `services/auth-proxy/src/index.js`:
  - добавь новую переменную URL сервиса из env
  - добавь запись в `GET /docs/services`
  - добавь проксирование `/docs/<service-name>/openapi.json`
  - добавь проксирование бизнес-маршрута, обычно `/api/<resource>` (с `verifyAccess`, если маршрут защищенный)
- Обнови этот README: `Состав сервисов`, `Swagger`, `Внешние API через порт 3000`, `smoke-test`.

### 2) Шаблон для NestJS сервиса

- Удобная база:
  - `services/posts-service` — если нужен Prisma + PostgreSQL
  - `services/auth-gate` — если сервис без БД
- В `src/main.ts` обязательно оставь:
  - CORS на `CORS_ORIGINS` и `CORS_CREDENTIALS`
  - Swagger на `/docs` и `openapi.json` (gateway подтягивает именно `/openapi.json`)
  - запуск на `0.0.0.0` и порт из `PORT`
- Если используешь Prisma:
  - добавь `prisma/schema.prisma` с отдельной схемой БД (например `?schema=<service_schema>`)
  - оставь скрипты `prisma:generate` и `prisma:push` в `package.json`
  - вызывай их в `start:dev` и `start:prod` (как в `posts-service`)
- Для защищенных роутов принимай user-context из заголовков `x-user-id`, `x-user-email`, `x-user-role`.
- Роуты внутри сервиса делай без `/api` (например `/orders`), а префикс `/api` добавляй на уровне `auth-proxy`.

### 3) Шаблон для Python/FastAPI сервиса

- Удобная база: `services/notes-service`.
- Минимальный каркас:
  - `app/main.py` с `docs_url="/docs"` и `openapi_url="/openapi.json"`
  - `app/routers/health.py` с `GET /health`
  - router для бизнес-логики (например `/orders`)
  - CORS на основе `CORS_ORIGINS` и `CORS_CREDENTIALS`
- Для защищенных роутов добавь dependency по аналогии с `app/deps.py`, которая валидирует `x-user-id`.
- Если нужна БД:
  - вынеси конфиг в `app/config.py`
  - инициализируй подключение/таблицы в startup
  - используй отдельную схему через переменную `<SERVICE>_DB_SCHEMA` (если используешь схемы)
- Команды в compose:
  - dev: `uvicorn app.main:app --host 0.0.0.0 --port ${<SERVICE>_PORT:-30xx} --reload`
  - prod: `uvicorn app.main:app --host 0.0.0.0 --port ${<SERVICE>_PORT:-30xx}`

### 4) Проверка после подключения

- Запусти `npm run start:dev`.
- Проверь `http://localhost:3000/docs/services` — там должен появиться новый сервис.
- Проверь `http://localhost:3000/docs/<service-name>/openapi.json`.
- Прогоняй health и основной CRUD через gateway-маршрут.

## Важно

- Наружу проброшен только `3000`.
- Все защищенные роуты проходят через `auth-proxy` и `auth-gate`.
- Для production обязательно замени:
  - `JWT_SECRET`
  - `POSTGRES_PASSWORD`
  - `COOKIE_SECURE=true` (при HTTPS)
  - при необходимости `COOKIE_SAME_SITE` и `COOKIE_DOMAIN`
  - список `CORS_ORIGINS`
