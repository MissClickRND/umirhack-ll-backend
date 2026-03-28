# Backend: запуск и развитие микросервисов

## 1. Состав backend

- auth-service (NestJS, HTTP, по умолчанию 3001, API gateway/proxy)
- user-service (NestJS, HTTP 3002 + TCP 4001)
- post-service (FastAPI, HTTP, по умолчанию 8002)
- PostgreSQL (по умолчанию 5432)

Все сервисы работают с общей БД backend_db.

## 2. Что нужно перед запуском

- Docker + Docker Compose
- Node.js 20+ и npm
- Файл backend/.env с переменными окружения

Важно: все команды ниже выполняются из папки backend, если явно не сказано иное.

## 3. Переменные окружения

Сервисам нужен единый файл backend/.env.

Минимальный набор переменных:

```env
POSTGRES_USER=admin
POSTGRES_PASSWORD=admin
POSTGRES_DB=backend_db

# Local development DB URL (when running services from host)
DATABASE_URL=postgresql://admin:admin@localhost:5432/backend_db

# Docker-internal DB URL (when services run in docker compose)
DATABASE_URL_DOCKER=postgresql://admin:admin@postgres:5432/backend_db

PORT=3001
USER_SERVICE_PORT=3002
TCP_PORT=4001
POST_SERVICE_PORT=8002

USER_SERVICE_URL=http://localhost:3002
POST_SERVICE_URL=http://localhost:8002
AUTH_SERVICE_URL=http://localhost:3001

JWT_ACCESS_SECRET=access_secret_very_long
JWT_REFRESH_SECRET=refresh_secret_very_long
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

COOKIE_SECURE=false
COOKIE_SAMESITE=lax

# Comma-separated list for credentialed CORS
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001,http://localhost:3002,http://127.0.0.1:3002,http://localhost:8002,http://127.0.0.1:8002

```

## 4. Локальный запуск (dev)

### Рекомендуемый режим (гибрид)

```bash
cd backend
npm install
npm run start:dev
```

Что делает start:dev:

- останавливает контейнеры auth-service, user-service, post-service (если были запущены)
- поднимает PostgreSQL в Docker
- генерирует Prisma Client в Nest-сервисах
- запускает post-service в Docker c reload
- запускает auth-service и user-service локально в watch-режиме

Остановка dev-режима:

1. Нажать Ctrl+C в терминале, где запущен start:dev
2. Остановить контейнеры и БД:

```bash
cd backend
npm run containers:stop-services
npm run db:down
```

## 5. Прод-запуск (docker compose)

```bash
cd backend
npm install
npm run start:prod
```

Это поднимет все сервисы из docker-compose.yml в фоне.

Остановка:

```bash
cd backend
npm run stop:prod
```

## 6. Проверка после запуска

Frontend должен ходить на `http://localhost:3001`.

Auth-service на порту 3001 работает как gateway/proxy:

- `/auth/*` обслуживается самим auth-service
- `/users/*` проксируется в user-service
- `/posts/*` проксируется в post-service

- Auth Swagger: http://localhost:3001/docs
- User Swagger: http://localhost:3002/docs
- Post Swagger: http://localhost:8002/docs
- Post health: http://localhost:8002/health

Логи контейнеров (для прод-режима):

```bash
cd backend
docker compose logs -f auth-service
docker compose logs -f user-service
docker compose logs -f post-service
```

## 7. Prisma: как запускать миграции и генерацию

Сейчас единая схема призмы для nest

- `backend/prisma/schema.prisma`

`auth-service` и `user-service` генерируют клиент из локальных `prisma/schema.prisma`,
но эти файлы автоматически синхронизируются из `backend/prisma/schema.prisma`
скриптом оркестратора перед `prisma:generate`, `prisma:migrate:dev` и `prisma:reset`.

Команды оркестрации Prisma из папки `backend`:

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate:dev -- --name add_some_feature
npm run prisma:reset
```

Прямой вызов оркестратора (эквивалентно):

```bash
cd backend
node ./scripts/prisma-orchestrator.mjs generate
node ./scripts/prisma-orchestrator.mjs migrate-dev --name add_some_feature
node ./scripts/prisma-orchestrator.mjs reset
```

Если запускаешь из корня репозитория:

```bash
npm --prefix backend run prisma:generate
npm --prefix backend run prisma:migrate:dev -- --name add_some_feature
npm --prefix backend run prisma:reset
```

Важно: в shared БД только один сервис должен быть migration owner.
Важно: изменения структуры БД вносятся только в `backend/prisma/schema.prisma`, а не в сервисные копии.
Важно: `prisma:reset` удаляет данные в dev-БД и заново применяет миграции owner-сервиса.
Важно: не запускать `npx prisma:generate` (это не команда Prisma CLI и завершится ошибкой).

## 8. Как добавить новый Nest-сервис

Ниже чеклист, чтобы сервис запускался и локально, и в проде.

1. Создать сервис в backend/services/new-nest-service с базовой Nest-структурой:
   - package.json
   - src/main.ts
   - src/app.module.ts
   - Dockerfile

2. Настроить чтение общего env из backend/.env в ConfigModule.

3. Добавить сервис в backend/docker-compose.yml:
   - build context: ./services/new-nest-service
   - env_file: ./.env
   - нужные environment-переменные
   - ports
   - depends_on postgres (health)

4. Если сервис должен запускаться в гибридном dev-режиме локально:
   - обновить script dev:services в backend/package.json
   - добавить команду вида npm --prefix ./services/new-nest-service run start:dev

5. Если сервис использует Prisma:
   - использовать общую схему `backend/prisma/schema.prisma`
   - добавить его в backend/scripts/prisma-orchestrator.mjs в массив services
   - migrationOwner ставить true только у одного сервиса

6. Если сервис предоставляет HTTP API:
   - добавить Swagger в main.ts
   - проверить endpoint /docs

7. Обновить backend/.env новыми переменными порта/секретов.

8. Проверить запуск:
   - npm run start:dev
   - npm run start:prod

## 9. Как добавить новый Python-сервис (FastAPI)

1. Создать структуру backend/services/new-python-service:
   - app/main.py
   - requirements.txt
   - Dockerfile
   - (опционально) app/models.py, app/db.py, app/schemas.py

2. В main.py сделать минимум:
   - health endpoint (/health)
   - базовые роуты домена

3. Добавить сервис в backend/docker-compose.yml:
   - build context: ./services/new-python-service
   - env_file: ./.env
   - command: uvicorn app.main:app --host 0.0.0.0 --port ${YOUR_PORT}
   - ports
   - depends_on postgres (health), если нужен доступ к БД

4. Для удобной локальной разработки через Docker + reload добавить override в backend/docker-compose.dev.yml:
   - volume ./services/new-python-service:/app
   - command с --reload

5. Если сервис должен проверять авторизацию через auth-service:
   - использовать AUTH_SERVICE_URL
   - для prod (внутри docker network): http://auth-service:${PORT}
   - для dev-гибрида (контейнер -> локальный auth): http://host.docker.internal:${PORT}

6. Подключить запуск в scripts backend/package.json:
   - по аналогии с dev:post, если сервис нужен в start:dev

7. Проверить запуск:
   - docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build new-python-service
   - открыть /health и /docs

## 10. Мини-чеклист подключения любого нового сервиса

- Есть папка сервиса в backend/services
- Есть Dockerfile
- Добавлен в docker-compose.yml
- Добавлен в docker-compose.dev.yml (если нужен reload/dev override)
- Добавлены переменные в backend/.env
- Обновлены scripts в backend/package.json (если нужен в start:dev)
- Обновлен README сервиса и backend/README.md
