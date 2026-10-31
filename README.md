# Tareas Pro · Contenedor

Aplicación **Next.js** (App Router) contenedorizada, con **PostgreSQL** opcional.
La app funciona aunque la base no esté disponible: `/api/salud` responde
`base: "sin base"` en lugar de reventar.

## Arranque en una máquina limpia (dos comandos)

```bash
git clone <URL-DE-TU-REPO> tareas-contenedor && cd tareas-contenedor
```

```bash
docker compose up --build
```

Luego abre:

- Aplicación: http://localhost:3000
- Salud: http://localhost:3000/api/salud

Para detenerla: `docker compose down`.

## La imagen

Se construye en tres etapas (`dependencias` → `constructor` → `servidor`). Solo la
última queda en la imagen final, con salida `standalone` de Next, base
`node:24-alpine` y ejecución **sin root** (`USER node`).

| Ronda | Cambio | Tamaño | Reducción |
|------:|--------|-------:|----------:|
| 0 | Línea de base (`node:24`, una sola etapa) | 737 MB | — |
| 1 | `.dockerignore` + reordenar capas | 600 MB | −19 % |
| 2 | `output: 'standalone'` + Dockerfile multietapa | 93 MB | −87 % |
| 3 | Base `alpine` + sin root + cache de pnpm | 75 MB | −90 % |

## Variables de entorno

Parten de `.env.ejemplo`:

- `DATABASE_URL` — conexión a PostgreSQL (opcional; sin ella la app usa datos en memoria).
- `APP_VERSION` — etiqueta de versión que muestra `/api/salud`.
