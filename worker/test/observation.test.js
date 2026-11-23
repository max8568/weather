import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pickObservations, degreesToText } from '../src/parse/observation.js';
import { parseThreeDay } from '../src/parse/threeDay.js';

const st = (name, lat, lon, county, town, el = {}, time = '2026-11-23T11:00:00+08:00') => ({
  StationName: name, ObsTime: { DateTime: time },
  GeoInfo: {
    Coordinates: [
      { CoordinateName: 'TWD67', StationLatitude: '0', StationLongitude: '0' },
      { CoordinateName: 'WGS84', StationLatitude: String(lat), StationLongitude: String(lon) },
    ],
    CountyName: county, TownName: town,
  },
  WeatherElement: {
    AirTemperature: '-99', RelativeHumidity: '-99', WindDirection: '-99', WindSpeed: '-99', AirPressure: '-99',
    Now: { Precipitation: '-99' }, ...el,
  },
});
const wrap = Station => ({ records: { Station } });

test('picks nearest station per element, skipping -99', () => {
  const json = wrap([
    st('B', 25.2, 121.4, '新北市', '泰山區', { AirTemperature: '22.4', RelativeHumidity: '65' }),
    st('A', 25.1, 121.4, '新北市', '五股區', { RelativeHumidity: '71' }),
    st('C', 26, 121.4, '新北市', '三芝區', { AirTemperature: '10', RelativeHumidity: '50' }),
  ]);
  const r = pickObservations(json, { lat: 25.1, lon: 121.4 });
  assert.deepEqual(r.temperature, { value: 22.4, station: 'B', time: '2026-11-23T11:00:00+08:00' });
  assert.equal(r.humidity.value, 71);
  assert.equal(r.humidity.station, 'A');
  assert.equal(r.time, '2026-11-23T11:00:00+08:00');
});

test('all stations missing an element gives null', () => {
  const json = wrap([st('A', 25.1, 121.4, '新北市', '五股區', { AirTemperature: '20' })]);
  const r = pickObservations(json, { lat: 25.1, lon: 121.4 });
  assert.equal(r.pressure, null);
  assert.equal(r.rainToday, null);
  assert.equal(r.windDirection, null);
});

test('windDirection value is text, rainToday and windSpeed read', () => {
  const json = wrap([st('A', 25.1, 121.4, '新北市', '五股區', { WindDirection: '45', WindSpeed: '3.2', Now: { Precipitation: '0.0' } })]);
  const r = pickObservations(json, { lat: 25.1, lon: 121.4 });
  assert.equal(r.windDirection.value, '東北風');
  assert.equal(r.windSpeed.value, 3.2);
  assert.equal(r.rainToday.value, 0);
  assert.equal(r.temperature, null);
  assert.equal(r.time, '2026-11-23T11:00:00+08:00'); // first element with a value
});

test('time follows temperature when present', () => {
  const json = wrap([
    st('A', 25.1, 121.4, '新北市', '五股區', { RelativeHumidity: '70' }, '2026-11-23T11:00:00+08:00'),
    st('B', 25.2, 121.4, '新北市', '泰山區', { AirTemperature: '20' }, '2026-11-23T10:50:00+08:00'),
  ]);
  assert.equal(pickObservations(json, { lat: 25.1, lon: 121.4 }).time, '2026-11-23T10:50:00+08:00');
});

test('falls back to same town then same county without lat/lon', () => {
  const json = wrap([
    st('Other', 25.1, 121.4, '臺北市', '中正區', { AirTemperature: '30' }),
    st('County', 25.1, 121.4, '新北市', '泰山區', { AirTemperature: '21', RelativeHumidity: '60' }),
    st('Town', 25.1, 121.4, '新北市', '五股區', { AirTemperature: '20' }),
  ]);
  const r = pickObservations(json, { county: '新北市', town: '五股區' });
  assert.equal(r.temperature.station, 'Town');
  assert.equal(r.humidity.station, 'County');
});

test('no coordinates on a station sorts last; no candidates gives all null', () => {
  const noCoord = st('N', 25.1, 121.4, '新北市', '五股區', { AirTemperature: '99' });
  noCoord.GeoInfo.Coordinates = [];
  const json = wrap([noCoord, st('F', 30, 121.4, '新北市', '三芝區', { AirTemperature: '15' })]);
  assert.equal(pickObservations(json, { lat: 25.1, lon: 121.4 }).temperature.station, 'F');
  const r = pickObservations(wrap([]), { county: '新北市', town: '五股區' });
  assert.equal(r.time, null);
  assert.equal(r.temperature, null);
});

test('degreesToText', () => {
  assert.equal(degreesToText(45), '東北風');
  assert.equal(degreesToText(350), '北風');
  assert.equal(degreesToText(180), '南風');
});

test('real morning fixture: 五股區 gets a temperature', () => {
  const rd = f => JSON.parse(readFileSync(new URL(`./fixtures/morning/${f}`, import.meta.url), 'utf8'));
  const { lat, lon } = parseThreeDay(rd('threeDay.json'), '五股區', new Date('2026-11-23T11:00:00+08:00'));
  const r = pickObservations(rd('O-A0001-001.json'), { lat, lon, county: '新北市', town: '五股區' });
  assert.equal(typeof r.temperature.value, 'number');
  assert.ok(r.temperature.station);
  assert.match(r.time, /\+08:00$/);
});

test('out-of-range wind direction counts as missing, next station is tried', () => {
  const json = wrap([
    st('A', 25.1, 121.4, '新北市', '五股區', { WindDirection: '-45' }),
    st('B', 25.2, 121.4, '新北市', '泰山區', { WindDirection: '90' }),
  ]);
  const r = pickObservations(json, { lat: 25.1, lon: 121.4 });
  assert.equal(r.windDirection.value, '東風');
  assert.equal(r.windDirection.station, 'B');
  assert.equal(pickObservations(wrap([st('A', 25.1, 121.4, '新北市', '五股區', { WindDirection: '400' })]), { lat: 25.1, lon: 121.4 }).windDirection, null);
});

test('malformed station timestamp gives null time, not NaN', () => {
  const json = wrap([st('A', 25.1, 121.4, '新北市', '五股區', { AirTemperature: '20' }, 'garbage')]);
  const r = pickObservations(json, { lat: 25.1, lon: 121.4 });
  assert.equal(r.temperature.value, 20);
  assert.equal(r.temperature.time, null);
  assert.equal(r.time, null);
});
