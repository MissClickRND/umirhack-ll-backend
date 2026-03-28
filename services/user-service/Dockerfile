FROM node:22-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ENV DATABASE_URL=postgresql://admin:admin@localhost:5432/backend_db
RUN npx prisma generate && npm run build

EXPOSE 3002
EXPOSE 4001
CMD ["node", "dist/main"]
