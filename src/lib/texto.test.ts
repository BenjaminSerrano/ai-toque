import assert from 'node:assert/strict';
import { test } from 'node:test';
import { limpiarTitulo, linkDeReceta, separarTexto } from './texto.ts';

// Extractos reales de descripciones de YouTube.
const megadelicias = `Hola queridos amigos, bienvenidos una vez más a nuestro canal MEGADELICIAS.

SUSCRÍBETE ES GRATIS!
MegaDelicias ➜ https://bit.ly/SubMegadelicias

►►Ingredientes
●2 tazas de harina
●7 plátanos maduros o 700gramos de plátanos maduros
●3 Huevos
●½ taza de leche

●1 cucharada de esencia de vainilla


Si te gusto esta receta apoyanos compartiendo en tus redes sociales favoritas!`;

const silvana = `Exquisito, rapido y facil queque de platano!!!

INGREDIENTES:
2 Platanos maduros (banana)
200 grms de azúcar
1 yogurt (125 grms)


TODOS LOS DERECHOS DE ESTOS VIDEOS SON RESERVADOS.
INSTAGRAM: SILVANACOCINA`;

const instagram = `Pan pita casero 🫓✨
Ingredientes para la masa:
- 500 g de harina
- 1 cdta de sal
Preparación 👇
1. Mezcla todo y amasa 10 minutos.
2. Hornea a 250 °C.
#pan #recetasfaciles`;

test('YouTube con encabezado ►►Ingredientes y viñetas ●', () => {
	const { ingredientes, pasos } = separarTexto(megadelicias);
	assert.deepEqual(ingredientes, [
		'2 tazas de harina',
		'7 plátanos maduros o 700gramos de plátanos maduros',
		'3 Huevos',
		'½ taza de leche',
		'1 cucharada de esencia de vainilla',
	]);
	assert.deepEqual(pasos, []);
});

test('YouTube con INGREDIENTES: y cierre de derechos reservados', () => {
	const { ingredientes } = separarTexto(silvana);
	assert.deepEqual(ingredientes, ['2 Platanos maduros (banana)', '200 grms de azúcar', '1 yogurt (125 grms)']);
});

test('Instagram con subtítulo, pasos numerados y hashtags', () => {
	const { ingredientes, pasos } = separarTexto(instagram);
	assert.deepEqual(ingredientes, ['Para la masa:', '500 g de harina', '1 cdta de sal']);
	assert.deepEqual(pasos, ['1. Mezcla todo y amasa 10 minutos.', '2. Hornea a 250 °C.']);
});

test('subtítulo con guion dentro de ingredientes ("Dough-")', () => {
	const { ingredientes } = separarTexto('Ingredients you\'ll need:\nDough-\n3/4 cup (174g) water\n3 tablespoons unsalted butter softened');
	assert.deepEqual(ingredientes, ['Dough:', '3/4 cup (174g) water', '3 tablespoons unsalted butter softened']);
});

test('pasos con sub-ítems con sangría se juntan en su paso', () => {
	const texto = `1. Bloom yeast
    1. 174g water
    2. 125g whole milk
    3. sit for 10 minutes
2. Flour mixture:
    1. 440 g of bread
    2. 8g sea salt
3. Pour in yeast mixture to flour in mixer`;
	assert.deepEqual(separarTexto(texto).pasos, [
		'1. Bloom yeast: 174g water, 125g whole milk, sit for 10 minutes',
		'2. Flour mixture: 440 g of bread, 8g sea salt',
		'3. Pour in yeast mixture to flour in mixer',
	]);
});

test('texto sin encabezados: rescata cantidades y pasos numerados', () => {
	const { ingredientes, pasos } = separarTexto('Queque rápido\n2 huevos\n1 taza de azúcar\n1) Batir todo\n2) Hornear');
	assert.deepEqual(ingredientes, ['2 huevos', '1 taza de azúcar']);
	assert.deepEqual(pasos, ['1) Batir todo', '2) Hornear']);
});

test('linkDeReceta encuentra el link a la receta escrita y omite redes', () => {
	assert.equal(
		linkDeReceta('Rico!\n\nRECIPE: https://preppykitchen.com/banana-bread/\nAmazon: https://www.amazon.com/x'),
		'https://preppykitchen.com/banana-bread/',
	);
	assert.equal(linkDeReceta('Sígueme en https://instagram.com/receta'), null);
});

test('"How To Make…" con más palabras es un título, no el encabezado de los pasos', () => {
	const { ingredientes, pasos } = separarTexto(
		'How To Make The Best Burger Buns Of All Time\nYou know those fancy burger buns?\nIngredients\n1 large egg\nDirections\nBake for 16 minutes.\nHow to make:\nEnjoy.',
	);
	assert.deepEqual(ingredientes, ['1 large egg']);
	assert.deepEqual(pasos, ['Bake for 16 minutes.', 'Enjoy.']);
});

test('post sin encabezado de pasos: el horneado y el comentario final no son ingredientes', () => {
	const post = `Dobladitas, muy faciles de hacer y demasiado ricas.

Ingredientes:
750gr de harina.
150gr de mantequilla.
340ml de agua caliente.

Hornear por 25 a 30min a 180grados.

Ideales para disfrutar una oncesita, ojala las hagan y las disfruten.`;
	const { ingredientes, pasos } = separarTexto(post);
	assert.deepEqual(ingredientes, ['750gr de harina', '150gr de mantequilla', '340ml de agua caliente']);
	assert.deepEqual(pasos, ['Hornear por 25 a 30min a 180grados.']);
});

test('post sin encabezados: "5 CHURRASCAS" es el rendimiento, no un ingrediente', () => {
	const { ingredientes } = separarTexto(
		'QUE TOMAN DE ONCE HOY?\n@pf_marca_oficial #pflaoncedechile\n\n5 CHURRASCAS\n200gr harina\n50cc aceite de maravilla\n1 cuchara de polvos de hornear',
	);
	assert.deepEqual(ingredientes, ['200gr harina', '50cc aceite de maravilla', '1 cuchara de polvos de hornear']);
});

test('letras de fantasía de Instagram pasan a letras normales', () => {
	assert.equal(limpiarTitulo('𝐌𝐀𝐍𝐉𝐀𝐑𝐀𝐓𝐄'), 'Manjarate');
	assert.equal(limpiarTitulo('𝑸𝒖𝒆𝒒𝒖𝒆 𝒅𝒆 𝒑𝒍𝒂́𝒕𝒂𝒏𝒐'), 'Queque de plátano');
	const { ingredientes } = separarTexto('𝐈𝐧𝐠𝐫𝐞𝐝𝐢𝐞𝐧𝐭𝐞𝐬:\n𝟏 lata de leche evaporada\n½ taza de ＡＺÚＣＡＲ');
	assert.deepEqual(ingredientes, ['1 lata de leche evaporada', '½ taza de AZÚCAR']);
});

test('limpiarTitulo', () => {
	assert.equal(limpiarTitulo('PASTEL DE CHOCLO 2025 | Alvaro Barrientos'), 'Pastel de choclo 2025');
	assert.equal(limpiarTitulo('Queque de platano #queque #recetas'), 'Queque de platano');
	assert.equal(limpiarTitulo('Amazing Banana Bread Recipe'), 'Amazing Banana Bread Recipe');
});
