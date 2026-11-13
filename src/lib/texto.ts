// Lee recetas escritas como texto libre: descripciones de YouTube, posts de Instagram
// o texto pegado a mano. Separa ingredientes y pasos según sus encabezados.

const RE_INGREDIENTES =
	/^(?:ingredientes?|ingredients?|lo que (?:vas a )?necesitas?|necesitas|you'?ll need|what you'?ll need)\b\s*(.*?)\s*:?$/i;
const RE_PASOS =
	// "How to make" y "Cómo se prepara" solo son encabezado si van solos: "How To Make The Best Buns" es un título.
	/^(?:preparaci[oó]n|elaboraci[oó]n|procedimiento|paso a paso|pasos|modo de preparaci[oó]n|instrucciones|c[oó]mo (?:se )?(?:hace|prepara)(?=\s*:?$)|instructions|method|directions|steps|how to make(?: it)?(?=\s*:?$))\b\s*(.*?)\s*:?$/i;

/** Líneas que no son parte de la receta: redes sociales, links, hashtags, saludos de cierre. */
const RE_RUIDO =
	/https?:\/\/|www\.|bit\.ly|(^|\s)#\w|@\w{3,}|suscr[ií]b|subscribe|s[ií]gue(?:me|nos)|follow (?:me|us)|derechos|copyright|patreon|amazon|afiliad|affiliate|m[uú]sica|music|\bcanal\b|channel|instagram|facebook|tiktok|twitter|correo|contacto|e-?mail|gracias por|si te gust|dale like|comp[aá]rte|share|^\d{1,2}:\d{2}|^(?:comments?|comentarios?|reviews?|rese[ñn]as?|ratings?|valoraci[oó]n|newsletter|related|relacionad|you may also like|tambi[eé]n te puede)\b/i;

/** Viñetas, flechas y emojis al principio o final de una línea. */
const RE_ADORNOS_INICIO = /^[\s\p{Extended_Pictographic}️‍•●○◦▪▫■□►▶➤➜→⇒✓✔☑*·\-–—_=~|]+/u;
const RE_ADORNOS_FIN = /[\s\p{Extended_Pictographic}️‍•●►▶➤➜→]+$/u;

/**
 * Letras "de fantasía" que se usan en Instagram para resaltar (𝐌𝐀𝐍𝐉𝐀𝐑, 𝑡𝑎𝑧𝑎, 𝟏, ＭＡＮＪＡＲ, Ⓜ):
 * son símbolos que se parecen a letras, no letras. Se pasan a letras normales para que tomen
 * la tipografía de la pizarra y para que las cantidades se puedan leer.
 * Solo se tocan esos bloques: normalizar todo el texto convertiría ½ en 1⁄2.
 */
export const letrasNormales = (texto: string) =>
	texto
		.replace(/[\u{1D400}-\u{1D7FF}\u{FF01}-\u{FF5E}\u{24B6}-\u{24E9}\u{1F130}-\u{1F149}]/gu, (c) => c.normalize('NFKC'))
		.normalize('NFC'); // vuelve a unir letra y tilde sueltas ("a" + "́" → "á")

const limpiarLinea = (linea: string) =>
	linea.replace(RE_ADORNOS_INICIO, '').replace(RE_ADORNOS_FIN, '').replace(/\s+/g, ' ').trim();

/** Parece ingrediente: empieza con una cantidad o una fracción y es corta. */
const pareceIngrediente = (linea: string) => /^(\d|[½⅓⅔¼¾⅛])/.test(linea) && linea.length <= 90;
/** Parece paso: viene numerado ("1.", "2)", "Paso 3"). */
const parecePaso = (linea: string) => /^(?:paso\s*)?\d+\s*[.):-](?!\d)/i.test(linea);
/** Empieza con un verbo de cocina: "Hornear por 25 min" dentro de una lista de ingredientes es un paso. */
const RE_VERBO =
	/^(?:hornear|precalentar|mezclar|batir|amasar|cocinar|fre[ií]r|refrigerar|servir|bake|preheat|whisk|knead|serve|refrigerate)\b/i;

export interface TextoSeparado {
	ingredientes: string[];
	pasos: string[];
}

/**
 * Junta los sub-ítems con sangría a su paso:
 * "1. Bloom yeast" + "   1. 174g water" + "   2. 125g milk" → "1. Bloom yeast: 174g water, 125g milk"
 */
class Pasos {
	private lista: { texto: string; partes: string[] }[] = [];

	agregar(linea: string, sangria: boolean) {
		const anterior = this.lista.at(-1);
		// Un subtítulo sin número ("Para la masa:") no recibe sub-ítems; un paso numerado sí.
		const esSubtitulo = anterior?.texto.endsWith(':') && !parecePaso(anterior.texto);
		if (sangria && anterior && !esSubtitulo) {
			anterior.partes.push(linea.replace(/^(?:paso\s*)?\d+\s*[.):-](?!\d)\s*/i, ''));
		} else {
			this.lista.push({ texto: linea, partes: [] });
		}
	}

	get length() {
		return this.lista.length;
	}

	resultado(): string[] {
		return this.lista.map(({ texto, partes }) =>
			partes.length ? `${texto.replace(/\s*:$/, '')}: ${partes.join(', ')}` : texto,
		);
	}
}

export function separarTexto(texto: string): TextoSeparado {
	// Ninguna línea real de receta mide miles de caracteres; recortarlas acota el trabajo.
	const crudas = letrasNormales(texto)
		.split(/\r?\n/)
		.map((l) => l.slice(0, 3000));
	const lineas = crudas.map(limpiarLinea);
	const sangrias = crudas.map((cruda) => /^(?: {2,}|\t)/.test(cruda));
	const ingredientes: string[] = [];
	const pasos = new Pasos();
	let seccion: 'ninguna' | 'ingredientes' | 'pasos' = 'ninguna';
	let hubo = false;

	for (const [i, linea] of lineas.entries()) {
		if (!linea) continue;
		const trasBlanco = i > 0 && !lineas[i - 1];
		const ing = linea.length <= 45 ? linea.match(RE_INGREDIENTES) : null;
		const pas = linea.length <= 45 ? linea.match(RE_PASOS) : null;
		if (ing || pas) {
			seccion = ing ? 'ingredientes' : 'pasos';
			hubo = true;
			// "Ingredientes para el relleno:" → subtítulo "Para el relleno:"
			const resto = (ing ?? pas)?.[1]?.replace(/:$/, '');
			if (resto && /^(?:para|for)\b/i.test(resto)) {
				const titulo = `${resto[0].toUpperCase()}${resto.slice(1)}:`;
				if (ing) ingredientes.push(titulo);
				else pasos.agregar(titulo, false);
			}
			continue;
		}
		if (RE_RUIDO.test(linea)) {
			seccion = 'ninguna';
			continue;
		}
		// Subtítulo dentro de una sección: "Dough-", "Para el relleno:", "Masa —"
		const subtitulo = seccion !== 'ninguna' && linea.length <= 40 && !/\d/.test(linea) && linea.match(/^(.+?)\s*[-–—:]$/);
		if (subtitulo) {
			if (seccion === 'ingredientes') ingredientes.push(`${subtitulo[1]}:`);
			else pasos.agregar(`${subtitulo[1]}:`, false);
			continue;
		}
		if (seccion === 'ingredientes') {
			// "Hornear por 25 a 30 min…" escrito bajo los ingredientes es un paso.
			if (RE_VERBO.test(linea)) {
				pasos.agregar(linea, false);
				continue;
			}
			// Tras una línea en blanco, una frase larga sin cantidad ("Ideales para la once…") cierra la lista.
			if (trasBlanco && !pareceIngrediente(linea) && linea.length > 35) {
				seccion = 'ninguna';
				continue;
			}
			ingredientes.push(linea.replace(/\.$/, ''));
		}
		else if (seccion === 'pasos') pasos.agregar(linea, sangrias[i]);
	}

	// Sin encabezados: rescatar lo que tiene forma de ingrediente o de paso numerado.
	if (!hubo) {
		for (const [i, linea] of lineas.entries()) {
			if (!linea || RE_RUIDO.test(linea)) continue;
			if (sangrias[i] && pasos.length) pasos.agregar(linea, true);
			else if (parecePaso(linea)) pasos.agregar(linea, false);
			else if (pareceIngrediente(linea)) ingredientes.push(linea);
		}
	}
	return { ingredientes, pasos: pasos.resultado() };
}

/** Primer link de la descripción que parece llevar a la receta escrita ("RECIPE: https://…"). */
export function linkDeReceta(texto: string): string | null {
	const sociales = /youtu|instagram|facebook|tiktok|twitter|x\.com|amazon|bit\.ly|goo\.gl|patreon|spotify|linktr|a\.co\//i;
	for (const linea of texto.split('\n')) {
		const url = linea.match(/https?:\/\/\S+/)?.[0];
		if (url && /recipe|receta/i.test(linea) && !sociales.test(url)) return url.replace(/[).,]+$/, '');
	}
	return null;
}

/** "RECETA DE QUEQUE 🍌 #postres | Mi Canal" → "Receta de queque" */
export function limpiarTitulo(titulo: string): string {
	let t = letrasNormales(titulo)
		.replace(/#[\p{L}\p{N}_]+/gu, '')
		.replace(/[\p{Extended_Pictographic}️‍]/gu, '')
		.split(/\s[|•]\s/)[0]
		.replace(/\s+/g, ' ')
		.trim();
	const letras = t.replace(/[^\p{L}]/gu, '');
	const mayusculas = letras.replace(/[^\p{Lu}]/gu, '');
	if (letras.length > 6 && mayusculas.length / letras.length > 0.7) {
		t = t.toLowerCase();
		t = t[0].toUpperCase() + t.slice(1);
	}
	return t.length > 90 ? `${t.slice(0, 87).trimEnd()}…` : t;
}
