import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseThreeDay, TownNotFound } from '../src/parse/threeDay.js';

const pt = (t, k, v, extra = {}) => ({ DataTime: `2026-11-23T${t}+08:00`, ElementValue: [{ [k]: v, ...extra }] });
const iv = (s, e, vals) => ({ StartTime: `2026-11-23T${s}+08:00`, EndTime: `2026-11-23T${e}+08:00`, ElementValue: [vals] });
const el = (ElementName, Time) => ({ ElementName, Time });
const wrap = loc => ({ records: { Locations: [{ Location: [{ LocationName: '五股區', Latitude: '25.1', Longitude: '121.4', ...loc }] }] } });

function small() {
  return wrap({ WeatherElement: [
    el('溫度', [pt('09:00', 'Temperature', '20'), pt('10:00', 'Temperature', '21'), pt('11:00', 'Temperature', '22')]),
    el('體感溫度', [pt('09:00', 'ApparentTemperature', '19'), pt('10:00', 'ApparentTemperature', '20'), pt('11:00', 'ApparentTemperature', '21')]),
    el('風速', [pt('09:00', 'BeaufortScale', '2')]),
    el('3小時降雨機率', [iv('09:00', '12:00', { ProbabilityOfPrecipitation: '30' })]),
    el('天氣現象', [iv('09:00', '10:00', { Weather: '晴', WeatherCode: '01' }), iv('10:00', '12:00', { Weather: '多雲', WeatherCode: '04' })]),
  ] });
}
const now = new Date('2026-11-23T09:27:00+08:00');

test('hourly starts at the slot containing now', () => {
  const r = parseThreeDay(small(), '五股區', now);
  assert.equal(r.hourly.length, 3);
  assert.equal(r.hourly[0].time, '2026-11-23T09:00:00+08:00');
  assert.equal(r.hourly[0].temperature, 20);
  assert.equal(r.lat, 25.1);
  assert.equal(r.lon, 121.4);
  assert.equal(r.current.apparentTemperature, 19);
  assert.equal(r.current.weather, '晴');
  assert.equal(r.current.pop, 30);
});

test('next24h covers only the next 24 hours', () => {
  const temps = Array.from({ length: 30 }, (_, i) => i === 24 ? 40 : 20 + (i % 5));
  const Time = temps.map((v, i) => ({ DataTime: new Date(Date.parse('2026-11-23T09:00:00+08:00') + i * 3600e3).toISOString(), ElementValue: [{ Temperature: String(v) }] }));
  const r = parseThreeDay(wrap({ WeatherElement: [el('溫度', Time)] }), '五股區', new Date('2026-11-23T09:00:00+08:00'));
  assert.equal(r.next24h.max, 24);
  assert.equal(r.next24h.min, 20);
});

test('pop and weather come from the interval containing the hour', () => {
  const r = parseThreeDay(small(), '五股區', now);
  assert.equal(r.hourly[1].weather, '多雲');
  assert.equal(r.hourly[1].weatherCode, '04');
  assert.equal(r.hourly[2].pop, 30);
  assert.equal(r.hourly[1].beaufort, 2);
});

test('parseThreeDay throws TownNotFound for unknown town', () => {
  assert.throws(() => parseThreeDay(small(), '不存在區', now), TownNotFound);
});

test('out-of-order temperature array still starts at the slot containing now', () => {
  const w = small();
  w.records.Locations[0].Location[0].WeatherElement[0].Time.reverse();
  const r = parseThreeDay(w, '五股區', now);
  assert.deepEqual(r.hourly.map(h => h.time.slice(11, 16)), ['09:00', '10:00', '11:00']);
  assert.equal(r.hourly[0].temperature, 20);
});
