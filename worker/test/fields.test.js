import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { THREE_DAY, WEEKLY, OBS, SUN, TOWN_COORDS } from '../src/fields.js';

const load = (name) => JSON.parse(readFileSync(new URL(`./fixtures/morning/${name}`, import.meta.url), 'utf8'));
const threeDay = load('threeDay.json');
const weekly = load('weekly.json');
const obs = load('O-A0001-001.json');
const sun = load('A-B0062-001.json');

const town = (json) => json.records.Locations[0].Location[0];
const get = (obj, path) => path.split('.').reduce((o, k) => o?.[k], obj);

function checkElements(json, fields) {
  const { WeatherElement } = town(json);
  for (const [name, [elementName, key]] of Object.entries(fields)) {
    const el = WeatherElement.find((e) => e.ElementName === elementName);
    assert.ok(el, `${name}: 找不到 ElementName ${elementName}`);
    assert.ok(key in el.Time[0].ElementValue[0], `${name}: ${elementName} 第一筆沒有 ${key}`);
  }
}

test('every THREE_DAY field exists in the morning fixture', () => checkElements(threeDay, THREE_DAY));
test('every WEEKLY field exists in the morning fixture', () => checkElements(weekly, WEEKLY));

test('every OBS path resolves on at least one station', () => {
  for (const [name, path] of Object.entries(OBS)) {
    assert.ok(obs.records.Station.some((s) => get(s, path) !== undefined), `${name}: ${path}`);
  }
});

test('SUN fields exist for 新北市', () => {
  const loc = sun.records.locations.location.find((l) => l[SUN.county] === '新北市');
  assert.ok(loc, '找不到新北市');
  for (const key of [SUN.date, SUN.sunrise, SUN.sunset]) {
    assert.ok(key in loc.time[0], key);
  }
});

test('TOWN_COORDS names the township latitude/longitude fields', () => {
  assert.deepEqual(TOWN_COORDS, { lat: 'Latitude', lon: 'Longitude' });
  const loc = town(threeDay);
  assert.ok(Number.isFinite(Number(loc[TOWN_COORDS.lat])));
  assert.ok(Number.isFinite(Number(loc[TOWN_COORDS.lon])));
});
