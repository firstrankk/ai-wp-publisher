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
FROM node:20-slim AS runner

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl fontconfig \
    && rm -rf /var/lib/apt/lists/*

# Install Thai fonts for cover image generation
COPY apps/api/fonts/*.ttf /usr/share/fonts/truetype/noto-thai/
RUN fc-cache -f

WORKDIR /app

ENV NODE_ENV=production

RUN groupadd --system --gid 1001 appgroup && \
    useradd --system --uid 1001 --gid appgroup --no-create-home appuser

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

# Copy Thai fonts accessible by app code
COPY apps/api/fonts/ apps/api/fonts/

USER appuser

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "const http=require('http');http.get('http://localhost:4000/health',(r)=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

CMD ["node", "apps/api/dist/index.js"]
