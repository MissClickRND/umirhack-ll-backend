FROM node:20-alpine AS base
WORKDIR /app
ENV DATABASE_URL=postgresql://postgres:postgres@localhost:5432/backnew?schema=auth
COPY package*.json ./
RUN npm install
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY tsconfig*.json ./
COPY src ./src

FROM base AS development
CMD ["npm", "run", "start:dev"]

FROM base AS build
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY prisma ./prisma
COPY prisma.config.ts ./
COPY --from=build /app/dist ./dist
CMD ["npm", "run", "start:prod"]
