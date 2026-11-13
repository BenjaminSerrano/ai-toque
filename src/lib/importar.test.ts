import assert from 'node:assert/strict';
import { test } from 'node:test';

// importar.ts abre la base de datos al cargarse: en las pruebas, una en memoria.
process.env.DB_PATH = ':memory:';
const { recetaDesdeHtml } = await import('./importar.ts');

// Como joshuaweissman.com: ficha schema.org sin ingredientes ni pasos; la receta está en el texto.
const pagina = `<html><head>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Recipe","name":"Best Ever Chewy Brownies",
"image":"https://example.com/brownies.jpg","recipeYield":"9","totalTime":"45 min "}</script>
<style>.ingredients-card{padding:0}</style></head><body>
<nav><a href="/">Recipes</a></nav>
<h1>Best Ever Chewy Brownies</h1>
<div><h3>Ingredients</h3><ul><li>6½ Tbsp (92g) unsalted butter</li><li>8 oz (227g) 70% dark chocolate, finely chopped</li><li>1 large egg</li></ul></div>
<div><h3>Directions</h3><p>Preheat the oven to 325°F (163°C).</p><p>Bake for 20–25 minutes.</p><p>&zwj;</p></div>
<div><h3>Comments &amp; Ratings</h3><p>Already have an account? Sign in</p></div>
</body></html>`;

test('ficha incompleta: lee ingredientes y pasos del texto visible', () => {
	const { receta, aviso } = recetaDesdeHtml(pagina, 'https://example.com/brownies');
	assert.equal(aviso, undefined);
	assert.equal(receta.titulo, 'Best Ever Chewy Brownies');
	assert.equal(receta.porciones, '9 porciones');
	assert.equal(receta.tiempo, '45 min');
	assert.equal(receta.imagen, 'https://example.com/brownies.jpg');
	assert.deepEqual(receta.ingredientes.split('\n'), [
		'6 ½ cdas. (92g) de mantequilla sin sal',
		'227 g de chocolate amargo 70%, picado fino',
		'1 huevo grande',
	]);
	assert.deepEqual(receta.pasos.split('\n'), ['Preheat the oven to 163 °C.', 'Bake for 20–25 minutes.']);
});

test('sin receta en ninguna parte: avisa', () => {
	const { aviso } = recetaDesdeHtml('<html><head><title>Hola</title></head><body><p>Nada</p></body></html>', 'https://example.com');
	assert.match(aviso ?? '', /No encontré la receta/);
});
