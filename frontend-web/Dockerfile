# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY frontend-web/package*.json ./frontend-web/
COPY shared/package*.json ./shared/

RUN npm ci --workspace=frontend-web --workspace=shared

COPY shared/ ./shared/
COPY frontend-web/ ./frontend-web/

RUN npm run build --workspace=frontend-web

# Production stage — Nginx serve static files
FROM nginx:1.27-alpine AS production

COPY --from=builder /app/frontend-web/dist /usr/share/nginx/html
COPY infrastructure/nginx/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
