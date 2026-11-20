// Guarda la lista de compras de una receta, compartida por toda la casa.
import type { APIRoute } from 'astro';
import { anotarFalta, lineasDeIngredientes, marcarComprado, obtenerReceta, vaciarCompras } from '../../../lib/db.ts';

export const POST: APIRoute = async ({ params, request, redirect }) => {
	const id = Number(params.id);
	const receta = obtenerReceta(id);
	if (!receta) return new Response(null, { status: 404 });

	const form = await request.formData();
	const accion = form.get('accion');
	if (accion === 'vaciar') {
		vaciarCompras(id);
		return redirect(`/recetas/${id}?comprar#ingredientes-titulo`, 303);
	}

	// Solo se anotan ingredientes que de verdad están en la receta.
	const linea = String(form.get('linea') ?? '');
	if (!lineasDeIngredientes(receta.ingredientes).includes(linea)) return new Response(null, { status: 400 });
	const si = form.get('valor') === '1';
	if (accion === 'falta') anotarFalta(id, linea, si);
	else if (accion === 'comprado') marcarComprado(id, linea, si);
	else return new Response(null, { status: 400 });
	return new Response(null, { status: 204 });
};
