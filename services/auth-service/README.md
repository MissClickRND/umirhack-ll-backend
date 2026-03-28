# Старт

Использует общий файл окружения:

- `backend/.env`

Ключевые переменные:

```env
PORT=3001
DATABASE_URL=postgresql://admin:admin@localhost:5432/backend_db
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
CORS_ORIGIN=http://localhost:5173,http://127.0.0.1:5173
```

```bash
cd ../../
docker compose up -d --build
```

Локальный запуск только auth-сервиса:

```bash
cd backend/services/auth-service
npx prisma generate
npm run start:dev
```

Swagger:

- Auth сервис: <http://localhost:3001/docs>

`auth-service` отвечает только за `/auth/*` и не содержит доменных клиентов/контроллеров конкретных сервисов.
