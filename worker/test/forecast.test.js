import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildForecast } from '../src/forecast.js';
import { HttpError } from '../src/cwa.js';
import { DATASETS } from '../src/datasets.js';
import { fixtureCwa } from './helpers/fixtureCwa.js';

const meta = JSON.parse(readFileSync(new URL('./fixtures/morning/meta.json', import.meta.url), 'utf8'));
const now = new Date(meta.capturedAt);
const args = (cwa, over = {}) => ({ county: '新北市', town: '五股區', now, cwa, ...over });
const origErr = console.error;
test.beforeEach(() => { console.error = () => {}; });
test.afterEach(() => { console.error = origErr; });

test('morning fixtures build a full response', async () => {
  const r = await buildForecast(args(fixtureCwa('morning')));
  for (const k of ['county36h', 'threeDay', 'weekly', 'observation', 'sun']) {
    assert.notEqual(r[k], null, k);
    assert.equal(r.sources[k].ok, true, k);
  }
  assert.equal(r.county36h[0].label, '今日白天');
  assert.equal(r.county, '新北市');
  assert.equal(r.town, '五股區');
  assert.match(r.generatedAt, /\+08:00$/);
});

test('400 for unknown county', async () => {
  await assert.rejects(buildForecast(args(fixtureCwa('morning'), { county: '台北市' })), e => e instanceof HttpError && e.status === 400);
});

test('400 for unknown town', async () => {
  await assert.rejects(buildForecast(args(fixtureCwa('morning'), { town: '不存在區' })), e => e instanceof HttpError && e.status === 400);
});

test('one failing source yields null section and ok:false', async () => {
  const r = await buildForecast(args(fixtureCwa('morning', { fail: ['O-A0001-001'] })));
  assert.equal(r.observation, null);
  assert.equal(r.sources.observation.ok, false);
  for (const k of ['county36h', 'threeDay', 'weekly', 'sun']) assert.notEqual(r[k], null, k);
});

test('all sources failing gives 502', async () => {
  const d = DATASETS['新北市'];
  const cwa = fixtureCwa('morning', { fail: ['F-C0032-001', d.threeDay, d.weekly, 'O-A0001-001', 'A-B0062-001'] });
  await assert.rejects(buildForecast(args(cwa)), e => e instanceof HttpError && e.status === 502);
});

test('weekly missing the town only nulls weekly, not a 400', async () => {
  const base = fixtureCwa('morning');
  const weeklyId = DATASETS['新北市'].weekly;
  const cwa = {
    async get(id, p, ttl) {
      const j = await base.get(id, p, ttl);
      if (id === weeklyId) j.records.Locations[0].Location = [];
      return j;
    },
  };
  const r = await buildForecast(args(cwa));
  assert.equal(r.weekly, null);
  assert.equal(r.sources.weekly.ok, false);
  for (const k of ['county36h', 'threeDay', 'observation', 'sun']) assert.notEqual(r[k], null, k);
});
