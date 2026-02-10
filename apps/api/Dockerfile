# ---- Builder Stage ----
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json turbo.json ./

# Copy workspace package.json files
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/

# Install all dependencies
RUN npm ci

# Copy source code
COPY packages/shared/ packages/shared/
COPY apps/api/ apps/api/

# Generate Prisma client
RUN cd apps/api && npx prisma generate

# Build API
RUN cd apps/api && npm run build

# ---- Runner Stage ----
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 appgroup && \
    adduser --system --uid 1001 appuser

# Copy root workspace files for module resolution
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/

# Install production dependencies only
RUN npm ci --workspace=api --omit=dev --ignore-scripts

# Copy Prisma schema and generate client for production
COPY apps/api/prisma/ apps/api/prisma/
RUN cd apps/api && npx prisma generate

# Copy shared package (needed at runtime for transpiled imports)
COPY --from=builder /app/packages/shared/ packages/shared/

# Copy built files
COPY --from=builder /app/apps/api/dist/ apps/api/dist/

# Copy Thai fonts (used by sharp text API via fontfile parameter)
COPY apps/api/fonts/ apps/api/fonts/

USER appuser

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

CMD ["node", "apps/api/dist/index.js"]
