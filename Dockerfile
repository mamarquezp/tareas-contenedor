# ═══════════════════════════════════════════════════════════════════════════
#  Dockerfile multietapa: construir en una etapa, servir en otra mas ligera.
#  Solo la ultima etapa queda en la imagen final.
# ═══════════════════════════════════════════════════════════════════════════

# ── 1 · dependencias ─────────────────────────────────────────
FROM node:24-slim AS dependencias
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ── 2 · constructor ──────────────────────────────────────────
FROM node:24-slim AS constructor
WORKDIR /app
RUN corepack enable
COPY --from=dependencias /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ── 3 · servidor · lo unico que queda en la imagen ───────────
FROM node:24-slim AS servidor
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=constructor /app/public ./public
COPY --from=constructor /app/.next/standalone ./
COPY --from=constructor /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
