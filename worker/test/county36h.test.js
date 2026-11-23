import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCounty36h } from '../src/parse/county36h.js';

const times = [
  ['2026-11-23 06:00:00', '2026-11-23 18:00:00'],
  ['2026-11-23 18:00:00', '2026-11-24 06:00:00'],
  ['2026-11-24 06:00:00', '2026-11-24 18:00:00'],
];
const el = (elementName, params) => ({
  elementName,
  time: times.map(([startTime, endTime], i) => ({ startTime, endTime, parameter: params[i] })),
});
const json = { records: { location: [
  { locationName: '臺北市', weatherElement: [] },
  { locationName: '新北市', weatherElement: [
    el('Wx', [
      { parameterName: '晴時多雲', parameterValue: '2' },
      { parameterName: '多雲時陰有雨', parameterValue: '12' },
      { parameterName: '陰有雨', parameterValue: '14' },
    ]),
    el('PoP', [{ parameterName: '20' }, { parameterName: '70' }, { parameterName: '100' }]),
    el('MinT', [{ parameterName: '19' }, { parameterName: '18' }, { parameterName: '-99' }]),
    el('MaxT', [{ parameterName: '24' }, { parameterName: '20' }, { parameterName: '21' }]),
    el('CI', [{ parameterName: '舒適' }, { parameterName: '稍有寒意' }, { parameterName: '寒冷' }]),
  ] },
] } };

test('parseCounty36h returns 3 labelled periods with numbers', () => {
  const now = new Date('2026-11-23T09:27:00+08:00');
  const r = parseCounty36h(json, '新北市', now);
  assert.deepEqual(r.map(p => p.label), ['今日白天', '今晚明晨', '明日白天']);
  assert.equal(r[0].pop, 20);
  assert.equal(r[0].weather, '晴時多雲');
  assert.equal(r[0].weatherCode, '2');
  assert.equal(r[0].minT, 19);
  assert.equal(r[0].maxT, 24);
  assert.equal(r[0].comfort, '舒適');
  assert.equal(r[0].start, '2026-11-23T06:00:00+08:00');
  assert.equal(r[0].end, '2026-11-23T18:00:00+08:00');
  assert.equal(r[2].minT, null);
});
test('parseCounty36h throws for missing county', () => {
  assert.throws(() => parseCounty36h(json, '火星市', new Date()), /火星市/);
  assert.throws(() => parseCounty36h({}, '新北市', new Date()));
});
