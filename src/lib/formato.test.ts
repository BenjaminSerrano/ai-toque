import assert from 'node:assert/strict';
import { test } from 'node:test';
import { agrupar, separarCantidad } from './formato.ts';

const casos: [string, string, string | null][] = [
	['3 tazas (375 gramos) de harina sin polvos de hornear', 'Harina sin polvos de hornear (375 gramos)', '3 tazas'],
	['½ taza de azúcar flor', 'Azúcar flor', '½ taza'],
	['1 ½ cdtas. de polvos de hornear', 'Polvos de hornear', '1 ½ cdtas.'],
	['225 g de queso crema, a temperatura ambiente', 'Queso crema, a temperatura ambiente', '225 g'],
	['2 huevos grandes', 'Huevos grandes', '2'],
	['2 a 3 cdas. de jugo de limón', 'Jugo de limón', '2 a 3 cdas.'],
	['1 lata (410 g) de tomates en cubos', 'Tomates en cubos (410 g)', '1 lata'],
	['Sal y pimienta, a gusto', 'Sal y pimienta, a gusto', null],
	['pizca de sal', 'pizca de sal', null],
	['1,5 kg de papas', 'Papas', '1,5 kg'],
	['3 dientes de ajo, picado fino', 'Ajo, picado fino', '3 dientes'],
	['2 limones', 'Limones', '2'],
];

for (const [linea, nombre, cantidad] of casos) {
	test(`separarCantidad: ${linea}`, () => assert.deepEqual(separarCantidad(linea), { nombre, cantidad }));
}

test('agrupar respeta subtítulos', () => {
	assert.deepEqual(agrupar('Para la masa:\n500 g de harina\n\nPara el relleno:\n1 palta'), [
		{ titulo: 'Para la masa', lineas: ['500 g de harina'] },
		{ titulo: 'Para el relleno', lineas: ['1 palta'] },
	]);
});
