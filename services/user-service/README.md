# User Service

Использует общий файл окружения:

- `backend/.env`

Ключевые переменные:

```env
DATABASE_URL=postgresql://admin:admin@localhost:5432/backend_db
USER_SERVICE_PORT=3002
TCP_PORT=4001
JWT_ACCESS_SECRET=...
```

```bash
cd backend/services/user-service
npm i
npx prisma generate
npm run start:dev
```

Сервис поднимает:

- HTTP API на `PORT` (`/users/*`)
- TCP microservice на `TCP_PORT` (внутренние message patterns)

Swagger:

- <http://localhost:3002/docs>

Основная доменная разработка пользователей теперь живет целиком в этом сервисе.
