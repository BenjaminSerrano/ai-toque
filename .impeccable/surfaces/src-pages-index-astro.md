---
version: 1
slug: "src-pages-index-astro"
primary_target: "src/pages/index.astro"
related_targets: ["src/pages/nueva.astro","src/pages/recetas/[id].astro","src/pages/recetas/[id]/editar.astro","src/layouts/Layout.astro","src/components/RecetaForm.astro"]
---

# Recetario AI toque (app completa)

Modo: Operate. Superficies: inicio (importar + recetario + búsqueda), revisar/escribir receta, ver receta, editar, 404.
Audiencia y tarea: quien cocina en casa en Chile y su familia; importar una receta desde un link o texto, revisarla adaptada, guardarla, encontrarla y seguirla en la cocina (celular a un brazo de distancia) o en el notebook.
Restricciones: nombre y chiste "AI toque" con la I destacada (obligatorio); español de Chile; controles web estándar; render en servidor sin frameworks de UI.
Momento memorable: la lista de ingredientes leída como el menú del día, y el tachado amarillo de tiza al marcar lo que ya se echó.
Sin resolver: modo cocina paso a paso; escalar porciones.

## Direction contract

THESIS: El recetario se lee como la pizarra del menú del día de una picada chilena: el plato o ingrediente a la izquierda, la cantidad a la derecha donde iría el precio, unidos por puntitos. Rechaza la grilla de tarjetas blancas con foto que trae toda app de recetas.

OWN-WORLD: Pizarra verde casi negra (#1e2a24) y tiza hueso (#f2efe6). Tiza amarilla solo para lo activo y la acción principal; tiza naranja solo para la I del logo y los enlaces; tiza celeste para avisos. Títulos en letra de tiza condensada (Amatic SC 700), texto en Atkinson Hyperlegible Next. Separadores de tiza punteada y rayas translúcidas. Las fotos son lo único a todo color.
- Raise (darkroom): cantidades en cifras tabulares con fracciones reales, en su propia columna alineada.
- Raise (crouwel): un solo módulo de columnas para nombre, puntitos y cantidad en toda la app.
- Raise (orienteering): el amarillo queda reservado para lo activo: ingrediente puesto, paso en curso, acción principal.
- Raise (airport): números de paso monumentales, legibles a un brazo de distancia.
- Raise (streaming): la foto es el único color pleno; nada más compite con ella.

STORY: Pegas un link (web, YouTube, Instagram) o texto, ves la receta adaptada y la corriges, y queda en el menú de la casa. En la cocina la lees de lejos y vas tachando con amarillo lo que ya echaste.

FIRST VIEWPORT: Barra de pizarra: logo en tiza a la izquierda (I naranja), Recetario y Escribir una receta a la derecha. En escritorio, dos columnas: a la izquierda (≈520 px) el título en tiza grande "Pega el link, te la dejo a la chilena", la bajada, el campo de link con el botón amarillo Importar como acción principal, las fuentes aceptadas y el buscador; a la derecha, tras un trazo punteado vertical, "Menú de la casa" con el conteo y la lista de recetas: miniatura, nombre en tiza, puntitos y tiempo en amarillo tabular. En celular, una columna con importar primero. Interacción distintiva: al marcar un ingrediente o paso, un trazo de tiza amarilla lo tacha (250 ms, ease-out, sin animación si se pide movimiento reducido).

FORM: Pizarra de picada, posición 6 de mi lista ordenada de 7. seed:d661545abc4e7dc4

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
