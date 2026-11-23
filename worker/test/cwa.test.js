import test from 'node:test';
import assert from 'node:assert/strict';
import { createCwaClient } from '../src/cwa.js';

function counting(body = { success: 'true', records: {} }) {
  const urls = [];
  const f = async url => { urls.push(String(url)); return { ok: true, status: 200, json: async () => body }; };
  return { f, urls };
}

test('cache key excludes api key and second call within ttl does not fetch', async () => {
  const { f, urls } = counting();
  const cache = new Map();
  const c1 = createCwaClient({ apiKey: 'SECRET1', fetchImpl: f, cache, nowMs: () => 0 });
  const c2 = createCwaClient({ apiKey: 'SECRET2', fetchImpl: f, cache, nowMs: () => 1000 });
  await c1.get('X-1', 'b=2&a=1', 60);
  await c2.get('X-1', 'a=1&b=2', 60);
  assert.equal(urls.length, 1);
  assert.ok(urls[0].startsWith('https://opendata.cwa.gov.tw/api/v1/rest/datastore/X-1?Authorization=SECRET1&'));
  for (const k of cache.keys()) assert.ok(!k.includes('SECRET'));
});

test('refetches after ttl', async () => {
  const { f, urls } = counting();
  let t = 0;
  const c = createCwaClient({ apiKey: 'K', fetchImpl: f, cache: new Map(), nowMs: () => t });
  await c.get('X-1', '', 60);
  t = 61_000;
  await c.get('X-1', '', 60);
  assert.equal(urls.length, 2);
});

test('error message never contains the api key', async () => {
  const f = async () => ({ ok: false, status: 401, json: async () => ({}) });
  const c = createCwaClient({ apiKey: 'SECRET', fetchImpl: f, cache: new Map() });
  await assert.rejects(c.get('X-1', 'a=1', 60), err => {
    assert.ok(!err.message.includes('SECRET'));
    assert.ok(err.message.includes('X-1') && err.message.includes('401'));
    return true;
  });
});

test('success !== "true" throws without url', async () => {
  const f = async () => ({ ok: true, status: 200, json: async () => ({ success: 'false' }) });
  const c = createCwaClient({ apiKey: 'SECRET', fetchImpl: f, cache: new Map() });
  await assert.rejects(c.get('X-1', '', 60), err => !err.message.includes('SECRET') && !err.message.includes('http'));
});

test('malformed JSON error does not leak response text and has id and status', async () => {
  const f = async () => ({ ok: true, status: 200, json: async () => { throw new SyntaxError('Unexpected token SENTINEL in JSON'); } });
  const c = createCwaClient({ apiKey: 'K', fetchImpl: f, cache: new Map() });
  await assert.rejects(c.get('X-1', '', 60), err => {
    assert.ok(!err.message.includes('SENTINEL'));
    assert.ok(err.message.includes('X-1') && err.message.includes('200'));
    return true;
  });
});

test('success false message includes dataset id and HTTP 200', async () => {
  const f = async () => ({ ok: true, status: 200, json: async () => ({ success: 'false' }) });
  const c = createCwaClient({ apiKey: 'K', fetchImpl: f, cache: new Map() });
  await assert.rejects(c.get('X-1', '', 60), err => err.message.includes('X-1') && err.message.includes('200'));
});

test('expired entry of a different key is evicted on a later store', async () => {
  const { f } = counting();
  const cache = new Map();
  let t = 0;
  const c = createCwaClient({ apiKey: 'K', fetchImpl: f, cache, nowMs: () => t });
  await c.get('OLD-1', 'd=1', 60);
  t = 61_000;
  await c.get('NEW-1', 'd=2', 60);
  assert.equal(cache.size, 1);
  assert.ok([...cache.keys()][0].startsWith('NEW-1'));
});
