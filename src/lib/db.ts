// Recetario en SQLite, usando el SQLite que trae Node (sin dependencias).
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { normalizar } from './adaptar.ts';

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
	)
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
}

export function eliminarReceta(id: number): void {
	db.prepare('DELETE FROM recetas WHERE id = ?').run(id);
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
