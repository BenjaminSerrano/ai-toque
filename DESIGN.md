---
name: AI toque
description: El recetario de la casa, escrito como la pizarra del menú del día de una picada chilena.
colors:
  pizarra: "#1e2a24"
  pizarra-honda: "#16201b"
  pizarra-clara: "#283830"
  tiza: "#f2efe6"
  amarillo: "#f6c945"
  amarillo-claro: "#ffd968"
  naranja: "#f2914a"
  celeste: "#86c9da"
  coral: "#f28b7a"
typography:
  display:
    fontFamily: "Amatic SC, Atkinson Hyperlegible Next, sans-serif"
    fontSize: "clamp(3.5rem, 8vw, 6rem)"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "0.01em"
  numeral:
    fontFamily: "Amatic SC, Atkinson Hyperlegible Next, sans-serif"
    fontSize: "6rem"
    fontWeight: 700
    lineHeight: 0.8
    fontFeature: "tnum"
  headline:
    fontFamily: "Amatic SC, Atkinson Hyperlegible Next, sans-serif"
    fontSize: "3.75rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.01em"
  title:
    fontFamily: "Amatic SC, Atkinson Hyperlegible Next, sans-serif"
    fontSize: "2.5rem"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "0.01em"
  body-lectura:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.625
  body:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
  cantidad:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    fontFeature: "tnum"
  small:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
rounded:
  md: "6px"
  lg: "8px"
  xl: "12px"
  2xl: "16px"
spacing:
  gutter-movil: "20px"
  gutter-tablet: "32px"
  gutter-escritorio: "72px"
  columnas-escritorio: "80px"
  columnas-movil: "56px"
  contenedor: "1440px"
components:
  button-primary:
    backgroundColor: "{colors.amarillo}"
    textColor: "{colors.pizarra}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "0 24px"
    height: "56px"
  button-primary-hover:
    backgroundColor: "{colors.amarillo-claro}"
  button-secondary:
    textColor: "{colors.tiza}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "0 24px"
    height: "56px"
  button-danger:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.pizarra}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    padding: "0 24px"
    height: "56px"
  input:
    backgroundColor: "{colors.pizarra-honda}"
    textColor: "{colors.tiza}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
  link:
    textColor: "{colors.naranja}"
  checkbox:
    rounded: "{rounded.md}"
    size: "26px"
  checkbox-checked:
    backgroundColor: "{colors.amarillo}"
    textColor: "{colors.pizarra}"
  recipe-row-hover:
    backgroundColor: "{colors.pizarra-clara}"
    rounded: "{rounded.xl}"
---

# Design System: AI toque

## Overview

**Creative North Star: "La pizarra de la picada"**

El recetario se escribe como el menú del día con tiza en la pizarra de una picada chilena: fondo verde casi negro con un polvillo de tiza apenas visible, letra de tiza condensada para todo lo que se anuncia (títulos, nombres de platos, números de paso) y una letra de lectura muy clara para todo lo que se sigue con las manos ocupadas. Cada línea de ingrediente se lee como un plato con su precio: el nombre a la izquierda, la cantidad a la derecha en cifras tabulares, unidos por una fila de puntitos.

La densidad es baja y la escala grande, porque el uso real es un celular a un brazo de distancia en la cocina: texto de lectura de 20 px, áreas táctiles de 56 px o más, números de paso monumentales. El color es escaso y tiene trabajo asignado: tiza hueso para casi todo, tiza amarilla solo para lo activo y la acción principal, naranja solo para la I del logo y los enlaces, celeste para avisos, coral para borrar. Las fotos de las recetas son lo único a todo color en la pantalla.

La profundidad no existe como sombra: la pizarra es plana y lo que la organiza son trazos de tiza (bordes punteados y discontinuos translúcidos) y un tono de pizarra más hondo o más claro. La interacción distintiva es el tachado: al marcar un ingrediente o un paso, un trazo amarillo algo irregular lo cruza.

**Key Characteristics:**
- Pizarra verde casi negra plana, con ruido de polvo de tiza al 6 % de opacidad.
- Letra de tiza (Amatic SC 700) para anunciar; Atkinson Hyperlegible Next para leer y operar.
- Filas "nombre · puntitos · cantidad" como módulo único de listas.
- Amarillo reservado a lo activo: acción principal, casilla marcada, tachado, paso en curso, foco.
- Separadores y contenedores dibujados con trazo discontinuo de tiza, nunca con sombra.
- Íconos de un solo trazo (24 × 24, línea de 2 px, puntas redondas), dibujados para el proyecto.

## Colors

Una pizarra y una tiza neutras, con tres tizas de color que tienen un solo trabajo cada una.

### Primary
- **Tiza amarilla** (amarillo): lo activo y la acción principal. Fondo del botón principal, casilla marcada, trazo de tachado, número del paso en curso, subrayado de la sección actual en la barra, anillo de foco, selección de texto, cursor de escritura y los tiempos en la lista de recetas.
- **Tiza amarilla encendida** (amarillo-claro): solo el hover del botón principal.

### Secondary
- **Tiza naranja** (naranja): la I de "AI toque" (el chiste de la marca) y los enlaces de texto. Nada más.

### Tertiary
- **Tiza celeste** (celeste): avisos informativos (borde discontinuo del aviso y su ícono).
- **Tiza coral** (coral): la acción destructiva (borrar una receta), y solo en la confirmación.

### Neutral
- **Pizarra** (pizarra): fondo de toda la aplicación, también `theme-color` y fondo del favicon.
- **Pizarra honda** (pizarra-honda): el interior de los campos de texto y el carril de la barra de desplazamiento; un escalón hacia adentro.
- **Pizarra clara** (pizarra-clara): hover de las filas de la lista y fondo de reserva de fotos mientras cargan; un escalón hacia afuera.
- **Tiza hueso** (tiza): todo el texto. Sus opacidades forman la escala de jerarquía: 100 % texto principal, 90 % números de paso en reposo y subtítulos de grupo, 80–85 % bajadas y metadatos, 75 % texto de apoyo y ayudas, 60 % placeholders y texto tachado, 40–45 % bordes de campos y puntitos, 15–30 % trazos separadores.

### Named Rules
**The Tiza Amarilla Rule.** El amarillo marca lo que está activo o es la acción principal, y nada más. Si un elemento amarillo no es "lo que haces ahora" o "lo que ya hiciste mientras cocinas", no es amarillo.

**The Una Tiza Un Trabajo Rule.** Naranja = la I y los enlaces; celeste = avisos; coral = borrar. Ningún color de tiza cambia de trabajo ni se usa como decoración.

**The Foto a Color Rule.** Las fotos de las recetas son lo único a todo color. Ningún fondo, ilustración ni bloque de color compite con ellas.

## Typography

**Display Font:** Amatic SC 700 (con Atkinson Hyperlegible Next de respaldo)
**Body Font:** Atkinson Hyperlegible Next 400 / 600 / 700 (con ui-sans-serif, system-ui)

**Character:** Una letra de tiza condensada, de trazo irregular, que anuncia como en la pizarra; y una sans de alta legibilidad diseñada para baja visión, que lleva todo lo que se lee de verdad. La tiza nunca lleva párrafos.

### Hierarchy
- **Display** (700, clamp(3.5rem, 8vw, 6rem), 0.95): título de la receta. El título de inicio usa clamp(3.75rem, 7vw, 4.75rem), el de revisar/escribir clamp(3.5rem, 7vw, 5.5rem). `text-wrap: balance`.
- **Numeral** (700, 5rem en celular, 6rem desde 640 px, 0.8, cifras tabulares): números de paso, alineados a la derecha en su propia columna.
- **Headline** (700, 3.75rem, 1): encabezados de sección ("Ingredientes", "Preparación", 404). "Notas" baja a 3rem; subtítulos de grupo ("Para la salsa") a 2.25rem al 90 %.
- **Title** (700, 2.5rem, 0.95): nombre de cada receta en la lista "Menú de la casa"; también el campo del nombre de la receta en el formulario (2.75rem) se escribe en tiza.
- **Body lectura** (400, 1.25rem, 1.625): pasos, notas, bajadas e ingredientes (estos con 1.375). Pasos limitados a 62ch.
- **Body** (400, 1.125rem): base del documento y de los campos.
- **Label** (600, 1.125rem): etiquetas de campos, navegación, botones (los botones primarios van en 700).
- **Cantidad** (600, 1.25rem, `tabular-nums`, alineada a la derecha): la columna de cantidades y los tiempos en la lista.
- **Small** (400, 1rem, tiza al 75 %): ayudas, metadatos de fila, fuentes aceptadas, "Listo".

### Named Rules
**The Tiza Anuncia Rule.** Amatic SC se usa para títulos, nombres de recetas, números de paso y el logo; nunca para párrafos, etiquetas, botones ni cantidades.

**The Cifras en Columna Rule.** Toda cantidad o tiempo va en `tabular-nums`, a la derecha, en su propia columna; las fracciones se escriben como caracteres reales (½, ¼, 1 ½).

## Layout

Contenedor único de 90rem (1440 px) centrado, con márgenes laterales de 20 px en celular, 32 px desde 640 px y 72 px desde 1024 px. La barra superior comparte ese contenedor y se separa del contenido con una línea de tiza al 15 %.

Desde 1024 px la aplicación trabaja en dos columnas con 80 px entre ellas (56 px de separación vertical cuando se apilan en una columna):
- Inicio: columna de importar de hasta 500 px y, tras un trazo discontinuo vertical, la lista "Menú de la casa". En celular el trazo pasa a ser horizontal y la importación va primero.
- Receta: cabecera en dos columnas (texto 1fr, foto 1.1fr, alineadas abajo); debajo, ingredientes 5fr y preparación 6fr. Los ingredientes quedan fijos (sticky a 24 px) en escritorio y se desplazan solos si son largos.
- Formulario: dos columnas iguales con 64 px entre ellas; título y acciones a todo el ancho.

**The Menú Rule.** Toda lista que empareja un nombre con un valor (ingrediente y cantidad, receta y tiempo) usa el mismo módulo: nombre a la izquierda, puntitos que crecen para llenar (mínimo 24 px) y valor a la derecha. En celular, si el nombre no cabe, ocupa todo el ancho y los puntitos con el valor bajan a su línea.

El ritmo vertical es generoso: filas de ingredientes de 10 px de alto relleno, pasos de 16 px, secciones separadas por 56 px.

## Elevation & Depth

No hay sombras. La pizarra es plana; la profundidad se sugiere con tres tonos de pizarra (honda hacia adentro en los campos, clara hacia afuera en el hover de filas) y con trazos de tiza. El único efecto de superficie es el polvo de tiza: un ruido fractal blanco al 6 % de opacidad sobre el fondo.

**The Pizarra Plana Rule.** Ningún elemento flota: ni sombras, ni desenfoques, ni degradados. Si algo necesita separarse, se le dibuja un trazo de tiza o se cambia el tono de pizarra.

## Shapes

Esquinas suavemente redondeadas, siempre pequeñas respecto del elemento: 6 px en casillas y enlaces de navegación, 8 px en botones, campos y miniaturas, 12 px en avisos y filas de la lista, 16 px en contenedores de trazo y la foto de la receta.

Los bordes son trazos de tiza de 2 px. Hay tres tipos de línea, cada uno con su uso:
- **Continua translúcida** (tiza al 40–70 %): campos y botón secundario.
- **Discontinua** (tiza al 20–30 %, celeste al 70 % en avisos): contenedores secundarios, separadores de columnas, estado vacío, miniatura sin foto, barra de acciones del formulario.
- **Punteada** (3 px, tiza al 42 %): exclusivamente los puntitos del menú.

Trazos a mano en SVG completan el lenguaje: la línea ondulada bajo "Menú de la casa" y el tachado irregular amarillo.

## Components

### Buttons
Rectángulos grandes y llanos, pensados para dedos con harina.
- **Shape:** esquinas de 8 px, alto mínimo de 56 px (64 px en el botón de importar), 24 px de relleno lateral, ícono a 8 px del texto.
- **Primary:** tiza amarilla con texto pizarra en 700. Uno por pantalla: la acción que avanza (Importar, Guardar, Volver al menú).
- **Hover / Focus:** el primario se enciende a amarillo-claro; todos llevan el anillo de foco global (3 px amarillo, separado 3 px). Al enviar, el botón se desactiva, baja al 70 % con cursor de espera y cambia su texto por el de `data-espera` ("Leyendo…", "Guardando…").
- **Secondary:** sin relleno, borde de tiza al 70 % y texto tiza en 600; en hover el borde se completa y aparece un velo de tiza al 10 %. Para Editar, Cancelar, Buscar (cuadrado con lupa) y acciones alternativas.
- **Danger:** coral con texto pizarra, solo en la confirmación de borrar.

### Inputs / Fields
- **Style:** pizarra honda, borde de tiza de 2 px al 40 %, esquinas de 8 px, relleno 12 × 16 px, texto 1.125rem, placeholder al 60 %. El campo de link de inicio crece a 64 px y 1.25rem.
- **Hover / Focus:** el borde sube al 60 % en hover y a tiza plena con foco, más el anillo amarillo global.
- **Textareas:** crecen con su contenido (`field-sizing: content`), entre 6 y 40 líneas, interlineado 1.6.
- **Etiquetas y ayudas:** etiqueta en 600 sobre el campo; ayuda en 1rem al 75 % entre etiqueta y campo, enlazada con `aria-describedby`.

### Checkbox de tiza
Cuadro de 26 px (24 px en "Listo" de los pasos) con borde de tiza al 75 % y esquinas de 6 px; al marcar se rellena de amarillo con un visto pizarra dibujado. Transición de 150 ms.

### Links
Texto naranja subrayado con 2 px de grosor al 50 %, separación de 0.22em; en hover el subrayado se completa. Los enlaces externos llevan el ícono de flecha saliente.

### Navigation
Logo "AI toque" en tiza a 3rem (3.75rem desde 640 px) con la I en naranja, a la izquierda. A la derecha, enlaces en 600 con 8 px de relleno; la sección actual y el hover llevan un subrayado amarillo de 3 px, separado 10 px. En celular "Escribir una receta" se acorta a "Escribir" con su lápiz.

### Aviso
Caja con borde discontinuo celeste de 2 px, esquinas de 12 px, 16 px de relleno, ícono de información celeste y texto 1.125rem. Se usa con `role="status"`.

### Trazo (contenedor)
Contenedor de borde discontinuo de tiza al 25 %, esquinas de 16 px: estados vacíos, el 404, "Notas" y el panel desplegable "Pegar el texto".

### Fila del menú (signature)
Fila de lista de recetas: miniatura de 76 px (o inicial en tiza dentro de un cuadro discontinuo si no hay foto), nombre en tiza 2.5rem, puntitos y tiempo amarillo tabular; debajo, sitio de origen y porciones en 1rem al 75 %. En hover, fondo pizarra-clara y nombre subrayado.

### Ingrediente marcable (signature)
Casilla, nombre, puntitos y cantidad en 600 tabular a la derecha (hasta el 45 % del ancho). Al marcar, un trazo de tiza amarilla irregular cruza nombre y cantidad (260 ms, `--ease-tiza`) y el texto baja al 62 %.

### Paso numerado (signature)
Número monumental en tiza al 90 %, a la derecha de una columna de 60 px (80 px desde 640 px), texto de lectura a la derecha y casilla "Listo" debajo. El primer paso sin marcar es el paso en curso: su número se vuelve amarillo. Los pasos marcados se tachan igual que los ingredientes. Las marcas sobreviven a un bloqueo del celular (sessionStorage) y aparece "Desmarcar todo".

### Lista de compras
Junto al título "Ingredientes", dos enlaces de modo, **Cocinar** y **Comprar (n)**, con el mismo subrayado amarillo de la barra para el modo actual. En Comprar, la casilla de cada ingrediente significa "me falta" y no tacha. Debajo aparece un contenedor de trazo "Para comprar" con lo que falta, en el mismo módulo de menú; al marcar algo como comprado se tacha como al cocinar. Sus acciones: "Compartir la lista" (secundario; usa el menú de compartir del celular o copia el texto) y "Vaciar la lista" (texto con el ícono borrar). La lista se guarda en el recetario para toda la casa, y el inicio muestra "n por comprar" en el detalle de la receta.

### Íconos
Set propio de un solo trazo: 24 × 24, línea de 2 px, puntas y uniones redondas, `currentColor`, 20 px por defecto. Incluye volver, lápiz, externo, info, lupa, pegar, basura, reloj, porciones y borrar. Los nuevos íconos se dibujan con la misma regla.

## Do's and Don'ts

### Do:
- **Do** escribir títulos, nombres de recetas y números de paso en Amatic SC 700, y todo lo demás en Atkinson Hyperlegible Next.
- **Do** usar el módulo nombre · puntitos · valor para toda pareja nombre/cantidad, con el valor en `tabular-nums` a la derecha.
- **Do** reservar el amarillo para lo activo: acción principal, casilla marcada, tachado, paso en curso, foco y sección actual.
- **Do** mantener áreas táctiles de 56 px o más en botones y texto de lectura de 1.25rem en todo lo que se sigue mientras se cocina.
- **Do** separar y contener con trazos de tiza de 2 px (continuos, discontinuos o punteados según su uso) y con los tonos de pizarra.
- **Do** desactivar transiciones con `prefers-reduced-motion: reduce`.
- **Do** dibujar íconos nuevos con un solo trazo de 2 px en 24 × 24.

### Don't:
- **Don't** usar sombras, desenfoques ni degradados; la pizarra es plana.
- **Don't** usar fondos blancos ni tarjetas claras con foto en grilla: el recetario es una pizarra, no una galería.
- **Don't** usar naranja, celeste o coral fuera de su trabajo, ni introducir colores nuevos que compitan con las fotos.
- **Don't** poner párrafos, etiquetas, botones ni cantidades en letra de tiza.
- **Don't** reemplazar la I naranja del logo ni escribir el nombre sin ella.
- **Don't** usar la línea punteada para nada que no sea unir un nombre con su valor.
