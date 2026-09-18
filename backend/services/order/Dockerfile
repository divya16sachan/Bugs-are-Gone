FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY backend/shared ./backend/shared
COPY backend/services/order ./backend/services/order

RUN npm ci
RUN npm --workspace=@ecom/shared run build
RUN npm --workspace=order-service run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/backend/shared/package*.json ./backend/shared/
COPY --from=builder /app/backend/shared/dist ./backend/shared/dist
COPY --from=builder /app/backend/services/order/package*.json ./backend/services/order/
COPY --from=builder /app/backend/services/order/dist ./backend/services/order/dist
COPY --from=builder /app/node_modules ./node_modules

WORKDIR /app/backend/services/order

EXPOSE 3003

CMD ["node", "dist/index.js"]
