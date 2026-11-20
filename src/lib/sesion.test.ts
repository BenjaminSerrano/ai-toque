import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fichaDeSesion, iguales, rutaDeVuelta } from './sesion.ts';

test('la ficha de sesión depende de la clave y no la contiene', () => {
	assert.equal(fichaDeSesion('cazuela'), fichaDeSesion('cazuela'));
	assert.notEqual(fichaDeSesion('cazuela'), fichaDeSesion('Cazuela'));
	assert.ok(!fichaDeSesion('cazuela').includes('cazuela'));
});

test('iguales compara textos de cualquier largo', () => {
	assert.ok(iguales('pastel de choclo', 'pastel de choclo'));
	assert.ok(!iguales('pastel de choclo', 'pastel de chocl'));
	assert.ok(!iguales('', 'x'));
});

test('rutaDeVuelta acepta rutas del sitio', () => {
	assert.equal(rutaDeVuelta('/recetas/3'), '/recetas/3');
	assert.equal(rutaDeVuelta('/?q=palta'), '/?q=palta');
	assert.equal(rutaDeVuelta(null), '/');
	assert.equal(rutaDeVuelta(''), '/');
	assert.equal(rutaDeVuelta('/entrar'), '/');
});

for (const ajena of ['https://malo.cl/', '//malo.cl/', '/\\malo.cl/', '/\t/malo.cl/', 'javascript:alert(1)']) {
	test(`rutaDeVuelta no lleva a otro sitio: ${JSON.stringify(ajena)}`, () => {
		assert.equal(rutaDeVuelta(ajena), '/');
	});
}
