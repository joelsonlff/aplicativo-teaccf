# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY backend/package*.json ./backend/
COPY shared/package*.json ./shared/

RUN npm ci --workspace=backend --workspace=shared

COPY shared/ ./shared/
COPY backend/ ./backend/

RUN npm run build --workspace=backend

# Production stage
FROM node:20-alpine AS production

RUN apk add --no-cache tini

WORKDIR /app

ENV NODE_ENV=production

# npm workspaces hoisted: todas as dependências vivem no node_modules da raiz
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/backend/src/core/database/migrations ./migrations

EXPOSE 3000

# tini como PID 1 para correto tratamento de sinais
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["sh", "-c", "./node_modules/.bin/node-pg-migrate up -m migrations && node dist/app.js"]
