// Adapta ingredientes y pasos a "lo de siempre": nombres chilenos, gramos/ml,
// tazas americanas y °C. Todo con reglas, sin IA.
import { FEMENINOS, INGLES, MODIFICADORES, REGIONAL } from './diccionario.ts';

// ---------- Utilidades de texto ----------

const porLargo = (a: string, b: string) => b.length - a.length;
const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const NO_LETRA_ANTES = '(?<![\\p{L}\\p{N}])';
const NO_LETRA_DESPUES = '(?![\\p{L}\\p{N}])';
const esMayuscula = (c: string) => c !== c.toLowerCase();
const capitalizar = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** Minúsculas y sin tildes, para buscar "limon" y encontrar "limón". */
export const normalizar = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

function crearTraductor(diccionario: Record<string, string>) {
	const claves = Object.keys(diccionario).sort(porLargo).map(escapar);
	const re = new RegExp(`${NO_LETRA_ANTES}(?:${claves.join('|')})${NO_LETRA_DESPUES}`, 'giu');
	return (texto: string) =>
		texto.replace(re, (encontrado) => {
			const valor = diccionario[encontrado.toLowerCase()] ?? encontrado;
			return esMayuscula(encontrado[0]) ? capitalizar(valor) : valor;
		});
}

const traducirRegional = crearTraductor(REGIONAL);
const traducirIngles = crearTraductor({ ...MODIFICADORES, ...INGLES });
const traducir = (texto: string) => traducirRegional(traducirIngles(texto));

// ---------- Números ----------

const FRACCIONES: Record<string, string> = {
	'½': '1/2', '⅓': '1/3', '⅔': '2/3', '¼': '1/4', '¾': '3/4',
	'⅕': '1/5', '⅛': '1/8', '⅜': '3/8', '⅝': '5/8', '⅞': '7/8',
};
const A_UNICODE: [number, string][] = [
	[1 / 8, '⅛'], [1 / 4, '¼'], [1 / 3, '⅓'], [3 / 8, '⅜'], [1 / 2, '½'],
	[5 / 8, '⅝'], [2 / 3, '⅔'], [3 / 4, '¾'], [7 / 8, '⅞'],
];
const NUM = String.raw`\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:[.,]\d+)?`;

/** Unifica fracciones (½ → 1/2), apóstrofes y espacios. */
function preparar(texto: string) {
	return texto
		.replace(/[’‘]/g, "'")
		.replace(/⁄/g, '/')
		.replace(/\(\(([^()]*)\)\)/g, '($1)') // "((Note 1))" → "(Note 1)"
		.replace(/\(\s*,\s*((?:[^()]|\([^()]*\))*)\)/g, ', $1') // "(, melted)" → ", melted"
		.replace(/(?:(\d)\s*)?([½⅓⅔¼¾⅕⅛⅜⅝⅞])/g, (_, entero: string | undefined, f: string) =>
			(entero ? `${entero} ` : '') + FRACCIONES[f],
		)
		.replace(/\s+/g, ' ')
		.trim();
}

function leerNumero(s: string): number {
	const t = s.replace(',', '.').trim();
	const mixto = t.match(/^(\d+)\s+(\d+)\/(\d+)$/);
	if (mixto) return Number(mixto[1]) + Number(mixto[2]) / Number(mixto[3]);
	const fraccion = t.match(/^(\d+)\/(\d+)$/);
	if (fraccion) return Number(fraccion[1]) / Number(fraccion[2]);
	return Number(t);
}

const decimal = (n: number) => n.toLocaleString('es-CL', { maximumFractionDigits: 2 });

/** 1.5 → "1 ½" (o "1,5" en medidas métricas). */
export function formatearCantidad(n: number, metrica = false): string {
	if (metrica) return decimal(n);
	const entero = Math.floor(n + 0.02);
	const resto = n - entero;
	if (Math.abs(resto) < 0.02) return String(entero);
	const fraccion = A_UNICODE.find(([valor]) => Math.abs(valor - resto) < 0.02);
	if (!fraccion) return decimal(n);
	return entero ? `${entero} ${fraccion[1]}` : fraccion[1];
}

function redondear(n: number, unidad: string): number {
	if (unidad === 'l') return Math.round(n * 100) / 100;
	if (n >= 100) return Math.round(n / 5) * 5;
	if (n >= 10) return Math.round(n);
	return Math.round(n * 2) / 2;
}

// ---------- Unidades ----------

interface Unidad {
	singular: string;
	plural: string;
	metrica?: boolean;
}

const UNIDADES: Record<string, Unidad> = {
	taza: { singular: 'taza', plural: 'tazas' },
	cda: { singular: 'cda.', plural: 'cdas.' },
	cdta: { singular: 'cdta.', plural: 'cdtas.' },
	g: { singular: 'g', plural: 'g', metrica: true },
	kg: { singular: 'kg', plural: 'kg', metrica: true },
	ml: { singular: 'ml', plural: 'ml', metrica: true },
	l: { singular: 'l', plural: 'l', metrica: true },
	pizca: { singular: 'pizca', plural: 'pizcas' },
	diente: { singular: 'diente', plural: 'dientes' },
	lata: { singular: 'lata', plural: 'latas' },
	paquete: { singular: 'paquete', plural: 'paquetes' },
	sobre: { singular: 'sobre', plural: 'sobres' },
	rebanada: { singular: 'rebanada', plural: 'rebanadas' },
	punado: { singular: 'puñado', plural: 'puñados' },
	ramita: { singular: 'ramita', plural: 'ramitas' },
	atado: { singular: 'atado', plural: 'atados' },
};

/** Medidas que no usas: se pasan a gramos, ml o litros. */
const CONVERSIONES: Record<string, { a: string; factor: number }> = {
	oz: { a: 'g', factor: 28.35 },
	lb: { a: 'g', factor: 453.6 },
	floz: { a: 'ml', factor: 29.57 },
	pinta: { a: 'ml', factor: 473 },
	cuarto: { a: 'ml', factor: 946 },
	galon: { a: 'l', factor: 3.785 },
	barra: { a: 'g', factor: 113 }, // "stick" de mantequilla
};

const ALIAS: Record<string, string> = {
	cup: 'taza', cups: 'taza', taza: 'taza', tazas: 'taza',
	tablespoon: 'cda', tablespoons: 'cda', tbsp: 'cda', tbsps: 'cda', tbs: 'cda', tbl: 'cda',
	cucharada: 'cda', cucharadas: 'cda', cda: 'cda', cdas: 'cda',
	teaspoon: 'cdta', teaspoons: 'cdta', tsp: 'cdta', tsps: 'cdta',
	cucharadita: 'cdta', cucharaditas: 'cdta', cdta: 'cdta', cdtas: 'cdta', cdita: 'cdta', cditas: 'cdta',
	g: 'g', gr: 'g', grs: 'g', gram: 'g', grams: 'g', gramo: 'g', gramos: 'g',
	kg: 'kg', kilo: 'kg', kilos: 'kg', kilogram: 'kg', kilograms: 'kg', kilogramo: 'kg', kilogramos: 'kg',
	ml: 'ml', cc: 'ml', milliliter: 'ml', milliliters: 'ml', millilitre: 'ml', millilitres: 'ml',
	mililitro: 'ml', mililitros: 'ml',
	l: 'l', liter: 'l', liters: 'l', litre: 'l', litres: 'l', litro: 'l', litros: 'l',
	oz: 'oz', ounce: 'oz', ounces: 'oz', onza: 'oz', onzas: 'oz',
	lb: 'lb', lbs: 'lb', pound: 'lb', pounds: 'lb', libra: 'lb', libras: 'lb',
	'fl oz': 'floz', 'fl. oz': 'floz', 'fluid ounce': 'floz', 'fluid ounces': 'floz',
	pint: 'pinta', pints: 'pinta', quart: 'cuarto', quarts: 'cuarto', qt: 'cuarto',
	gallon: 'galon', gallons: 'galon',
	stick: 'barra', sticks: 'barra',
	pinch: 'pizca', pinches: 'pizca', pizca: 'pizca', pizcas: 'pizca',
	clove: 'diente', cloves: 'diente', diente: 'diente', dientes: 'diente',
	can: 'lata', cans: 'lata', lata: 'lata', latas: 'lata',
	package: 'paquete', packages: 'paquete', paquete: 'paquete', paquetes: 'paquete',
	packet: 'sobre', packets: 'sobre', sachet: 'sobre', sachets: 'sobre', envelope: 'sobre', sobre: 'sobre', sobres: 'sobre',
	slice: 'rebanada', slices: 'rebanada', rebanada: 'rebanada', rebanadas: 'rebanada',
	handful: 'punado', handfuls: 'punado', puñado: 'punado', puñados: 'punado',
	sprig: 'ramita', sprigs: 'ramita', ramita: 'ramita', ramitas: 'ramita',
	bunch: 'atado', bunches: 'atado', atado: 'atado', atados: 'atado',
};

/** Unidades que pueden ir sin número ("pizca de sal"). */
const SIN_CANTIDAD = new Set(['pizca', 'punado', 'ramita', 'atado']);

const RE_CANTIDAD = new RegExp(`^(${NUM})(?:\\s*(?:-|–|—|a|to|or|o)\\s*(${NUM}))?\\s*`, 'i');
const ALIAS_RE = Object.keys(ALIAS).sort(porLargo).map(escapar).join('|');
const RE_UNIDAD = new RegExp(`^(${ALIAS_RE})\\.?${NO_LETRA_DESPUES}\\s*`, 'iu');
/** La misma medida en otro sistema: "250 g / 8 oz macaroni" → se queda con la primera. */
const RE_ALTERNATIVA = new RegExp(`^\\/\\s*(?:${NUM})\\s*(?:${ALIAS_RE})\\.?${NO_LETRA_DESPUES}\\s*`, 'iu');

// ---------- Conversiones dentro de un texto libre ----------

const aCelsius = (f: number) => Math.round((((f - 32) * 5) / 9) / 10) * 10;
const aCm = (pulgadas: number) => Math.round(pulgadas * 2.54);
const metrico = (n: number, factor: number, unidad: string) =>
	`${decimal(redondear(n * factor, unidad))} ${unidad}`;

/** Convierte °F, pulgadas, onzas y libras que aparezcan en cualquier parte del texto. */
export function convertirTexto(texto: string): string {
	return preparar(texto)
		.replace(/(\d{2,3})\s*(?:°|º|degrees?|grados)?\s*(?:F|Fahrenheit)(?!\p{L})/gu, (_, f) => `${aCelsius(Number(f))} °C`)
		.replace(/(\d{3})\s*(?:°|º|degrees?|grados)(?!\s*[CF])/gu, (m, f) =>
			Number(f) >= 300 ? `${aCelsius(Number(f))} °C` : m,
		)
		.replace(/(\d+(?:[.,]\d+)?)\s*x\s*(\d+(?:[.,]\d+)?)[\s-]*(?:inch(?:es)?|in\.)/gi, (_, a, b) =>
			`${aCm(leerNumero(a))} x ${aCm(leerNumero(b))} cm`,
		)
		.replace(new RegExp(`(${NUM})[\\s-]*(?:inch(?:es)?|in\\.)${NO_LETRA_DESPUES}`, 'giu'), (_, n) =>
			`${aCm(leerNumero(n))} cm`,
		)
		.replace(new RegExp(`(${NUM})[\\s-]*(?:fl\\.? ?oz\\.?|fluid ounces?)${NO_LETRA_DESPUES}`, 'giu'), (_, n) =>
			metrico(leerNumero(n), 29.57, 'ml'),
		)
		.replace(new RegExp(`(${NUM})[\\s-]*(?:oz|ounces?|onzas?)\\.?${NO_LETRA_DESPUES}`, 'giu'), (_, n) =>
			metrico(leerNumero(n), 28.35, 'g'),
		)
		.replace(new RegExp(`(${NUM})[\\s-]*(?:lbs?|pounds?|libras?)\\.?${NO_LETRA_DESPUES}`, 'giu'), (_, n) =>
			metrico(leerNumero(n), 453.6, 'g'),
		)
		// Si la receta ya traía °C y °F, ahora dice dos veces lo mismo: "180 °C o 180 °C" → "180 °C"
		.replace(/(\d{2,3})\s*°?\s*C(?!\p{L})/gu, '$1 °C')
		.replace(/(\d+ °C)\s*(?:\/|o|or|,)?\s*\(?\1\)?/gu, '$1');
}

// ---------- Nombre del ingrediente ----------

const CLAVES_INGLES = Object.keys(INGLES).sort(porLargo);
const CLAVES_MODIFICADORES = Object.keys(MODIFICADORES).sort(porLargo);

function prefijo(texto: string, claves: string[]) {
	const t = texto.toLowerCase();
	return claves.find((c) => t.startsWith(c) && !/[\p{L}\p{N}]/u.test(t[c.length] ?? ''));
}

/** Resuelve "picad@" / "grande#" según el género y número del ingrediente. */
function concordar(texto: string, sustantivo: string) {
	const palabra = normalizar(sustantivo.trim().split(' ')[0] ?? '');
	const plural = palabra.endsWith('s');
	const femenino = FEMENINOS.has(palabra) || /as?$/.test(palabra);
	return texto
		.replace(/@/g, (femenino ? 'a' : 'o') + (plural ? 's' : ''))
		.replace(/#/g, plural ? 's' : '');
}

function adaptarNombre(nombre: string): string {
	const [principal = '', ...resto] = nombre.split(',');
	let cuerpo = principal.trim();

	// "finely chopped fresh parsley" → los adjetivos van después: "perejil fresco picado fino"
	const adjetivos: string[] = [];
	for (;;) {
		const adjetivo = prefijo(cuerpo, CLAVES_MODIFICADORES);
		if (!adjetivo) break;
		const frase = prefijo(cuerpo, CLAVES_INGLES); // "ground beef" es un ingrediente, no "ground" + "beef"
		if (frase && frase.length >= adjetivo.length) break;
		adjetivos.unshift(MODIFICADORES[adjetivo]);
		cuerpo = cuerpo.slice(adjetivo.length).replace(/^[\s,]+/, '');
	}

	const sustantivo = traducir(convertirTexto(cuerpo));
	let texto = [sustantivo, ...adjetivos].filter(Boolean).join(' ');
	for (const parte of resto) texto += `, ${traducir(convertirTexto(parte))}`;
	texto = concordar(texto, sustantivo)
		.replace(/(\p{L}[\p{L} ]*?) \(\1\)/gu, '$1') // "coditos (coditos)" → "coditos"
		.replace(/\s+/g, ' ')
		.trim();
	return esMayuscula(principal.trim()[0] ?? '') ? capitalizar(texto) : texto;
}

// ---------- API pública ----------

/** "1 1/2 cups all-purpose flour" → "1 ½ tazas de harina sin polvos de hornear" */
export function adaptarIngrediente(linea: string): string {
	const texto = preparar(linea);
	if (!texto || texto.endsWith(':')) return traducir(texto);

	const cantidad = texto.match(RE_CANTIDAD);
	let resto = cantidad ? texto.slice(cantidad[0].length) : texto;
	let numeros = cantidad ? [cantidad[1], cantidad[2]].filter(Boolean).map(leerNumero) : [];

	// "1 (14 oz) can tomatoes" / "1 cup (240 ml) milk"
	let parentesis = '';
	const tomarParentesis = () => {
		const p = resto.match(/^(\([^)]*\))\s*/);
		if (!p) return;
		parentesis = [parentesis, traducir(convertirTexto(p[1]))].filter(Boolean).join(' ');
		resto = resto.slice(p[0].length);
	};
	tomarParentesis();

	let clave: string | undefined;
	const unidad = resto.match(RE_UNIDAD);
	if (unidad) {
		const candidata = ALIAS[unidad[1].toLowerCase()];
		if (numeros.length || SIN_CANTIDAD.has(candidata)) {
			clave = candidata;
			resto = resto.slice(unidad[0].length).replace(RE_ALTERNATIVA, '');
			tomarParentesis();
		}
	}
	resto = resto.replace(/^[?¿!.,;]+\s*/, '');
	tomarParentesis();
	resto = resto.replace(/^(?:of|de)\s+/i, '');

	const conversion = clave ? CONVERSIONES[clave] : undefined;
	if (conversion) {
		numeros = numeros.map((n) => redondear(n * conversion.factor, conversion.a));
		clave = conversion.a;
	}

	const medida = clave ? UNIDADES[clave] : undefined;
	const cantidadTexto = numeros.map((n) => formatearCantidad(n, medida?.metrica)).join(' a ');
	const nombre = adaptarNombre(resto);

	let resultado: string;
	if (medida) {
		const unidadTexto = Math.max(0, ...numeros) > 1 ? medida.plural : medida.singular;
		const inicio = [cantidadTexto, unidadTexto, parentesis].filter(Boolean).join(' ');
		resultado = nombre ? `${inicio} de ${nombre}` : inicio;
	} else {
		resultado = [cantidadTexto, parentesis, nombre].filter(Boolean).join(' ');
	}
	return esMayuscula(texto[0]) ? capitalizar(resultado) : resultado;
}

/** Quita la numeración, pasa °F/pulgadas/onzas a métrico y chileniza palabras sueltas. */
export function adaptarPaso(texto: string): string {
	const sinNumero = texto.replace(/^\s*(?:paso|step)?\s*\d+\s*[.):-](?!\d)\s*/i, '');
	return traducirRegional(convertirTexto(sinNumero));
}
