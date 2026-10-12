FROM node:22-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

WORKDIR /app/server
RUN npm ci --omit=dev

WORKDIR /app
ENV PORT=3000
EXPOSE 3000
CMD ["node", "server/index.js"]
