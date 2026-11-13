import assert from 'node:assert/strict';
import { test } from 'node:test';
import { adaptarIngrediente, adaptarPaso, formatearCantidad, normalizar } from './adaptar.ts';

const casos: [string, string][] = [
	// Inglés
	['1 cup all-purpose flour', '1 taza de harina sin polvos de hornear'],
	['1 1/2 cups milk', '1 ½ tazas de leche'],
	['¾ cup sugar', '¾ taza de azúcar'],
	['1½ cups brown sugar', '1 ½ tazas de azúcar rubia'],
	['2 large eggs', '2 huevos grandes'],
	['1/2 cup unsalted butter, melted', '½ taza de mantequilla sin sal, derretida'],
	['8 oz cream cheese, softened', '225 g de queso crema, a temperatura ambiente'],
	['1 lb ground beef', '455 g de carne molida'],
	['2 sticks butter', '225 g de mantequilla'],
	['Salt and pepper, to taste', 'Sal y pimienta, a gusto'],
	['1 (14.5 oz) can diced tomatoes', '1 lata (410 g) de tomates en cubos'],
	['3 cloves garlic, minced', '3 dientes de ajo, picado fino'],
	['1 medium onion, diced', '1 cebolla mediana, en cubos'],
	['2 tablespoons olive oil', '2 cdas. de aceite de oliva'],
	['1 teaspoon vanilla extract', '1 cdta. de esencia de vainilla'],
	['1 cup chopped onion', '1 taza de cebolla picada'],
	['2 cups shredded mozzarella cheese', '2 tazas de queso mozzarella rallado'],
	['1/4 cup finely chopped fresh parsley', '¼ taza de perejil fresco picado fino'],
	['2 avocados', '2 paltas'],
	['1 cup (240 ml) heavy cream', '1 taza (240 ml) de crema para batir'],
	['2-3 tbsp lemon juice', '2 a 3 cdas. de jugo de limón'],
	['16 fl oz chicken broth', '475 ml de caldo de pollo'],
	['Pinch of salt', 'Pizca de sal'],
	['Dough:', 'Masa:'],
	['1.5 teaspoons (8g) fine sea salt', '1 ½ cdtas. (8g) de sal de mar fina'],
	['1 packet (9 grams) yeast', '1 sobre (9 g) de levadura'],
	['1 packet? (9 grams?) yeast', '1 sobre (9 g?) de levadura'],
	['250g / 8 oz macaroni (elbow pasta)', '250 g de coditos'],
	['2 tbsp (30g) unsalted butter (, melted)', '2 cdas. (30g) de mantequilla sin sal, derretida'],
	['1 tbsp unsalted butter ((or 2 tsp oil))', '1 cda. de mantequilla sin sal (o 2 cdta. aceite)'],
	['1 cup freshly shredded mozzarella cheese', '1 taza de queso mozzarella recién rallado'],
	['1 cup of water', '1 taza de agua'],
	// Español
	['2 tazas de harina', '2 tazas de harina'],
	['1/2 taza de azúcar', '½ taza de azúcar'],
	['200 gr. de mantequilla', '200 g de mantequilla'],
	['1 aguacate', '1 palta'],
	['250 g de fresas', '250 g de frutillas'],
	['½ cup (150g) dulce de leche', '½ taza (150g) de manjar'],
	['1 cucharada de fécula de maíz', '1 cda. de maicena'],
	['Sal y pimienta al gusto', 'Sal y pimienta al gusto'],
	['3 huevos', '3 huevos'],
	['Para la salsa:', 'Para la salsa:'],
];

for (const [entrada, esperado] of casos) {
	test(`ingrediente: ${entrada}`, () => assert.equal(adaptarIngrediente(entrada), esperado));
}

test('pasos: °F a °C, pulgadas a cm y quitar numeración', () => {
	assert.equal(adaptarPaso('1. Preheat oven to 350°F.'), 'Preheat oven to 180 °C.');
	assert.equal(adaptarPaso('Bake at 425 degrees for 20 minutes'), 'Bake at 220 °C for 20 minutes');
	assert.equal(adaptarPaso('Grease a 9x13 inch pan'), 'Grease a 23 x 33 cm pan');
	assert.equal(adaptarPaso('Use a 9-inch pie dish'), 'Use a 23 cm pie dish');
	assert.equal(adaptarPaso('Hornea a 180 grados'), 'Hornea a 180 grados');
	assert.equal(adaptarPaso('Calentar el aceite a 180°C o 350°F.'), 'Calentar el aceite a 180 °C.');
	assert.equal(adaptarPaso('Bake at 200C/400F'), 'Bake at 200 °C');
	assert.equal(adaptarPaso('11. 350 for 35-40 min, nice & golden brown'), '180 °C for 35-40 min, nice & golden brown');
	assert.equal(adaptarPaso('Preheat the oven to 375.'), 'Preheat the oven to 190 °C.');
	assert.equal(adaptarPaso('Roll out dough into 1/2 inch thick dough'), 'Roll out dough into 1 cm thick dough');
	assert.equal(adaptarPaso('Reduce to 300 ml and add 400 g of flour'), 'Reduce to 300 ml and add 400 g of flour');
	assert.equal(adaptarPaso('Hornea a 180 por 20 minutos'), 'Hornea a 180 por 20 minutos');
	assert.equal(adaptarPaso('4. mix until combined'), 'Mix until combined');
	assert.equal(adaptarPaso('Preheat the oven to 325°F (163°C).'), 'Preheat the oven to 163 °C.');
	assert.equal(adaptarPaso('Hornear a 175°C (350°F).'), 'Hornear a 175 °C.');
	assert.equal(adaptarPaso('Add the 8 oz (227g) of chocolate'), 'Add the 227 g of chocolate');
	assert.equal(adaptarPaso('Paso 2: Agrega las fresas'), 'Agrega las frutillas');
	assert.equal(adaptarPaso('1.5 kg de papas'), '1.5 kg de papas');
});

test('formatearCantidad', () => {
	assert.equal(formatearCantidad(0.5), '½');
	assert.equal(formatearCantidad(1.333), '1 ⅓');
	assert.equal(formatearCantidad(2), '2');
	assert.equal(formatearCantidad(1.5, true), '1,5');
});

test('normalizar', () => assert.equal(normalizar('Limón PICADO'), 'limon picado'));
