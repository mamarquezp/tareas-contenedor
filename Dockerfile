# ═══════════════════════════════════════════════════════════════════════════
#  RONDA 0 · La línea de base
#
#  Este Dockerfile funciona. La aplicación arranca y responde. Y pesa como
#  un piano.
#
#  No lo borres: cámbialo. Al final de la clase este archivo tiene que ser
#  irreconocible, y tu imagen tiene que seguir respondiendo 200 en /api/salud.
# ═══════════════════════════════════════════════════════════════════════════

#1 · dependencias
FROM node:24-slim AS dependencias
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

#2 · constructor
FROM node:24-slim AS constructor
WORKDIR /app
RUN corepack enable
COPY --from=dependencias /app/node_modules ./node_modules
COPY . .
RUN pnpm build

#3 · servidor
FROM node:24-alpine AS servidor
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
COPY --from=constructor /app/public ./public
COPY --from=constructor /app/.next/standalone ./
COPY --from=constructor /app/.next/static ./.next/static
EXPOSE 3000
USER node
CMD ["node", "server.js"]
