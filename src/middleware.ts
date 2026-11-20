// Todo el recetario pide la clave de la casa, salvo la página para escribirla.
import { defineMiddleware } from 'astro:middleware';
import { claveDeLaCasa, COOKIE_SESION, fichaDeSesion, iguales } from './lib/sesion.ts';

export const onRequest = defineMiddleware((contexto, siguiente) => {
	const clave = claveDeLaCasa();
	if (!clave) {
		// En desarrollo se puede trabajar sin clave; publicado, sin clave no se abre.
		if (import.meta.env.DEV) return siguiente();
		return new Response('Falta configurar la variable de entorno CLAVE.', { status: 503 });
	}
	if (contexto.url.pathname === '/entrar') return siguiente();

	const ficha = contexto.cookies.get(COOKIE_SESION)?.value;
	if (ficha && iguales(ficha, fichaDeSesion(clave))) return siguiente();

	const volver = contexto.url.pathname + contexto.url.search;
	return contexto.redirect(volver === '/' ? '/entrar' : `/entrar?volver=${encodeURIComponent(volver)}`, 303);
});
