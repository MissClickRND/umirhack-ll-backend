# Старт

Использует общий файл окружения:

- `backend/.env`

Ключевые переменные:

```env
PORT=3000
USER_SERVICE_HOST=localhost
USER_SERVICE_PORT=4001
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

- Auth сервис: <http://localhost:3000/docs>

Одна команда для запуска всего backend-стека (PostgreSQL + user-service + auth-service):

```bash
npm run up
```
