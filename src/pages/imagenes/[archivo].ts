// Sirve las fotos descargadas al guardar recetas (las de Instagram caducan en su origen).
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { APIRoute } from 'astro';
import { CARPETA_DATOS } from '../../lib/db.ts';

const TIPOS: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

export const GET: APIRoute = async ({ params }) => {
	const archivo = params.archivo ?? '';
	const extension = archivo.match(/^[a-f0-9]{40}\.(jpg|png|webp)$/)?.[1];
	if (!extension) return new Response(null, { status: 404 });
	try {
		const datos = await readFile(join(CARPETA_DATOS, 'imagenes', archivo));
		return new Response(datos, {
			headers: { 'content-type': TIPOS[extension], 'cache-control': 'private, max-age=31536000, immutable' },
		});
	} catch {
		return new Response(null, { status: 404 });
	}
};
