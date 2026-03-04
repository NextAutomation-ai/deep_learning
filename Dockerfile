FROM node:20-slim AS base

# Install dependencies needed for better-sqlite3 compilation
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# ── Stage 1: Install dependencies ──
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ── Stage 2: Build the app ──
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# Create DB schema before build so Next.js page collection doesn't crash
RUN npx drizzle-kit push

RUN npm run build

# ── Stage 3: Production runner ──
FROM node:20-slim AS runner
WORKDIR /app

# Install runtime dependency for better-sqlite3
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy drizzle migrations
COPY --from=builder /app/drizzle ./drizzle

# Data directory for SQLite + uploads
RUN mkdir -p /data && chown nextjs:nodejs /data
ENV DATA_DIR=/data

USER nextjs

EXPOSE 10000

CMD ["node", "server.js"]
