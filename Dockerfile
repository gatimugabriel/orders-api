# # Stage 1: Dependencies
# FROM node:lts-alpine AS deps
# WORKDIR /app
# COPY package.json pnpm-lock.yaml ./
# RUN npm install -g pnpm && pnpm install

# # Stage 2: Builder
# FROM node:lts-alpine AS builder
# WORKDIR /app
# COPY --from=deps /app/node_modules ./node_modules
# COPY . .
# RUN npm run build

# # Stage 3: Runner
# FROM node:lts-alpine AS runner
# WORKDIR /app
# ENV NODE_ENV production

# # Only copy necessary files
# COPY --from=builder /app/dist ./dist
# COPY --from=builder /app/node_modules ./node_modules
# COPY package.json ./

# #  create non-root user
# RUN addgroup -g 1001 -S nodejs
# RUN adduser -S runnerUser -u 1001
# USER runnerUser

# EXPOSE 8080
# CMD ["node", "dist/src/app.js"]








# # ----------- DEVELOPMENT STAGE ------------- #
# FROM node:lts-alpine AS development

# # Set environment variables for pnpm version
# # ARG PNPM_VERSION=9.1.2

# # Install pnpm using npm
# # RUN npm install -g pnpm@${PNPM_VERSION}
# RUN npm install -g pnpm

# WORKDIR /usr/src/app

# COPY --chown=node:node pnpm-lock.yaml ./

# RUN pnpm fetch

# COPY --chown=node:node . .
# RUN pnpm install --offline
# RUN pnpm exec prisma generate

# USER node

# # ---------------- BUILD STAGE ------------- #
# FROM node:lts-alpine AS build

# # Set environment variables for pnpm version
# # ARG PNPM_VERSION=9.1.2
# # Install pnpm using npm
# # RUN npm install -g pnpm@${PNPM_VERSION}
# RUN npm install -g pnpm 


# WORKDIR /usr/src/app

# COPY --chown=node:node pnpm-lock.yaml ./
# COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules
# COPY --chown=node:node . .

# RUN pnpm build
# # ENV ENVIRONMENT production

# RUN pnpm install --offline --prod

# USER node

# # ----------- PRODUCTION STAGE ------------- #
# FROM node:lts-alpine AS production

# WORKDIR /usr/src/app

# COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
# COPY --chown=node:node --from=build /usr/src/app/dist ./dist


# CMD ["node", "dist/src/app.js"]






# Build stage
FROM node:lts-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++ openssl procps

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy package files
COPY package.json ./

# Clean install without frozen lockfile
RUN pnpm install

# Copy the rest of the application
COPY . .

# Generate Prisma Client
RUN pnpm prisma generate

# Build the application
RUN pnpm build

# Production stage
FROM node:lts-alpine

WORKDIR /app

# Install necessary runtime dependencies
RUN apk add --no-cache openssl procps bash

# Copy built assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./

# Install pnpm and production dependencies only
RUN corepack enable && corepack prepare pnpm@latest --activate \
    && pnpm install --prod

# Set environment variables
ENV NODE_ENV=production

# Expose the port your app runs on
EXPOSE 5000

# Create start script directly
RUN echo '#!/bin/sh\n\
if [ -n "$DB_HOST" ] && [ -n "$DB_PORT" ]; then\n\
  echo "Waiting for database..."\n\
  until nc -z $DB_HOST $DB_PORT; do\n\
    sleep 1\n\
  done\n\
  echo "Database is up!"\n\
fi\n\
npx prisma migrate deploy\n\
node dist/src/app.js' > /app/start.sh \
    && chmod +x /app/start.sh

# Install netcat for the health check
RUN apk add --no-cache netcat-openbsd

ENTRYPOINT ["/app/start.sh"]