# syntax=docker/dockerfile:1


# ----------- DEVELOPMENT STAGE ------------- #
FROM node:lts-alpine AS development

# Set environment variables for pnpm version
ARG PNPM_VERSION=9.1.2

# Install pnpm using npm
RUN npm install -g pnpm@${PNPM_VERSION}

WORKDIR /usr/src/app

COPY --chown=node:node pnpm-lock.yaml ./

RUN pnpm fetch

COPY --chown=node:node . .
RUN pnpm install --offline
RUN pnpm exec prisma generate

USER node

# ---------------- BUILD STAGE ------------- #
FROM node:lts-alpine AS build

# Set environment variables for pnpm version
ARG PNPM_VERSION=9.1.2

# Install pnpm using npm
RUN npm install -g pnpm@${PNPM_VERSION}

WORKDIR /usr/src/app

COPY --chown=node:node pnpm-lock.yaml ./
COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules
COPY --chown=node:node .env .env
COPY --chown=node:node . .

RUN pnpm build
ENV NODE_ENV production

RUN pnpm install --offline --prod

USER node

# ----------- PRODUCTION STAGE ------------- #
FROM node:lts-alpine AS production

WORKDIR /usr/src/app

COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

# Copy the environment variables
COPY --from=build /usr/src/app/.env .env


CMD ["node", "dist/app.js"]
