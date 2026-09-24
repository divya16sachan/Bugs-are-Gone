FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY backend/shared ./backend/shared
COPY backend/services/user ./backend/services/user

RUN npm ci
RUN npm --workspace=@ecom/shared run build
RUN npm --workspace=user-service run prisma:generate
RUN npm --workspace=user-service run build
RUN cp -r backend/services/user/src/generated backend/services/user/dist/generated

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/backend/shared/package*.json ./backend/shared/
COPY --from=builder /app/backend/shared/dist ./backend/shared/dist
COPY --from=builder /app/backend/services/user/package*.json ./backend/services/user/
COPY --from=builder /app/backend/services/user/dist ./backend/services/user/dist
COPY --from=builder /app/node_modules ./node_modules

WORKDIR /app/backend/services/user

EXPOSE 3001

CMD ["node", "dist/index.js"]
