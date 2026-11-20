import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, test } from 'node:test';

// Base de datos de prueba en una carpeta temporal: nunca toca data/.
const carpeta = mkdtempSync(join(tmpdir(), 'ai-toque-'));
process.env.DB_PATH = join(carpeta, 'prueba.db');
const db = await import('./db.ts');
after(() => rmSync(carpeta, { recursive: true, force: true }));

const receta = (ingredientes: string) => ({
	titulo: 'Brownies',
	url: null,
	imagen: null,
	porciones: null,
	tiempo: null,
	ingredientes,
	pasos: '',
	notas: '',
	original: '',
});

test('lista de compras: anotar, comprar, contar y vaciar', () => {
	const id = db.crearReceta(receta('Masa:\n200 g de mantequilla\n3 huevos\n1 taza de azúcar'));
	assert.deepEqual(db.lineasDeIngredientes(db.obtenerReceta(id)!.ingredientes), [
		'200 g de mantequilla',
		'3 huevos',
		'1 taza de azúcar',
	]);

	db.anotarFalta(id, '3 huevos', true);
	db.anotarFalta(id, '200 g de mantequilla', true);
	db.anotarFalta(id, '3 huevos', true); // dos veces no la duplica
	assert.equal(db.pendientesPorReceta().get(id), 2);

	db.marcarComprado(id, '3 huevos', true);
	assert.deepEqual(Object.fromEntries(db.comprasDeReceta(id)), { '3 huevos': true, '200 g de mantequilla': false });
	assert.equal(db.pendientesPorReceta().get(id), 1);

	db.anotarFalta(id, '200 g de mantequilla', false);
	assert.equal(db.pendientesPorReceta().get(id), undefined);

	db.vaciarCompras(id);
	assert.equal(db.comprasDeReceta(id).size, 0);
});

test('al editar la receta, lo que ya no es ingrediente sale de la lista', () => {
	const id = db.crearReceta(receta('2 paltas\n1 limón'));
	db.anotarFalta(id, '2 paltas', true);
	db.anotarFalta(id, '1 limón', true);
	db.actualizarReceta(id, receta('3 paltas\n1 limón'));
	assert.deepEqual([...db.comprasDeReceta(id).keys()], ['1 limón']);
});

test('al borrar la receta se borra su lista de compras', () => {
	const id = db.crearReceta(receta('1 kg de harina'));
	db.anotarFalta(id, '1 kg de harina', true);
	db.eliminarReceta(id);
	assert.equal(db.comprasDeReceta(id).size, 0);
	assert.equal(db.pendientesPorReceta().get(id), undefined);
});
