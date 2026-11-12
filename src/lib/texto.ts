// Lee recetas escritas como texto libre: descripciones de YouTube, posts de Instagram
// o texto pegado a mano. Separa ingredientes y pasos según sus encabezados.

const RE_INGREDIENTES =
	/^(?:ingredientes?|ingredients?|lo que (?:vas a )?necesitas?|necesitas|you'?ll need|what you'?ll need)\b\s*(.*?)\s*:?$/i;
const RE_PASOS =
	/^(?:preparaci[oó]n|elaboraci[oó]n|procedimiento|paso a paso|pasos|modo de preparaci[oó]n|instrucciones|c[oó]mo (?:se )?(?:hace|prepara)|instructions|method|directions|steps|how to make(?: it)?)\b\s*(.*?)\s*:?$/i;

/** Líneas que no son parte de la receta: redes sociales, links, hashtags, saludos de cierre. */
const RE_RUIDO =
	/https?:\/\/|www\.|bit\.ly|(^|\s)#\w|@\w{3,}|suscr[ií]b|subscribe|s[ií]gue(?:me|nos)|follow (?:me|us)|derechos|copyright|patreon|amazon|afiliad|affiliate|m[uú]sica|music|\bcanal\b|channel|instagram|facebook|tiktok|twitter|correo|contacto|e-?mail|gracias por|si te gust|dale like|comp[aá]rte|share|^\d{1,2}:\d{2}/i;

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

export function separarTexto(texto: string): TextoSeparado {
	const lineas = texto.split(/\r?\n/).map(limpiarLinea);
	const ingredientes: string[] = [];
	const pasos: string[] = [];
	let seccion: 'ninguna' | 'ingredientes' | 'pasos' = 'ninguna';
	let hubo = false;

	for (const linea of lineas) {
		if (!linea) continue;
		const ing = linea.length <= 45 ? linea.match(RE_INGREDIENTES) : null;
		const pas = linea.length <= 45 ? linea.match(RE_PASOS) : null;
		if (ing || pas) {
			seccion = ing ? 'ingredientes' : 'pasos';
			hubo = true;
			// "Ingredientes para el relleno:" → subtítulo "Para el relleno:"
			const resto = (ing ?? pas)?.[1]?.replace(/:$/, '');
			if (resto && /^(?:para|for)\b/i.test(resto)) {
				(ing ? ingredientes : pasos).push(`${resto[0].toUpperCase()}${resto.slice(1)}:`);
			}
			continue;
		}
		if (RE_RUIDO.test(linea)) {
			seccion = 'ninguna';
			continue;
		}
		if (seccion === 'ingredientes') ingredientes.push(linea);
		else if (seccion === 'pasos') pasos.push(linea);
	}

	// Sin encabezados: rescatar lo que tiene forma de ingrediente o de paso numerado.
	if (!hubo) {
		for (const linea of lineas) {
			if (!linea || RE_RUIDO.test(linea)) continue;
			if (parecePaso(linea)) pasos.push(linea);
			else if (pareceIngrediente(linea)) ingredientes.push(linea);
		}
	}
	return { ingredientes, pasos };
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
