import test from 'node:test';
import assert from 'node:assert/strict';
import handler, { handleRequest } from '../src/index.js';
import { HttpError } from '../src/cwa.js';

const env = { CWA_API_KEY: 'SECRETKEY123', ALLOWED_ORIGINS: 'http://localhost:8000,https://a.github.io' };
const deps = (bf = async () => ({ ok: 1 })) => ({ buildForecast: bf, createCwaClient: () => ({}) });
const url = '/api/forecast?county=a&town=b';
const req = (path, origin, method = 'GET') => new Request('http://x' + path, { method, headers: origin ? { Origin: origin } : {} });
const origErr = console.error;
test.beforeEach(() => { console.error = () => {}; });
test.afterEach(() => { console.error = origErr; });

test('CORS header only for allowed origin', async () => {
  const a = await handleRequest(req(url, 'http://localhost:8000'), env, deps());
  assert.equal(a.headers.get('Access-Control-Allow-Origin'), 'http://localhost:8000');
  assert.equal(a.headers.get('Vary'), 'Origin');
  assert.equal(a.headers.get('Cache-Control'), 'public, max-age=300');
  const b = await handleRequest(req(url, 'http://evil.com'), env, deps());
  assert.equal(b.headers.get('Access-Control-Allow-Origin'), null);
  assert.equal(b.headers.get('Vary'), 'Origin');
  const o = await handleRequest(req(url, 'http://localhost:8000', 'OPTIONS'), env, deps());
  assert.equal(o.status, 204);
  assert.equal(o.headers.get('Access-Control-Allow-Origin'), 'http://localhost:8000');
});

test('missing params gives 400 JSON', async () => {
  const r = await handleRequest(req('/api/forecast?county=a'), env, deps());
  assert.equal(r.status, 400);
  assert.deepEqual(await r.json(), { error: '缺少 county 或 town' });
});

test('unknown path gives 404', async () => {
  const r = await handleRequest(req('/nope'), env, deps());
  assert.equal(r.status, 404);
  assert.deepEqual(await r.json(), { error: '找不到' });
});

test('HttpError status and message pass through', async () => {
  const r = await handleRequest(req(url), env, deps(async () => { throw new HttpError(400, '未知的縣市'); }));
  assert.equal(r.status, 400);
  assert.deepEqual(await r.json(), { error: '未知的縣市' });
});

test('response body never contains env.CWA_API_KEY', async () => {
  const r = await handleRequest(req(url), env, deps(async () => { throw new Error('boom https://x?Authorization=SECRETKEY123'); }));
  assert.equal(r.status, 500);
  const text = await r.text();
  assert.equal(text, JSON.stringify({ error: '伺服器錯誤' }));
  assert.ok(!text.includes('SECRETKEY123'));
});

test('default export has fetch', () => assert.equal(typeof handler.fetch, 'function'));
