# ========================================================
# FotoDesk — Multi-stage Production Dockerfile
# Optimized for Coolify / Docker Compose on Ubuntu VPS
# ========================================================

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat vips-dev
WORKDIR /app

# ── Stage 1: Dependencies ──
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ── Stage 2: Builder ──
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . ./

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js in production standalone mode
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npm run build

# ── Stage 3: Runner (Web Server) ──
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/package.json ./package.json

USER nextjs

EXPOSE 3000

CMD ["node_modules/.bin/next", "start", "-p", "3000"]
