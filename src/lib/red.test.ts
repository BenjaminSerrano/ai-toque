import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DestinoNoPermitido, pedir, verificarDestino } from './red.ts';

for (const url of [
	'http://127.0.0.1/',
	'http://10.0.0.5/',
	'http://192.168.1.1/admin',
	'http://172.20.3.4/',
	'http://169.254.169.254/latest/meta-data/',
	'http://[::1]/',
	'http://[::ffff:127.0.0.1]/',
	'http://[fd00::1]/',
	'http://0.0.0.0/',
	'http://localhost:4321/',
	'file:///etc/passwd',
	'javascript:alert(1)',
	'https://8.8.8.8:8443/',
]) {
	test(`rechaza ${url} antes de conectar`, () => assert.throws(() => verificarDestino(new URL(url)), DestinoNoPermitido));
}

test('acepta IPs públicas escritas directo', () => {
	verificarDestino(new URL('https://8.8.8.8/'));
	verificarDestino(new URL('http://[2001:4860:4860::8888]/'));
});

// Un nombre que resuelve a una IP interna se rechaza al conectar, no solo al revisar el link.
test('rechaza al conectar un nombre que resuelve a la red interna', () =>
	assert.rejects(pedir('http://localhost/'), DestinoNoPermitido));
