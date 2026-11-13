// Lee recetas escritas como texto libre: descripciones de YouTube, posts de Instagram
// o texto pegado a mano. Separa ingredientes y pasos según sus encabezados.

const RE_INGREDIENTES =
	/^(?:ingredientes?|ingredients?|lo que (?:vas a )?necesitas?|necesitas|you'?ll need|what you'?ll need)\b\s*(.*?)\s*:?$/i;
const RE_PASOS =
	/^(?:preparaci[oó]n|elaboraci[oó]n|procedimiento|paso a paso|pasos|modo de preparaci[oó]n|instrucciones|c[oó]mo (?:se )?(?:hace|prepara)|instructions|method|directions|steps|how to make(?: it)?)\b\s*(.*?)\s*:?$/i;

/** Líneas que no son parte de la receta: redes sociales, links, hashtags, saludos de cierre. */
const RE_RUIDO =
	/https?:\/\/|www\.|bit\.ly|(^|\s)#\w|@\w{3,}|suscr[ií]b|subscribe|s[ií]gue(?:me|nos)|follow (?:me|us)|derechos|copyright|patreon|amazon|afiliad|affiliate|m[uú]sica|music|\bcanal\b|channel|instagram|facebook|tiktok|twitter|correo|contacto|e-?mail|gracias por|si te gust|dale like|comp[aá]rte|share|^\d{1,2}:\d{2}|^(?:comments?|comentarios?|reviews?|rese[ñn]as?|ratings?|valoraci[oó]n|newsletter|related|relacionad|you may also like|tambi[eé]n te puede)\b/i;

/** Viñetas, flechas y emojis al principio o final de una línea. */
const RE_ADORNOS_INICIO = /^[\s\p{Extended_Pictographic}️‍•●○◦▪▫■□►▶➤➜→⇒✓✔☑*·\-–—_=~|]+/u;
const RE_ADORNOS_FIN = /[\s\p{Extended_Pictographic}️‍•●►▶➤➜→]+$/u;

const limpiarLinea = (linea: string) =>
	linea.replace(RE_ADORNOS_INICIO, '').replace(RE_ADORNOS_FIN, '').replace(/\s+/g, ' ').trim();

/** Parece ingrediente: empieza con una cantidad o una fracción y es corta. */
const pareceIngrediente = (linea: string) => /^(\d|[½⅓⅔¼¾⅛])/.test(linea) && linea.length <= 90;
/** Parece paso: viene numerado ("1.", "2)", "Paso 3"). */
const parecePaso = (linea: string) => /^(?:paso\s*)?\d+\s*[.):-](?!\d)/i.test(linea);

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
	const crudas = texto.split(/\r?\n/);
	const lineas = crudas.map(limpiarLinea);
	const sangrias = crudas.map((cruda) => /^(?: {2,}|\t)/.test(cruda));
	const ingredientes: string[] = [];
	const pasos = new Pasos();
	let seccion: 'ninguna' | 'ingredientes' | 'pasos' = 'ninguna';
	let hubo = false;

	for (const [i, linea] of lineas.entries()) {
		if (!linea) continue;
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
		if (seccion === 'ingredientes') ingredientes.push(linea);
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
	let t = titulo
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
