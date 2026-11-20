# AI toque

El recetario de la casa. Pegas el link de una receta (página web, YouTube o Instagram) y la deja escrita a la chilena: ingredientes con nombres locales (palta, choclo, maicena) y medidas de acá (gramos, ml, tazas de 240 ml, °C). La guardas, la revisas y la cocinas sin volver a la red social.

La adaptación funciona con reglas y un diccionario, sin IA. El nombre se ríe de eso.

## Qué hace

- Importa recetas desde páginas con datos schema.org/Recipe, descripciones de YouTube y posts de Instagram.
- Traduce ingredientes del inglés y convierte medidas (oz, lb, cups, °F…) a medidas chilenas.
- Muestra cada receta importada para revisarla antes de guardarla. Si la importación falla, se puede escribir a mano.
- Busca por nombre o ingrediente, sin importar tildes.
- Funciona en el celular mientras cocinas: puedes ir marcando los ingredientes y los pasos van numerados.

## Stack

Astro 7 con render en servidor (adapter Node), Tailwind v4 y el SQLite que trae Node (`node:sqlite`).

## Desarrollo

Requiere Node 26 (ver `.node-version`) y pnpm.

```sh
pnpm install
pnpm dev        # http://localhost:4321
pnpm test       # tests con node --test
pnpm build      # build de producción en dist/
```

La base de datos y las fotos descargadas se guardan en `data/` (no se versiona).

## Variables de entorno

| Variable | Para qué |
| --- | --- |
| `CLAVE` | La clave de la casa para entrar al recetario. En desarrollo es opcional; publicado, sin ella la app no abre. |
| `DB_PATH` | Ruta del archivo SQLite (por defecto `data/ai-toque.db`). Las fotos se guardan en la misma carpeta. |
| `HOST`, `PORT` | Dónde escucha el servidor de producción. Para publicarlo, `HOST=0.0.0.0`. |

Para probar la clave en local: `CLAVE=algo pnpm dev`.

## Producción

```sh
pnpm build
pnpm start
```

La carpeta de `DB_PATH` tiene que estar en un disco que se mantenga entre despliegues (un volumen); si no, las recetas se pierden en cada despliegue.

## Estructura

| Ruta | Qué hay |
| --- | --- |
| `src/pages/` | Páginas: recetario, nueva receta, ver y editar receta |
| `src/lib/importar.ts` | Lee recetas desde páginas, YouTube e Instagram |
| `src/lib/adaptar.ts` | Convierte medidas y adapta cada línea de ingrediente |
| `src/lib/diccionario.ts` | Diccionario inglés → español chileno |
| `src/lib/red.ts` | Descargas seguras (bloquea direcciones internas) |
| `src/lib/db.ts` | Recetario en SQLite |
| `PRODUCT.md`, `DESIGN.md` | Para quién es la app y su sistema de diseño |
