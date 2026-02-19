# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

COPY tsconfig.json ./
COPY src ./src

RUN npx tsc

# Stage 2: Production
FROM node:20-alpine AS runner

RUN addgroup --system --gid 1001 fundiwangu && \
    adduser --system --uid 1001 fundiwangu

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

USER fundiwangu

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/server.js"]
