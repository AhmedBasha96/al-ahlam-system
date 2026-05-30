# Multi-stage Dockerfile for a production Next.js app with Prisma
# Uses Debian-slim based images to ensure Prisma native binaries work reliably

# Stage: deps - install packages (including dev deps required for build)
FROM node:20-bullseye-slim AS deps
WORKDIR /app
COPY package*.json ./
# Install build tools required by native modules (bcrypt, node-gyp, etc.) and install deps
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && npm install

# Stage: builder - copy code and build the application
FROM node:20-bullseye-slim AS builder
WORKDIR /app
# Install openssl (required by Prisma engine on Debian-slim)
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
# Copy preinstalled node_modules for faster builds
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Provide a dummy DATABASE_URL so prisma generate can resolve the schema
# (.env is excluded by .dockerignore; the real URL is injected at runtime)
ENV DATABASE_URL="mysql://dummy:dummy@localhost:3306/dummy"
# Generate Prisma client and build the Next app
RUN npx prisma generate \
  && npm run build \
  && npm prune --production

# Stage: runner - minimal runtime image
FROM node:20-bullseye-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
# Small runtime utilities for healthchecks
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Copy only production artifacts
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma
# Copy entrypoint script (it will run migrations on startup, if DATABASE_URL is present)
COPY ./docker/entrypoint.sh ./docker/entrypoint.sh
RUN chmod +x ./docker/entrypoint.sh

EXPOSE 3000
ENV PORT=3000
ENTRYPOINT ["./docker/entrypoint.sh"]
CMD ["npm", "start"]
