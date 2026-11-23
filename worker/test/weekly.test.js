import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseWeekly, uvLevelText } from '../src/parse/weekly.js';

const iv = (s, e, vals) => ({ StartTime: `2026-11-${s}:00+08:00`, EndTime: `2026-11-${e}:00+08:00`, ElementValue: [vals] });
const el = (ElementName, Time) => ({ ElementName, Time });
function build(halves, uvs) {
  return { records: { Locations: [{ Location: [{ LocationName: '五股區', WeatherElement: [
    el('天氣現象', halves.map(([s, e]) => iv(s, e, { Weather: '晴', WeatherCode: '01' }))),
    el('最高溫度', halves.map(([s, e], i) => iv(s, e, { MaxTemperature: String(25 + i) }))),
    el('紫外線指數', uvs.map(([s, e, v]) => iv(s, e, { UVIndex: String(v), UVExposureLevel: '中量級' }))),
  ] }] }] } };
}
const H = [['23T06:00', '23T18:00'], ['23T18:00', '24T06:00'], ['24T06:00', '24T18:00'], ['24T18:00', '25T06:00']];

test('weekly groups halves by Taipei date, morning', () => {
  const r = parseWeekly(build(H, [['23T06:00', '23T18:00', 5]]), '五股區', new Date('2026-11-23T09:27:00+08:00'));
  assert.equal(r.days.length, 2);
  assert.equal(r.days[0].date, '2026-11-23');
  assert.equal(r.days[0].label, '今天');
  assert.equal(r.days[0].day.maxT, 25);
  assert.equal(r.days[0].night.maxT, 26);
  assert.equal(r.days[0].day.start, '2026-11-23T06:00:00+08:00');
  assert.equal(r.days[1].label, '週二');
  assert.equal(r.days[0].day.uv, 5);
  assert.equal(r.days[0].night.uv, null);
});

test('weekly today row has only night in the evening', () => {
  const r = parseWeekly(build(H.slice(1), [['24T06:00', '24T18:00', 3]]), '五股區', new Date('2026-11-23T19:10:00+08:00'));
  assert.equal(r.days[0].day, null);
  assert.notEqual(r.days[0].night, null);
  assert.equal(r.days[0].label, '今天');
});

test('uv label is 紫外線 in the morning, 明天紫外線 in the evening', () => {
  const m = parseWeekly(build(H, [['23T06:00', '23T18:00', 5]]), '五股區', new Date('2026-11-23T09:27:00+08:00'));
  assert.deepEqual(m.uv, { value: 5, level: '中量級', label: '紫外線' });
  const e = parseWeekly(build(H.slice(1), [['24T06:00', '24T18:00', 3]]), '五股區', new Date('2026-11-23T19:10:00+08:00'));
  assert.equal(e.uv.label, '明天紫外線');
  assert.equal(e.uv.value, 3);
});

test('uvLevelText boundaries', () => {
  assert.equal(uvLevelText(2), '低量級');
  assert.equal(uvLevelText(3), '中量級');
  assert.equal(uvLevelText(5), '中量級');
  assert.equal(uvLevelText(7), '高量級');
  assert.equal(uvLevelText(10), '過量級');
  assert.equal(uvLevelText(11), '危險級');
});
