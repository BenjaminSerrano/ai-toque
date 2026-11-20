// Acceso al recetario con una sola clave para la casa (variable de entorno CLAVE).
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const COOKIE_SESION = 'sesion';

/** La clave de la casa, o undefined si no está configurada. */
export function claveDeLaCasa(): string | undefined {
	return process.env.CLAVE?.trim() || undefined;
}

/** Valor de la cookie de sesión. Si cambia la clave, cambia este valor y se cierran las sesiones abiertas. */
export function fichaDeSesion(clave: string): string {
	return createHmac('sha256', clave).update('ai-toque:sesion').digest('base64url');
}

/** Compara dos textos sin que el tiempo de respuesta revele cuántos caracteres coinciden. */
export function iguales(a: string, b: string): boolean {
	const resumen = (texto: string) => createHash('sha256').update(texto).digest();
	return timingSafeEqual(resumen(a), resumen(b));
}

/** A dónde volver después de entrar: solo rutas de este mismo sitio. */
export function rutaDeVuelta(volver: string | null | undefined): string {
	try {
		const url = new URL(volver || '/', 'http://local');
		// "/.//malo.cl" queda como "//malo.cl", que el navegador lee como otro sitio: se deja una sola "/".
		const ruta = '/' + url.pathname.replace(/^\/+/, '');
		if (url.origin === 'http://local' && ruta !== '/entrar') return ruta + url.search;
	} catch {
		// Si no se puede leer, se vuelve al inicio.
	}
	return '/';
}
