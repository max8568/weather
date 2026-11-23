import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseThreeDay } from '../src/parse/threeDay.js';
import { parseWeekly } from '../src/parse/weekly.js';

const dir = new URL('./fixtures/morning/', import.meta.url);
const read = f => JSON.parse(readFileSync(new URL(f, dir), 'utf8'));

test('real morning fixture parses', () => {
  const meta = read('meta.json');
  const now = new Date(meta.capturedAt);
  const t = parseThreeDay(read('threeDay.json'), meta.town, now);
  assert.ok(t.hourly.length >= 24);
  assert.equal(typeof t.lat, 'number');
  assert.equal(typeof t.next24h.max, 'number');
  assert.ok(t.current.weather);
  const w = parseWeekly(read('weekly.json'), meta.town, now);
  assert.ok(w.days.length === 6 || w.days.length === 7);
  assert.equal(w.uv.label, '紫外線');
});

test('real morning fixture: "<= 1" wind slots keep a beaufort value', () => {
  const meta = read('meta.json');
  const t = parseThreeDay(read('threeDay.json'), meta.town, new Date(meta.capturedAt));
  assert.equal(t.hourly.filter(h => h.beaufort === null).length, 0);
  assert.ok(t.hourly.some(h => h.beaufort === 1));
});
