FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY backend/shared ./backend/shared
COPY backend/services/payment ./backend/services/payment

RUN npm ci
RUN npm --workspace=@ecom/shared run build
RUN npm --workspace=payment-service run build

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/backend/shared/package*.json ./backend/shared/
COPY --from=builder /app/backend/shared/dist ./backend/shared/dist
COPY --from=builder /app/backend/services/payment/package*.json ./backend/services/payment/
COPY --from=builder /app/backend/services/payment/dist ./backend/services/payment/dist
COPY --from=builder /app/node_modules ./node_modules

WORKDIR /app/backend/services/payment

EXPOSE 3004

CMD ["node", "dist/index.js"]
