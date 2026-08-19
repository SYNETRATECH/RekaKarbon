FROM node:24.15.0-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

# ── Shared deps (both dev and prod) ──
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY client/package.json ./client/
COPY server/package.json ./server/
RUN pnpm install --frozen-lockfile

# ── Dev: hot-reload via nest start --watch ──
FROM deps AS dev
WORKDIR /app/server
COPY server/ ./
EXPOSE 3001
CMD ["pnpm", "run", "start:dev"]

# ── Prod build: compile TypeScript ──
FROM deps AS builder
COPY server/ ./server/
RUN pnpm --filter ./server build

# ── Prod: compiled dist only ──
FROM base AS prod
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY server/package.json ./server/
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

COPY --from=builder /app/server/dist ./server/dist

EXPOSE 3001
WORKDIR /app/server
CMD ["node", "dist/main"]