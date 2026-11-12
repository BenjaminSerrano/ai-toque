# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Una persona en Chile que cocina en casa y comparte el recetario con quienes viven con ella (pareja o familia). Encuentra recetas en redes sociales (YouTube, Instagram) y páginas web, muchas en inglés o en español de otros países. Usa el sitio por igual en dos escenas: en el computador para importar, revisar y ordenar recetas, y en el celular en la cocina para seguir ingredientes y pasos mientras cocina.

## Product Purpose

Pegar un link y obtener la receta escrita "a la chilena": ingredientes con nombres locales (palta, choclo, porotos, maicena) y en sus medidas (gramos, ml, tazas americanas de 240 ml, °C). Guardarla en un recetario propio para no volver a buscarla en la red social. Éxito: encontrar y cocinar una receta guardada sin abrir la red social ni convertir nada mentalmente.

## Positioning

No es un buscador ni una red de recetas: es el cuaderno de recetas de la casa, que traduce lo que llega de afuera a los ingredientes del supermercado chileno y a las medidas de la propia cocina. La adaptación funciona con reglas y un diccionario editable, sin IA; el nombre "AI toque" se ríe de eso.

## Operating Context

- Importar desde páginas web (datos schema.org/Recipe), YouTube e Instagram (descripción del post), o escribir/pegar a mano.
- Toda receta importada pasa por una pantalla de revisión antes de guardarse; las imperfecciones de la adaptación se corrigen ahí.
- En la cocina: ingredientes marcables mientras se cocina, pasos numerados, lectura a distancia de brazo.
- Búsqueda por nombre o ingrediente, sin importar tildes.

## Capabilities and Constraints

- Astro 7 con render en servidor (adapter Node), Tailwind v4, SQLite integrado de Node. Despliegue previsto en Railway.
- Sin IA por ahora (decisión del usuario): los pasos en inglés quedan en inglés; solo se convierten temperaturas y medidas dentro del texto.
- Algunos sitios bloquean la importación; el flujo siempre cae a edición manual.
- Abierto: acceso con contraseña para la casa; escalado de porciones; que las correcciones alimenten el diccionario.

## Brand Commitments

- Nombre: "AI toque", juego con "al toque" (chilenismo: al tiro, enseguida).
- La I mayúscula se ve como una l y se destaca para revelar el chiste de la IA. Obligatorio mantener nombre y chiste.
- Voz: español de Chile, cercano, tuteo.

## Evidence on Hand

Recetas reales importadas como ejemplo (recipetineats.com, cocinachilena.cl), con fotos de los sitios de origen. No hay logo dibujado, fotos propias ni testimonios; no inventarlos.

## Product Principles

1. La receta es lo importante: la interfaz se aparta cuando se está cocinando.
2. Adaptar, no reescribir: lo que no se puede traducir bien queda visible para corregirlo, nunca se esconde.
3. Siempre hay salida manual: si la importación falla, se puede escribir la receta igual.
4. Funciona igual de bien en el notebook y en el celular con las manos ocupadas.

## Accessibility & Inclusion

Uso en cocina: texto legible a distancia de brazo, áreas táctiles grandes, contraste suficiente bajo luz de cocina.
