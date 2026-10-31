# Tareas Pro · Contenedor — Semana 16

**DevOps y entrega continua: Docker, CI/CD, entornos y secretos**
Programación IV · Ing. Rodrigo Rodríguez · USPG

Hoy hay **competencia**. Se gana bajando el tamaño de tu imagen, y se pierde
entregando una imagen pequeña que no arranca.

---

## La regla

Tu imagen tiene que seguir respondiendo **200 en `/api/salud`**. El juez
(`pnpm medir`) la construye, la levanta y le pega. Si no contesta en 30 segundos,
el número no cuenta.

Se puntúa por **porcentaje de reducción contra tu propia ronda 0**, no por
megabytes. Así nadie gana por tener mejor internet.

---

## Arranque (5 minutos, hazlo apenas llegues)

```bash
pnpm install
docker version          # si esto falla, abre Docker Desktop ahora
```

`pnpm install` genera `pnpm-lock.yaml`. **Haz commit de ese archivo antes de subir
nada**: el pipeline lo exige con `--frozen-lockfile`, que es justamente lo que evita
que el CI instale versiones distintas a las tuyas.

No hace falta levantar la base para competir: la aplicación funciona sin ella y
`/api/salud` responde `base: "sin base"`. Si la quieres:

```bash
cp .env.ejemplo .env
docker compose up -d db
```

---

## Ronda 0 · La línea de base

```bash
pnpm medir --equipo "TU SQUAD" --ronda 0
```

Esto construye el `Dockerfile` tal como viene. Funciona y pesa como un piano.
**Apunta tu número: es tu marca personal y contra él se mide todo lo demás.**

Mientras construye, mira la primera línea de la salida:

```
=> transferring context:  ???MB
```

Esa cifra también es información.

---

## Ronda 1 · Contexto y capas

Dos cambios:

1. Un archivo que le dice a Docker qué **no** mandarle.
2. Reordenar el `Dockerfile` para que instalar dependencias no dependa de tu último
   cambio en un componente.

```bash
pnpm medir --equipo "TU SQUAD" --ronda 1
```

> **Aviso para que no te frustres:** el tamaño casi no va a bajar. El que baja es el
> **tiempo**. Corre `pnpm medir` dos veces seguidas y mira la diferencia. Y después
> cambia una letra en `app/page.tsx` y vuelve a medir. Ahí está el premio de esta
> ronda.

---

## Ronda 2 · Multietapa y standalone

Esta es la caída grande.

La pregunta que resuelve todo: **¿qué de lo que hay en la imagen hacía falta para
*construir* y no para *servir*?** Todo eso sobra.

Hay una línea que falta en `next.config.ts` y está señalada con un comentario.

```bash
pnpm medir --equipo "TU SQUAD" --ronda 2
```

---

## Ronda 3 · Base mínima y sin root

Cambia la base de la última etapa y deja de correr como `root`. El juez te dice con
qué usuario corriste: si sale `0`, sigues siendo root y eso cuesta puntos.

```bash
pnpm medir --equipo "TU SQUAD" --ronda 3
pnpm tablero     # tu resumen de las cuatro rondas
```

---

## Si te atoras

`PISTAS.md` tiene tres pistas por ronda, de menos a más explícita. Ábrelas solo
cuando lleves cinco minutos atascado: el punto no es llegar primero, es entender por
qué baja el número.

**Los dos errores que más se repiten en la ronda 2:**

- La página carga sin estilos ni interactividad → te faltó copiar `.next/static`.
- El contenedor arranca, los logs se ven bien, y nada responde desde fuera → te
  faltó `ENV HOSTNAME=0.0.0.0`. Sin eso el servidor escucha solo adentro.

---

## Bloque 3 · El pipeline

`.github/workflows/entrega.yml` ya está escrito. Hoy no lo escribes: lo **lees**, lo
subes y lo ves correr. Trae cuatro cosas que vale la pena mirar con calma:

- Una **matriz** que corre tipos y lint en Node 22 y 24 a la vez.
- **Buildx y caché de GitHub.** Sin `setup-buildx-action` la caché no funciona y
  falla en silencio. `cache-from` y `cache-to` van siempre en pareja.
- Una **compuerta de tamaño**: si la imagen pasa de `LIMITE_MB`, el CI se pone rojo.
  Bájalo a medida que optimizas.
- Una **compuerta de usuario**: si el contenedor corre como root, el CI se pone rojo.

---

## Bloque 4 · Secretos

Treinta segundos que no se olvidan:

```bash
docker build -f Dockerfile.fuga --build-arg LLAVE=sk_vive_12345 -t fuga .
docker history --no-trunc fuga | grep sk_vive
```

El secreto está ahí, en texto plano, aunque el `RUN` lo borre en la línea siguiente.
Cada capa guarda el comando que la creó.

La forma correcta está en `Dockerfile.secreto`. Pero la pregunta antes de esa es:
**¿de verdad lo necesitas al construir?** Casi nunca. Casi siempre es una variable
de entorno en tiempo de ejecución, y entonces no toca la imagen jamás.

---

## La tarea

**Entrega el sábado 7 de noviembre antes de las 16:00.** En tu propio proyecto:

1. `Dockerfile` multietapa que construya y sirva tu aplicación, corriendo sin root.
2. `docker-compose.yml` con tu aplicación y sus servicios.
3. El workflow adaptado, con tu compuerta de tamaño, en verde.
4. En el pull request: **los cuatro números de tu imagen** (ronda 0 a 3), el
   porcentaje de reducción, y una frase por cada cambio explicando qué quitó.
5. Un `README` de cómo levantar tu proyecto en una máquina limpia con dos comandos.

Lo que voy a leer primero es el punto 4.
