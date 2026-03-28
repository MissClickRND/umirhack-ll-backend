FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY src ./src

FROM base AS development
CMD ["npm", "run", "start:dev"]

FROM base AS production
ENV NODE_ENV=production
RUN npm prune --omit=dev
CMD ["npm", "run", "start"]
