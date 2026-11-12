// Descargas seguras: el importador solo puede salir a internet pública.
// Evita que un link apunte a la red interna (localhost, el router, servicios de la nube).
import { lookup } from 'node:dns/promises';
import { BlockList, isIP } from 'node:net';

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

/** Rechaza protocolos, puertos y direcciones que no son de internet pública. */
export async function verificarDestino(url: URL): Promise<void> {
	if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new DestinoNoPermitido('Solo se aceptan links http o https.');
	if (url.port && url.port !== '80' && url.port !== '443') throw new DestinoNoPermitido('Ese link usa un puerto no permitido.');
	const host = url.hostname.replace(/^\[|\]$/g, '');
	const direcciones = isIP(host) ? [host] : (await lookup(host, { all: true })).map((d) => d.address);
	if (direcciones.length === 0 || direcciones.some(esPrivada)) {
		throw new DestinoNoPermitido('Ese link apunta a una dirección interna.');
	}
}

/** fetch que solo sale a internet pública y revisa cada redirección antes de seguirla. */
export async function pedir(url: string, init: RequestInit = {}): Promise<Response> {
	let actual = new URL(url);
	for (let salto = 0; salto <= 5; salto++) {
		await verificarDestino(actual);
		const respuesta = await fetch(actual, { ...init, redirect: 'manual' });
		const destino = respuesta.headers.get('location');
		if (respuesta.status >= 300 && respuesta.status < 400 && destino) {
			actual = new URL(destino, actual);
			continue;
		}
		return respuesta;
	}
	throw new DestinoNoPermitido('El link redirige demasiadas veces.');
}
