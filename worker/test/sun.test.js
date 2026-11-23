import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseSun } from '../src/parse/sun.js';

const json = {
  records: { locations: { location: [
    { CountyName: '臺北市', time: [{ Date: '2026-11-23', SunRiseTime: '06:15', SunSetTime: '17:03' }] },
    { CountyName: '新北市', time: [{ Date: '2026-11-23', SunRiseTime: '06:16', SunSetTime: '17:04' }] },
  ] } },
};

test('parseSun returns HH:MM for the county', () => {
  assert.deepEqual(parseSun(json, '新北市'), { date: '2026-11-23', sunrise: '06:16', sunset: '17:04' });
});

test('parseSun throws when county is missing', () => {
  assert.throws(() => parseSun(json, '火星市'));
});

test('real fixture', () => {
  const real = JSON.parse(readFileSync(new URL('./fixtures/morning/A-B0062-001.json', import.meta.url), 'utf8'));
  assert.deepEqual(parseSun(real, '新北市'), { date: '2026-11-23', sunrise: '06:16', sunset: '17:04' });
});

test('parseSun throws when Date is missing', () => {
  const bad = { records: { locations: { location: [{ CountyName: '新北市', time: [{ SunRiseTime: '06:16', SunSetTime: '17:04' }] }] } } };
  assert.throws(() => parseSun(bad, '新北市'));
});

test('parseSun normalises HH:MM:SS to HH:MM and rejects junk times', () => {
  const mk = (a, b) => ({ records: { locations: { location: [{ CountyName: '新北市', time: [{ Date: '2026-11-23', SunRiseTime: a, SunSetTime: b }] }] } } });
  assert.deepEqual(parseSun(mk('06:16:00', '17:04:30'), '新北市'), { date: '2026-11-23', sunrise: '06:16', sunset: '17:04' });
  assert.throws(() => parseSun(mk('abc', '17:04'), '新北市'));
});
