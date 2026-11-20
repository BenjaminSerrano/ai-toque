// Recetario en SQLite, usando el SQLite que trae Node (sin dependencias).
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { normalizar } from './adaptar.ts';
import { agrupar } from './formato.ts';

export interface DatosReceta {
	titulo: string;
	url: string | null;
	imagen: string | null;
	porciones: string | null;
	tiempo: string | null;
	/** Una línea por ingrediente. Las líneas que terminan en ":" son subtítulos. */
	ingredientes: string;
	/** Una línea por paso. */
	pasos: string;
	notas: string;
	/** Ingredientes tal como venían, antes de adaptarlos. */
	original: string;
}

export interface Receta extends DatosReceta {
	id: number;
	creada: string;
}

const ruta = process.env.DB_PATH ?? 'data/ai-toque.db';
/** Carpeta de la base de datos; también guarda las fotos descargadas. */
export const CARPETA_DATOS = dirname(ruta);
mkdirSync(CARPETA_DATOS, { recursive: true });
const db = new DatabaseSync(ruta);

db.exec(`
	CREATE TABLE IF NOT EXISTS recetas (
		id INTEGER PRIMARY KEY,
		titulo TEXT NOT NULL,
		url TEXT UNIQUE,
		imagen TEXT,
		porciones TEXT,
		tiempo TEXT,
		ingredientes TEXT NOT NULL DEFAULT '',
		pasos TEXT NOT NULL DEFAULT '',
		notas TEXT NOT NULL DEFAULT '',
		original TEXT NOT NULL DEFAULT '',
		busqueda TEXT NOT NULL DEFAULT '',
		creada TEXT NOT NULL DEFAULT (datetime('now'))
	);

	-- Lista de compras de cada receta, compartida por la casa: lo que falta y si ya se compró.
	CREATE TABLE IF NOT EXISTS compras (
		receta_id INTEGER NOT NULL REFERENCES recetas(id) ON DELETE CASCADE,
		linea TEXT NOT NULL,
		comprado INTEGER NOT NULL DEFAULT 0,
		PRIMARY KEY (receta_id, linea)
	);
`);

const conBusqueda = (d: DatosReceta) => ({
	...d,
	busqueda: normalizar([d.titulo, d.ingredientes, d.notas].join(' ')),
});

/** Todas las recetas, o las que contienen todas las palabras buscadas (sin importar tildes). */
export function listarRecetas(consulta = ''): Receta[] {
	const palabras = normalizar(consulta).split(/\s+/).filter(Boolean);
	const filtro = palabras.map(() => 'busqueda LIKE ?').join(' AND ');
	const sql = `SELECT * FROM recetas ${filtro ? `WHERE ${filtro}` : ''} ORDER BY id DESC`;
	return db.prepare(sql).all(...palabras.map((p) => `%${p}%`)) as unknown as Receta[];
}

export function obtenerReceta(id: number): Receta | undefined {
	return db.prepare('SELECT * FROM recetas WHERE id = ?').get(id) as unknown as Receta | undefined;
}

export function recetaPorUrl(url: string): Receta | undefined {
	return db.prepare('SELECT * FROM recetas WHERE url = ?').get(url) as unknown as Receta | undefined;
}

export function crearReceta(datos: DatosReceta): number {
	const { lastInsertRowid } = db
		.prepare(
			`INSERT INTO recetas (titulo, url, imagen, porciones, tiempo, ingredientes, pasos, notas, original, busqueda)
			 VALUES (:titulo, :url, :imagen, :porciones, :tiempo, :ingredientes, :pasos, :notas, :original, :busqueda)`,
		)
		.run(conBusqueda(datos));
	return Number(lastInsertRowid);
}

export function actualizarReceta(id: number, datos: DatosReceta): void {
	db.prepare(
		`UPDATE recetas SET titulo = :titulo, url = :url, imagen = :imagen, porciones = :porciones, tiempo = :tiempo,
		 ingredientes = :ingredientes, pasos = :pasos, notas = :notas, original = :original, busqueda = :busqueda
		 WHERE id = :id`,
	).run({ ...conBusqueda(datos), id });
	// Lo que estaba en la lista de compras y ya no es un ingrediente sale de la lista.
	const vigentes = new Set(lineasDeIngredientes(datos.ingredientes));
	for (const linea of comprasDeReceta(id).keys()) if (!vigentes.has(linea)) anotarFalta(id, linea, false);
}

export function eliminarReceta(id: number): void {
	db.prepare('DELETE FROM recetas WHERE id = ?').run(id);
}

/** Las líneas de ingredientes tal como se muestran (sin subtítulos). */
export function lineasDeIngredientes(ingredientes: string): string[] {
	return agrupar(ingredientes).flatMap((grupo) => grupo.lineas);
}

/** Lista de compras de una receta: cada ingrediente que falta y si ya se compró. */
export function comprasDeReceta(id: number): Map<string, boolean> {
	const filas = db.prepare('SELECT linea, comprado FROM compras WHERE receta_id = ?').all(id) as unknown as {
		linea: string;
		comprado: number;
	}[];
	return new Map(filas.map((fila) => [fila.linea, fila.comprado === 1]));
}

/** Agrega un ingrediente a la lista de compras, o lo saca. */
export function anotarFalta(id: number, linea: string, falta: boolean): void {
	if (falta) db.prepare('INSERT OR IGNORE INTO compras (receta_id, linea) VALUES (?, ?)').run(id, linea);
	else db.prepare('DELETE FROM compras WHERE receta_id = ? AND linea = ?').run(id, linea);
}

export function marcarComprado(id: number, linea: string, comprado: boolean): void {
	db.prepare('UPDATE compras SET comprado = ? WHERE receta_id = ? AND linea = ?').run(comprado ? 1 : 0, id, linea);
}

export function vaciarCompras(id: number): void {
	db.prepare('DELETE FROM compras WHERE receta_id = ?').run(id);
}

/** Cuántas cosas quedan por comprar en cada receta que tiene lista. */
export function pendientesPorReceta(): Map<number, number> {
	const filas = db
		.prepare('SELECT receta_id, count(*) AS n FROM compras WHERE comprado = 0 GROUP BY receta_id')
		.all() as unknown as { receta_id: number; n: number }[];
	return new Map(filas.map((fila) => [fila.receta_id, fila.n]));
}

/** Lee el formulario de receta (crear o editar). */
export function leerFormulario(form: FormData): DatosReceta {
	const texto = (campo: string) => String(form.get(campo) ?? '').replace(/\r\n/g, '\n').trim();
	const opcional = (campo: string) => texto(campo) || null;
	// Solo links http(s): un "javascript:…" guardado se ejecutaría al hacer clic en la receta.
	const enlace = (campo: string) => {
		const valor = texto(campo);
		if (campo === 'imagen' && /^\/imagenes\/[a-f0-9]{40}\.(jpg|png|webp)$/.test(valor)) return valor;
		try {
			const url = new URL(valor);
			return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
		} catch {
			return null;
		}
	};
	return {
		titulo: texto('titulo') || 'Receta sin título',
		url: enlace('url'),
		imagen: enlace('imagen'),
		porciones: opcional('porciones'),
		tiempo: opcional('tiempo'),
		ingredientes: texto('ingredientes'),
		pasos: texto('pasos'),
		notas: texto('notas'),
		original: texto('original'),
	};
}
