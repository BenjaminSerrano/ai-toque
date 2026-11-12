// Ayudas para mostrar recetas como en la pizarra: ingrediente a la izquierda, cantidad a la derecha.

const CANTIDAD = String.raw`(?:\d+(?:[.,]\d+)?(?:\s+\d+\/\d+|\/\d+)?|[½⅓⅔¼¾⅛⅜⅝⅞])(?:\s*[½⅓⅔¼¾⅛⅜⅝⅞])?`;
const UNIDAD = String.raw`tazas?|cdas?\.|cdtas?\.|cucharad(?:it)?as?|kg|g|ml|l|cc|pizcas?|dientes?|latas?|paquetes?|rebanadas?|puñados?|ramitas?|atados?|unidad(?:es)?`;
const RE_INICIO = new RegExp(
	`^(${CANTIDAD}(?:\\s*(?:a|-|–)\\s*${CANTIDAD})?(?:\\s*(?:${UNIDAD})(?![\\p{L}]))?(?:\\s*\\([^)]*\\))?)\\s+(?:de\\s+)?(.+)$`,
	'iu',
);

export interface LineaMenu {
	nombre: string;
	cantidad: string | null;
}

/**
 * "3 tazas (375 gramos) de harina" → { nombre: "Harina (375 gramos)", cantidad: "3 tazas" }
 * La equivalencia entre paréntesis pasa al nombre para que la columna de cantidades quede corta.
 */
export function separarCantidad(linea: string): LineaMenu {
	const m = linea.trim().match(RE_INICIO);
	if (!m) return { nombre: linea.trim(), cantidad: null };
	const equivalencia = m[1].match(/\s*(\([^)]*\))$/);
	const cantidad = equivalencia ? m[1].slice(0, equivalencia.index).trim() : m[1].trim();
	const nombre = [m[2].trim(), equivalencia?.[1]].filter(Boolean).join(' ');
	return { nombre: nombre[0].toUpperCase() + nombre.slice(1), cantidad };
}

export interface Grupo {
	titulo?: string;
	lineas: string[];
}

/** Separa las líneas en grupos; una línea que termina en ":" abre un grupo nuevo. */
export function agrupar(texto: string): Grupo[] {
	const grupos: Grupo[] = [{ lineas: [] }];
	for (const linea of texto.split('\n').map((l) => l.trim()).filter(Boolean)) {
		if (linea.endsWith(':')) grupos.push({ titulo: linea.slice(0, -1), lineas: [] });
		else grupos[grupos.length - 1].lineas.push(linea);
	}
	return grupos.filter((g) => g.titulo || g.lineas.length);
}
