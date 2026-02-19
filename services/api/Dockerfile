# Stage 1: Build
FROM node:25-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

COPY tsconfig.json ./
COPY src ./src

RUN npx tsc

# Stage 2: Production
FROM node:25-alpine AS runner

# Install wget for health checks
RUN apk add --no-cache wget

RUN addgroup --system --gid 1001 fundiwangu && \
    adduser --system --uid 1001 fundiwangu

WORKDIR /app

# Copy compiled app and dependencies
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

# Copy SQL migration files
COPY migrations ./migrations

USER fundiwangu

EXPOSE 3000

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]
