import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DestinoNoPermitido, verificarDestino } from './red.ts';

const rechaza = (url: string) =>
	test(`rechaza ${url}`, () => assert.rejects(verificarDestino(new URL(url)), DestinoNoPermitido));

for (const url of [
	'http://127.0.0.1/',
	'http://localhost:4321/',
	'http://localhost/',
	'http://10.0.0.5/',
	'http://192.168.1.1/admin',
	'http://172.20.3.4/',
	'http://169.254.169.254/latest/meta-data/',
	'http://[::1]/',
	'http://[::ffff:127.0.0.1]/',
	'http://[fd00::1]/',
	'http://0.0.0.0/',
	'file:///etc/passwd',
	'javascript:alert(1)',
	'https://8.8.8.8:8443/',
]) {
	rechaza(url);
}

test('acepta direcciones públicas', async () => {
	await verificarDestino(new URL('https://8.8.8.8/'));
	await verificarDestino(new URL('http://[2001:4860:4860::8888]/'));
});
