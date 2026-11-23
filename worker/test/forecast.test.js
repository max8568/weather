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

// 換掉某一份資料集回應的內容，其他照 fixtures
const patched = (datasetId, change) => {
  const base = fixtureCwa('morning');
  return {
    async get(id, p, ttl) {
      const j = await base.get(id, p, ttl);
      if (id === datasetId) change(j);
      return j;
    },
  };
};
const threeDayId = DATASETS['新北市'].threeDay;
const weeklyId = DATASETS['新北市'].weekly;

test('18:00 rollover: the same morning payload at 17:59 and 18:01', async () => {
  const at = time => buildForecast(args(fixtureCwa('morning'), { now: new Date(`2026-11-23T${time}:00+08:00`) }));
  const before = await at('17:59'), after = await at('18:01');
  assert.ok(before.county36h.map(p => p.label).includes('今日白天'));
  assert.equal(before.weekly.days[0].label, '今天');
  assert.notEqual(before.weekly.days[0].day, null);
  assert.equal(before.weekly.uv.label, '紫外線');

  assert.ok(!after.county36h.map(p => p.label).includes('今日白天'));
  assert.deepEqual(after.county36h.map(p => p.label), ['今晚明晨', '明日白天']);
  assert.equal(after.weekly.days[0].label, '今天');
  assert.equal(after.weekly.days[0].day, null);
  assert.notEqual(after.weekly.days[0].night, null);
  assert.equal(after.weekly.uv.label, '明天紫外線');
});

test('400 for an unknown town is decided before any upstream call', async () => {
  let calls = 0;
  const cwa = { async get() { calls++; throw new Error('should not be called'); } };
  const is400 = e => e instanceof HttpError && e.status === 400 && e.message === '未知的鄉鎮';
  await assert.rejects(buildForecast(args(cwa, { town: '不存在區' })), is400);
  await assert.rejects(buildForecast(args(cwa, { town: '中正區' })), is400); // 別的縣市才有的鄉鎮
  assert.equal(calls, 0);
});

test('three-day response missing a valid town only nulls threeDay, not a 400', async () => {
  const r = await buildForecast(args(patched(threeDayId, j => { j.records.Locations[0].Location = []; })));
  assert.equal(r.threeDay, null);
  assert.equal(r.sources.threeDay.ok, false);
  for (const k of ['county36h', 'weekly', 'observation', 'sun']) assert.notEqual(r[k], null, k);
  assert.equal(typeof r.observation.temperature.value, 'number'); // 沒有經緯度時改找同鄉鎮、同縣市的測站
});

test('a town without temperature slots or weekly halves makes that section unavailable', async () => {
  const dropElement = name => j => {
    const loc = j.records.Locations[0].Location.find(l => l.LocationName === '五股區');
    loc.WeatherElement = loc.WeatherElement.filter(e => e.ElementName !== name);
  };
  const a = await buildForecast(args(patched(threeDayId, dropElement('溫度'))));
  assert.equal(a.threeDay, null);
  assert.equal(a.sources.threeDay.ok, false);
  assert.notEqual(a.weekly, null);
  const b = await buildForecast(args(patched(weeklyId, dropElement('天氣現象'))));
  assert.equal(b.weekly, null);
  assert.equal(b.sources.weekly.ok, false);
  assert.notEqual(b.threeDay, null);
});

test('observation rainToday is null when the station reading is from yesterday', async () => {
  const r = await buildForecast(args(fixtureCwa('morning'), { now: new Date('2026-11-24T00:05:00+08:00') }));
  assert.equal(r.observation.rainToday, null);
  assert.notEqual(r.observation.temperature, null);
});
