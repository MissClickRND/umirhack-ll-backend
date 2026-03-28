# User Service

Использует общий файл окружения:

- `backend/.env`

Ключевые переменные:

```env
DATABASE_URL=postgresql://admin:admin@localhost:5432/backend_db
TCP_PORT=4001
```

```bash
cd backend/services/user-service
npm i
npx prisma generate
npm run start:dev
```

Сервис поднимает Nest microservice по TCP и обрабатывает операции пользователей.
