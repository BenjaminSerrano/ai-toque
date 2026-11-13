// Descargas seguras: el importador solo puede salir a internet pública.
// Evita que un link apunte a la red interna (localhost, el router, servicios de la nube).
//
// La IP se revisa en el momento de conectarse (no antes), así un dominio no puede
// responder con una IP pública al revisarlo y con una interna al conectar (DNS rebinding).
import { lookup, type LookupAddress } from 'node:dns';
import { BlockList, isIP, type LookupFunction } from 'node:net';
import { Agent, fetch, type RequestInit, type Response } from 'undici';

const privadas = new BlockList();
const RANGOS_IPV4: [string, number][] = [
	['0.0.0.0', 8],
	['10.0.0.0', 8],
	['100.64.0.0', 10],
	['127.0.0.0', 8],
	['169.254.0.0', 16], // incluye 169.254.169.254, los metadatos de la nube
	['172.16.0.0', 12],
	['192.0.0.0', 24],
	['192.168.0.0', 16],
	['198.18.0.0', 15],
	['224.0.0.0', 3], // multicast y reservadas
];
const RANGOS_IPV6: [string, number][] = [
	['::', 127], // :: y ::1
	['fc00::', 7],
	['fe80::', 10],
	['ff00::', 8],
];
for (const [red, bits] of RANGOS_IPV4) privadas.addSubnet(red, bits, 'ipv4');
for (const [red, bits] of RANGOS_IPV6) privadas.addSubnet(red, bits, 'ipv6');

export class DestinoNoPermitido extends Error {}

function esPrivada(direccion: string): boolean {
	const ipv4Mapeada = direccion.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i)?.[1];
	if (ipv4Mapeada) return privadas.check(ipv4Mapeada, 'ipv4');
	return privadas.check(direccion, isIP(direccion) === 6 ? 'ipv6' : 'ipv4');
}

/** Resolución de nombres que rechaza cualquier IP interna; se usa al abrir cada conexión. */
const lookupPublico = ((hostname, opciones, callback) => {
	lookup(hostname, { ...opciones, all: true }, (error, direcciones) => {
		if (error) return callback(error, '', 4);
		const lista = direcciones as LookupAddress[];
		if (lista.length === 0 || lista.some((d) => esPrivada(d.address))) {
			return callback(new DestinoNoPermitido('Ese link apunta a una dirección interna.'), '', 4);
		}
		if (opciones.all) return callback(null, lista as never);
		callback(null, lista[0].address, lista[0].family);
	});
}) as LookupFunction;

const agente = new Agent({ connect: { lookup: lookupPublico } });

/** Revisa protocolo, puerto y, si el link trae una IP escrita directo, que sea pública. */
export function verificarDestino(url: URL): void {
	if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new DestinoNoPermitido('Solo se aceptan links http o https.');
	if (url.port && url.port !== '80' && url.port !== '443') throw new DestinoNoPermitido('Ese link usa un puerto no permitido.');
	const host = url.hostname.replace(/^\[|\]$/g, '');
	if (isIP(host) && esPrivada(host)) throw new DestinoNoPermitido('Ese link apunta a una dirección interna.');
}

/** fetch que solo sale a internet pública y revisa cada redirección antes de seguirla. */
export async function pedir(url: string, init: RequestInit = {}): Promise<Response> {
	let actual = new URL(url);
	for (let salto = 0; salto <= 5; salto++) {
		verificarDestino(actual);
		let respuesta: Response;
		try {
			respuesta = await fetch(actual, { ...init, redirect: 'manual', dispatcher: agente });
		} catch (error) {
			// El rechazo de lookupPublico llega envuelto como causa del error de fetch.
			const causa = (error as { cause?: unknown }).cause;
			throw causa instanceof DestinoNoPermitido ? causa : error;
		}
		const destino = respuesta.headers.get('location');
		if (respuesta.status >= 300 && respuesta.status < 400 && destino) {
			actual = new URL(destino, actual);
			continue;
		}
		return respuesta;
	}
	throw new DestinoNoPermitido('El link redirige demasiadas veces.');
}
