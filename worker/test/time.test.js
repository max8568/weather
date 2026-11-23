import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCwaTime, toTaipei, isoTaipei, addDays, periodLabel, dayLabel } from '../src/time.js';

const at = s => new Date(s);
test('periodLabel morning', () => {
  const now = at('2026-11-23T09:27:00+08:00');
  assert.equal(periodLabel(at('2026-11-23T06:00:00+08:00'), now), '今日白天');
  assert.equal(periodLabel(at('2026-11-23T18:00:00+08:00'), now), '今晚明晨');
  assert.equal(periodLabel(at('2026-11-24T06:00:00+08:00'), now), '明日白天');
});
test('periodLabel evening', () => {
  const now = at('2026-11-23T19:10:00+08:00');
  assert.equal(periodLabel(at('2026-11-23T18:00:00+08:00'), now), '今晚明晨');
  assert.equal(periodLabel(at('2026-11-24T06:00:00+08:00'), now), '明日白天');
  assert.equal(periodLabel(at('2026-11-24T18:00:00+08:00'), now), '明日晚上');
});
test('periodLabel labels 00-06 period as 今日凌晨', () => {
  const now = at('2026-11-24T02:00:00+08:00');
  assert.equal(periodLabel(at('2026-11-24T00:00:00+08:00'), now), '今日凌晨');
});
test('periodLabel uses Taipei date when UTC is still yesterday', () => {
  const now = at('2026-11-23T01:30:00+08:00');
  assert.equal(periodLabel(at('2026-11-23T06:00:00+08:00'), now), '今日白天');
});
test('periodLabel uses M/D for other dates', () => {
  const now = at('2026-11-23T09:27:00+08:00');
  assert.equal(periodLabel(at('2026-11-25T06:00:00+08:00'), now), '11/25 白天');
  assert.equal(periodLabel(at('2026-11-24T00:00:00+08:00'), now), '明日凌晨');
  assert.equal(periodLabel(at('2026-11-26T18:00:00+08:00'), now), '11/26 晚上');
});
test('parseCwaTime treats offset-less strings as Taipei', () => {
  assert.equal(parseCwaTime('2026-11-23 06:00:00').toISOString(), '2026-11-22T22:00:00.000Z');
});
test('parseCwaTime accepts explicit offset', () => {
  assert.equal(parseCwaTime('2026-11-23T06:00:00+08:00').toISOString(), '2026-11-22T22:00:00.000Z');
});
test('toTaipei and isoTaipei', () => {
  const d = at('2026-11-22T17:30:00Z');
  assert.deepEqual(toTaipei(d), { dateKey: '2026-11-23', y: 2026, m: 11, d: 23, hour: 1, minute: 30, weekday: 1 });
  assert.equal(isoTaipei(d), '2026-11-23T01:30:00+08:00');
});
test('addDays crosses month and year', () => {
  assert.equal(addDays('2026-11-30', 1), '2026-12-01');
  assert.equal(addDays('2026-01-01', -1), '2025-12-31');
});
test('dayLabel', () => {
  assert.equal(dayLabel('2026-11-23', '2026-11-23'), '今天');
  assert.equal(dayLabel('2026-11-24', '2026-11-23'), '週二');
  assert.equal(dayLabel('2026-11-29', '2026-11-23'), '週日');
});
