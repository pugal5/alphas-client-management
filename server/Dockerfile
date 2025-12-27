# Backend Dockerfile
# This Dockerfile works with ROOT directory as build context
# Make sure Render's "Docker Build Context Directory" is set to "/" (root)

FROM node:20-alpine AS base

# Install OpenSSL for Prisma
# Prisma needs OpenSSL 1.1, install from edge repository
RUN apk add --no-cache openssl || \
    (apk add --no-cache --repository=http://dl-cdn.alpinelinux.org/alpine/edge/main openssl1.1-compat || \
     apk add --no-cache openssl)

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY server/package.json ./
COPY server/package-lock.json ./
RUN npm ci

# Build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY server/package.json ./
COPY server/tsconfig.json ./
COPY server/src ./src
COPY prisma ./prisma
RUN npx prisma generate
RUN npm run build

# Production
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

# Install OpenSSL for Prisma (needed in production too)
# Prisma needs OpenSSL 1.1, install from edge repository
RUN apk add --no-cache openssl || \
    (apk add --no-cache --repository=http://dl-cdn.alpinelinux.org/alpine/edge/main openssl1.1-compat || \
     apk add --no-cache openssl)

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY server/package.json ./

USER nodejs

EXPOSE 3001

CMD ["node", "dist/index.js"]

