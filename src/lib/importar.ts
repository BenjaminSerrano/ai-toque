// Importa recetas desde páginas web (datos schema.org/Recipe), videos de YouTube,
// posts de Instagram o texto pegado a mano.
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { adaptarIngrediente, adaptarPaso } from './adaptar.ts';
import { CARPETA_DATOS, type DatosReceta } from './db.ts';
import { DestinoNoPermitido, pedir } from './red.ts';
import { limpiarTitulo, linkDeReceta, separarTexto } from './texto.ts';

export interface Importacion {
	receta: DatosReceta;
	/** Qué faltó, en palabras para quien cocina. Sin aviso, la receta vino completa. */
	aviso?: string;
}

/** Error con un mensaje que se puede mostrar tal cual. */
export class ErrorImportacion extends Error {}

const NAVEGADOR = {
	'user-agent':
		'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0 Safari/537.36',
	'accept-language': 'es-CL,es;q=0.9,en;q=0.8',
	accept: 'text/html,application/xhtml+xml',
};

async function descargar(url: string, cabeceras: Record<string, string> = {}): Promise<string> {
	let respuesta: Awaited<ReturnType<typeof pedir>>;
	try {
		respuesta = await pedir(url, { headers: { ...NAVEGADOR, ...cabeceras }, signal: AbortSignal.timeout(15_000) });
	} catch (error) {
		if (error instanceof DestinoNoPermitido) throw new ErrorImportacion(error.message);
		throw error;
	}
	if (!respuesta.ok) throw new ErrorImportacion(`La página respondió con error ${respuesta.status}.`);
	return respuesta.text();
}

export function importarDesdeUrl(url: string): Promise<Importacion> {
	if (idYouTube(url)) return importarYouTube(url);
	if (codigoInstagram(url)) return importarInstagram(url);
	return importarWeb(url);
}

// ---------- Páginas web ----------

async function importarWeb(url: string): Promise<Importacion> {
	return recetaDesdeHtml(await descargar(url), url);
}

/**
 * Arma la receta desde el HTML de una página. Primero usa la ficha schema.org/Recipe;
 * si no existe o viene sin ingredientes ni pasos, lee el texto visible de la página
 * buscando encabezados como "Ingredientes" y "Preparación".
 */
export function recetaDesdeHtml(html: string, url: string): Importacion {
	const datos = buscarReceta(html);
	let original = datos ? textos(datos.recipeIngredient ?? datos.ingredients).map(limpiar).filter(Boolean) : [];
	let pasos: string[] = datos ? instrucciones(datos.recipeInstructions) : [];
	if (!original.length && !pasos.length) {
		const visible = separarTexto(textoVisible(html));
		original = visible.ingredientes;
		pasos = visible.pasos;
	}

	const receta: DatosReceta = {
		...vacia(url),
		titulo: limpiar(datos?.name ?? meta(html, 'og:title') ?? html.match(/<title[^>]*>([^<]*)/i)?.[1]),
		imagen: datos ? imagen(datos.image) : (meta(html, 'og:image') ?? null),
		porciones: datos ? porciones(datos.recipeYield) : null,
		tiempo: datos ? (duracion(datos.totalTime) ?? sumarDuraciones(datos.prepTime, datos.cookTime)) : null,
		ingredientes: original.map(adaptarIngrediente).join('\n'),
		pasos: pasos.map(adaptarPaso).filter(Boolean).join('\n'),
		original: original.join('\n'),
	};
	if (original.length || pasos.length) return { receta };
	return {
		receta,
		aviso: 'No encontré la receta dentro de esa página. Te dejé el título y la foto; pega el texto o complétala a mano.',
	};
}

/** El texto que se ve en la página, una línea por bloque, sin scripts, estilos ni navegación. */
function textoVisible(html: string): string {
	const sinCodigo = html
		.replace(/<(script|style|noscript|svg|template|nav|footer|form)\b[\s\S]*?<\/\1>/gi, '')
		.replace(/<\/(p|li|div|h\d|tr|dt|dd|section|article)>|<br\s*\/?>/gi, '\n')
		.replace(/<[^>]+>/g, '');
	return decodificar(sinCodigo);
}

// ---------- Texto libre ----------

/** Arma la receta desde texto libre: una descripción, un post o texto pegado. */
export function desdeTexto(texto: string, base: Partial<DatosReceta> = {}): Importacion {
	const { ingredientes, pasos } = separarTexto(texto);
	const receta: DatosReceta = {
		...vacia(),
		...base,
		ingredientes: ingredientes.map(adaptarIngrediente).join('\n'),
		pasos: pasos.map(adaptarPaso).filter(Boolean).join('\n'),
		original: ingredientes.join('\n'),
	};
	if (!receta.titulo) {
		const primera = texto.split('\n').find((l) => l.trim() && !/^\W*(ingredientes?|ingredients?)\b/i.test(l.trim()));
		receta.titulo = primera ? limpiarTitulo(primera) : '';
	}
	if (ingredientes.length || pasos.length) return { receta };
	return {
		receta,
		aviso: 'No encontré ingredientes ni pasos en el texto. Funciona mejor si tiene encabezados como “Ingredientes” y “Preparación”.',
	};
}

// ---------- YouTube ----------

const idYouTube = (url: string) =>
	url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/)?.[1];

async function importarYouTube(url: string): Promise<Importacion> {
	const id = idYouTube(url) as string;
	// SOCS evita la pantalla de consentimiento de cookies que YouTube muestra en algunos países.
	const html = await descargar(`https://www.youtube.com/watch?v=${id}`, { cookie: 'SOCS=CAI' });
	const datos = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});(?:var|<\/script>)/s)?.[1];
	const video: Nodo = datos ? JSON.parse(datos).videoDetails : undefined;
	if (!video) throw new ErrorImportacion('No pude leer los datos del video.');

	const descripcion = String(video.shortDescription ?? '');
	const base = {
		url,
		titulo: limpiarTitulo(String(video.title ?? '')),
		imagen: video.thumbnail?.thumbnails?.at(-1)?.url ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
	};
	const resultado = desdeTexto(descripcion, base);
	if (!resultado.aviso) return resultado;

	// La descripción no trae la receta, pero quizás enlaza a la receta escrita ("RECIPE: https://…").
	const link = linkDeReceta(descripcion);
	if (link) {
		try {
			const web = await importarWeb(link);
			if (!web.aviso) {
				return { receta: { ...web.receta, url, imagen: web.receta.imagen ?? base.imagen, notas: `Receta escrita: ${link}` } };
			}
		} catch {
			// El sitio no se dejó leer: abajo se le indica dónde está la receta.
		}
		return {
			receta: { ...vacia(), ...base, notas: `Receta escrita: ${link}` },
			aviso: `La receta está escrita en ${sitio(link)}, pero ese sitio no me dejó leerla. Ábrela en ${link}, copia el texto y pégalo aquí abajo.`,
		};
	}
	return {
		receta: { ...vacia(), ...base },
		aviso: 'El video no trae la receta en la descripción. Si la tienes escrita en otro lado, pega el texto o complétala a mano.',
	};
}

// ---------- Instagram ----------

const codigoInstagram = (url: string) => url.match(/instagram\.com\/(?:[\w.]+\/)?(?:p|reels?|tv)\/([\w-]+)/)?.[1];

async function importarInstagram(url: string): Promise<Importacion> {
	const codigo = codigoInstagram(url) as string;
	let texto = '';
	let foto: string | null = null;

	// La versión "embebida" del post muestra el texto sin iniciar sesión.
	try {
		const html = await descargar(`https://www.instagram.com/p/${codigo}/embed/captioned/`);
		const json = html.match(/"edge_media_to_caption":\{"edges":\[\{"node":\{"text":"((?:[^"\\]|\\.)*)"/)?.[1];
		texto = json ? JSON.parse(`"${json}"`) : textoDeCaption(html);
		const src = html.match(/class="EmbeddedMediaImage"[^>]*?src="([^"]+)"/)?.[1];
		foto = src ? decodificar(src) : null;
	} catch {
		// Plan B abajo.
	}

	// Si Instagram no entrega el texto (posts sin inserción o que piden iniciar sesión), queda pegarlo.
	if (!texto) {
		return {
			receta: { ...vacia(url), imagen: foto },
			aviso: 'Instagram no me dejó leer el post. Ábrelo en el navegador, copia el texto y pégalo aquí abajo.',
		};
	}
	return desdeTexto(texto, { url, imagen: foto });
}

function textoDeCaption(html: string): string {
	const caption = html.match(/<div class="Caption">([\s\S]*?)<div class="CaptionComments">/)?.[1];
	if (!caption) return '';
	return limpiar(caption.replace(/<a class="CaptionUsername"[\s\S]*?<\/a>/, ''), true);
}

// ---------- Fotos ----------

const TIPOS_IMAGEN: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

/**
 * Las fotos de Instagram vienen con links que caducan en días.
 * Al guardar la receta se descarga una copia y se sirve desde /imagenes/.
 */
const MAXIMO_IMAGEN = 10 * 1024 * 1024;

function esDeInstagram(imagen: string): boolean {
	try {
		const { protocol, hostname } = new URL(imagen);
		return protocol === 'https:' && /(^|\.)(cdninstagram\.com|fbcdn\.net)$/.test(hostname);
	} catch {
		return false;
	}
}

export async function guardarImagenSiCaduca(imagen: string | null): Promise<string | null> {
	if (!imagen || !esDeInstagram(imagen)) return imagen;
	try {
		const respuesta = await pedir(imagen, { signal: AbortSignal.timeout(15_000) });
		const extension = TIPOS_IMAGEN[respuesta.headers.get('content-type')?.split(';')[0] ?? ''];
		const largo = Number(respuesta.headers.get('content-length') ?? 0);
		if (!respuesta.ok || !extension || largo > MAXIMO_IMAGEN) return imagen;
		const datos = Buffer.from(await respuesta.arrayBuffer());
		if (datos.length > MAXIMO_IMAGEN) return imagen;
		const nombre = `${createHash('sha1').update(datos).digest('hex')}.${extension}`;
		mkdirSync(join(CARPETA_DATOS, 'imagenes'), { recursive: true });
		writeFileSync(join(CARPETA_DATOS, 'imagenes', nombre), datos);
		return `/imagenes/${nombre}`;
	} catch {
		return imagen;
	}
}

/** "https://www.ejemplo.com/receta" → "ejemplo.com" */
export function sitio(url: string | null): string | null {
	if (!url) return null;
	try {
		return new URL(url).hostname.replace(/^www\./, '');
	} catch {
		return null;
	}
}

export const vacia = (url: string | null = null): DatosReceta => ({
	titulo: '',
	url,
	imagen: null,
	porciones: null,
	tiempo: null,
	ingredientes: '',
	pasos: '',
	notas: '',
	original: '',
});

// ---------- Búsqueda del JSON-LD ----------

// Los datos vienen de sitios de terceros y no tienen una forma fija.
type Nodo = any;

function buscarReceta(html: string): Nodo | undefined {
	const bloques = html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi);
	for (const [, contenido] of bloques) {
		try {
			const receta = encontrar(JSON.parse(contenido.trim()));
			if (receta) return receta;
		} catch {
			// JSON roto en la página: probamos con el siguiente bloque
		}
	}
}

function encontrar(nodo: Nodo): Nodo | undefined {
	if (!nodo || typeof nodo !== 'object') return;
	if (Array.isArray(nodo)) {
		for (const hijo of nodo) {
			const receta = encontrar(hijo);
			if (receta) return receta;
		}
		return;
	}
	const tipos = [nodo['@type']].flat();
	if (tipos.some((t) => typeof t === 'string' && t.toLowerCase().endsWith('recipe'))) return nodo;
	return encontrar(nodo['@graph']) ?? encontrar(nodo.mainEntity);
}

// ---------- Campos ----------

const textos = (valor: Nodo): string[] => [valor].flat().filter((v) => typeof v === 'string');

/** Prefiere la foto en tamaño original por sobre las miniaturas ("foto-225x225.jpg"). */
function imagen(valor: Nodo): string | null {
	const urls = [valor]
		.flat()
		.map((i) => (typeof i === 'string' ? i : (i?.url ?? i?.contentUrl)))
		.filter((u): u is string => typeof u === 'string');
	return urls.find((u) => !/-\d+x\d+\.\w+$/.test(u)) ?? urls.at(-1) ?? null;
}

function porciones(valor: Nodo): string | null {
	const texto = [valor].flat().map(String).find((v) => v.trim());
	if (!texto) return null;
	const limpio = limpiar(texto);
	if (/^\d+$/.test(limpio)) return `${limpio} porciones`;
	return limpio
		.replace(/^serves\s+(\d+)/i, '$1 porciones')
		.replace(/\bservings?\b/i, 'porciones')
		.replace(/^makes\s+/i, 'Rinde ');
}

function minutos(iso: unknown): number {
	const m = String(iso ?? '').match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?/);
	if (!m) return 0;
	return Number(m[1] ?? 0) * 1440 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0);
}

function formatearMinutos(total: number): string | null {
	if (!total) return null;
	const h = Math.floor(total / 60);
	const min = total % 60;
	return [h && `${h} h`, min && `${min} min`].filter(Boolean).join(' ');
}

/** "PT1H10M" → "1 h 10 min". Algunos sitios escriben el tiempo a mano ("45 min", "1 hr 20 mins"): se acepta tal cual. */
function duracion(valor: unknown): string | null {
	const formateada = formatearMinutos(minutos(valor));
	if (formateada) return formateada;
	const texto = limpiar(valor);
	if (!/^\d[\d\s.,–-]*(h|hr|hrs|hours?|horas?|min|mins|minutes?|minutos?)\b[\w\s.,–-]*$/i.test(texto) || texto.length > 25) return null;
	return texto
		.replace(/\b(?:hrs?|hours?|horas?)\b/gi, 'h')
		.replace(/\b(?:mins|minutes?|minutos?)\b/gi, 'min');
}
const sumarDuraciones = (a: unknown, b: unknown) => formatearMinutos(minutos(a) + minutos(b));

/** Aplana texto, HowToStep y HowToSection en una lista de pasos. Las secciones quedan como "Nombre:". */
function instrucciones(valor: Nodo): string[] {
	if (!valor) return [];
	if (typeof valor === 'string') return limpiar(valor, true).split('\n').filter(Boolean);
	if (Array.isArray(valor)) return valor.flatMap(instrucciones);
	if (valor.itemListElement) {
		const titulo = limpiar(valor.name);
		return [...(titulo ? [`${titulo.replace(/:$/, '')}:`] : []), ...instrucciones(valor.itemListElement)];
	}
	return instrucciones(valor.text ?? valor.name);
}

// ---------- HTML ----------

function meta(html: string, propiedad: string): string | undefined {
	const re = new RegExp(`<meta[^>]+(?:property|name)=["']${propiedad}["'][^>]+content=["']([^"']*)`, 'i');
	const valor = html.match(re)?.[1];
	return valor ? decodificar(valor) : undefined;
}

const ENTIDADES: Record<string, string> = {
	amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', deg: '°', frasl: '⁄',
	zwj: '‍', zwnj: '‌', shy: '',
	frac12: '½', frac14: '¼', frac34: '¾', ndash: '–', mdash: '—', hellip: '…',
	lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', times: '×',
	aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ', uuml: 'ü',
	Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú', Ntilde: 'Ñ',
};

function decodificar(texto: string): string {
	// Dos pasadas: algunos sitios codifican dos veces ("&amp;#39;").
	let resultado = texto;
	for (let i = 0; i < 2; i++) {
		resultado = resultado.replace(/&(#x[\da-f]+|#\d+|[a-z]+\d*);/gi, (entidad, codigo: string) => {
			if (codigo[0] !== '#') return ENTIDADES[codigo] ?? entidad;
			const hex = codigo[1].toLowerCase() === 'x';
			return String.fromCodePoint(Number.parseInt(codigo.slice(hex ? 2 : 1), hex ? 16 : 10));
		});
	}
	return resultado;
}

/** Quita etiquetas HTML y entidades. Con `lineas`, los párrafos y saltos se mantienen como "\n". */
function limpiar(valor: unknown, lineas = false): string {
	const texto = decodificar(
		String(valor ?? '')
			.replace(/<\/(p|li|div|h\d)>|<br\s*\/?>/gi, '\n')
			.replace(/<[^>]+>/g, ''),
	);
	const partes = texto.split('\n').map((l) => l.replace(/\s+/g, ' ').trim());
	return lineas ? partes.filter(Boolean).join('\n') : partes.filter(Boolean).join(' ');
}
