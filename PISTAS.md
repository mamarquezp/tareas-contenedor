# Pistas

Ábrelas **solo cuando lleves cinco minutos atascado**. El punto de la clase no es
llegar primero: es entender por qué baja el número.

---

## Ronda 1 · Contexto y capas

<details>
<summary>Pista 1 · Qué le estás mandando a Docker</summary>

Mira la primera línea de la salida de `docker build`:

```
=> transferring context: 412.57MB
```

Eso es lo que tu máquina le manda al motor de Docker **antes de empezar**. Ahí van
`node_modules`, `.next`, `.git` y, si no tienes cuidado, tu `.env`.

El archivo que arregla esto se llama igual que `.gitignore` pero con otra palabra.
</details>

<details>
<summary>Pista 2 · Por qué el tamaño casi no baja</summary>

Porque `COPY . .` seguido de `npm install` vuelve a crear `node_modules` dentro de
la imagen de todos modos. El `.dockerignore` **no adelgaza: acelera**, y evita que
subas secretos sin querer.

El que adelgaza es el de la ronda 2.
</details>

<details>
<summary>Pista 3 · El orden de las capas</summary>

Docker cachea capa por capa, y una capa se invalida cuando cambia algo de lo que
copiaste antes. Con `COPY . .` antes de `npm install`, cambiar una coma en un
componente te reinstala todas las dependencias.

Copia primero **solo** lo que describe las dependencias, instala, y después copia
el resto:

```dockerfile
COPY package.json pnpm-lock.yaml ./
RUN ...instalar...
COPY . .
```

Mide el tiempo de build dos veces seguidas sin cambiar nada y después cambiando una
letra de `app/page.tsx`. La diferencia es el premio.
</details>

---

## Ronda 2 · Multietapa y standalone

<details>
<summary>Pista 1 · Qué sobra en la imagen final</summary>

Entra a ver:

```bash
docker run --rm -it tareas-contenedor:r1 sh -c "du -sh /app/* | sort -h | tail"
```

Vas a encontrar el código fuente, las dependencias de desarrollo, el caché de
TypeScript y las herramientas de compilación. Nada de eso hace falta para
**servir** la aplicación. Solo hacía falta para construirla.
</details>

<details>
<summary>Pista 2 · La línea que falta en next.config.ts</summary>

```ts
const nextConfig: NextConfig = {
  output: 'standalone',
};
```

Con eso, `next build` deja en `.next/standalone` un servidor completo con **solo**
los `node_modules` que de verdad se usan en tiempo de ejecución, y un `server.js`
que se arranca con `node server.js` — sin `next start`, sin la CLI de Next.
</details>

<details>
<summary>Pista 3 · La forma de las etapas</summary>

Tres etapas, y solo la última queda en la imagen:

```dockerfile
FROM node:24-slim AS dependencias
# solo package.json + lock, e instalar

FROM node:24-slim AS constructor
# copiar node_modules de la etapa anterior, copiar el código, construir

FROM node:24-slim AS servidor
# copiar SOLO:  public/  .next/standalone  .next/static
CMD ["node", "server.js"]
```

Lo que no copies a la última etapa, no existe. Esa es toda la magia.

Dos detalles que si no pones, el contenedor arranca y no responde desde fuera:

```dockerfile
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
```

Sin `HOSTNAME=0.0.0.0` el servidor escucha solo adentro del contenedor y tu
`-p 3999:3000` no sirve de nada.
</details>

---

## Ronda 3 · Base mínima y sin root

<details>
<summary>Pista 1 · Cambiar de base</summary>

`node:24-slim` es Debian recortado. `node:24-alpine` usa musl en vez de glibc y
pesa bastante menos.

No lo cambies en las tres etapas a ciegas: cámbialo primero en la **última**, que
es la única que queda. Si algo se rompe en tiempo de ejecución, casi siempre es una
dependencia nativa que se compiló contra glibc — y ahí la respuesta es construir
también en alpine.
</details>

<details>
<summary>Pista 2 · Dejar de ser root</summary>

Las imágenes oficiales de Node ya traen un usuario `node`. No hace falta crearlo:

```dockerfile
USER node
```

Pero ojo con el orden: lo que copies **después** del `USER` se copia como ese
usuario. Usa `COPY --chown=node:node` y cámbiate de usuario justo antes del `CMD`.

Compruébalo: `pnpm medir` te dice con qué uid corre. Si dice `0`, sigues siendo root.
</details>

<details>
<summary>Pista 3 · Lo último que queda</summary>

- `ENV NODE_ENV=production` antes de instalar y de construir.
- Una sola capa `RUN` cuando varios comandos van juntos: cada `RUN` es una capa.
- `--mount=type=cache` para el caché del gestor de paquetes, que así no viaja
  dentro de la imagen.
- Si quieres el nivel bonus: una imagen *distroless* no trae ni `sh`. Es la más
  pequeña y la más segura, y también la más incómoda de depurar — porque no puedes
  entrar. Ese intercambio es el tema de la Semana 17.
</details>
