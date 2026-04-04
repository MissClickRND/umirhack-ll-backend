## Local start

1. Run Postgres locally:

```bash
docker-compose up -d
```

2. Create `.env` (for local dev):

```env
DATABASE_URL=postgresql://admin:admin@localhost:5432/backend_db
PORT=3000
BACKEND_HOST_PORT=3000

JWT_ACCESS_SECRET=access_secret_very_long
JWT_REFRESH_SECRET=refresh_secret_very_long
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

COOKIE_SECURE=false
COOKIE_SAMESITE=lax
```

3. Start backend:

```bash
npx prisma generate
npm run start:dev
```

## CI/CD (GitHub Actions)

Workflow file: `.github/workflows/backend-ci-cd.yml`

Pipeline does the following:

1. On pull request and push to `main`: runs `npm ci` and `npm run build`.
2. On push to `main`: deploys to VPS via SSH.
3. On VPS: pulls latest `main` and runs `docker compose -f docker-compose.prod.yml up -d --build`.

## Required GitHub Secrets

Set these in repository settings:

1. `VPS_HOST`
2. `VPS_USER`
3. `VPS_SSH_KEY`
4. `BACKEND_PROJECT_DIR`

`BACKEND_PROJECT_DIR` is an absolute path on VPS to backend repository folder, for example:

```text
/opt/umirhack/backend
```

Recommended value: path to backend folder itself.

Also supported: superproject root path (for example `/opt/umirhack`), in this case deploy script auto-detects `backend/docker-compose.prod.yml`.

## VPS deploy via Docker

For VPS deploy use:

1. `Dockerfile`
2. `docker-compose.prod.yml`
3. `.env` on server (created from `.env.example`)

### Example `.env` for VPS (Docker)

Important: this is app/runtime `.env`, not GitHub Actions secrets.

```env
PORT=3000

POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=backnew

DATABASE_URL=postgresql://postgres:postgres@postgres:5432/backnew

JWT_ACCESS_SECRET=change-me-in-production
JWT_REFRESH_SECRET=change-me-in-production
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

COOKIE_SECURE=true
COOKIE_SAMESITE=none
COOKIE_DOMAIN=miss-click.ru
ACCESS_COOKIE_NAME=access_token
REFRESH_COOKIE_NAME=refresh_token

CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://miss-click.ru,https://miss-click.ru,https://www.miss-click.ru
CORS_CREDENTIALS=true
```

If port `3000` is already occupied on VPS, keep `PORT=3000` and set another external port, for example:

```env
BACKEND_HOST_PORT=3001
```

### Legacy env mapping from old microservices

Do not use these keys in current backend (they are obsolete for this service):

1. `NOTES_DATABASE_URL`
2. `NOTES_DB_SCHEMA`
3. `JWT_SECRET`
4. `JWT_ISSUER`
5. `ACCESS_TOKEN_TTL`
6. `REFRESH_TOKEN_TTL`

Rename key:

1. `COOKIE_SAME_SITE` -> `COOKIE_SAMESITE`

### First-time setup on VPS

1. Install Docker + Docker Compose plugin.
2. Clone backend repository to `BACKEND_PROJECT_DIR`.
3. Create `.env` in backend directory (use `.env.example`).
4. Push to `main` - deploy job will start containers automatically.
