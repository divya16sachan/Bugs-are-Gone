FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY index.ts tsconfig.json ./

EXPOSE 9000

CMD ["npx", "tsx", "index.ts"]