FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
COPY backend/shared ./backend/shared
COPY backend/services/catalog ./backend/services/catalog

RUN npm ci
RUN npm --workspace=@ecom/shared run build
RUN npm --workspace=catalog-service run prisma:generate
RUN npm --workspace=catalog-service run build
RUN cp -r backend/services/catalog/src/generated backend/services/catalog/dist/generated

FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/backend/shared/package*.json ./backend/shared/
COPY --from=builder /app/backend/shared/dist ./backend/shared/dist
COPY --from=builder /app/backend/services/catalog/package*.json ./backend/services/catalog/
COPY --from=builder /app/backend/services/catalog/dist ./backend/services/catalog/dist
COPY --from=builder /app/node_modules ./node_modules

WORKDIR /app/backend/services/catalog

EXPOSE 3002

CMD ["node", "dist/index.js"]
