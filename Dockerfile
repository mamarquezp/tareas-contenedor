# ═══════════════════════════════════════════════════════════════════════════
#  RONDA 0 · La línea de base
#
#  Este Dockerfile funciona. La aplicación arranca y responde. Y pesa como
#  un piano.
#
#  No lo borres: cámbialo. Al final de la clase este archivo tiene que ser
#  irreconocible, y tu imagen tiene que seguir respondiendo 200 en /api/salud.
# ═══════════════════════════════════════════════════════════════════════════

FROM node:24

WORKDIR /app

RUN corepack enable

# Copiar primero solo lo que describe las dependencias: así instalar no se
# invalida cuando cambia un componente.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install

COPY . .

RUN pnpm build

EXPOSE 3000

CMD ["pnpm", "start"]
