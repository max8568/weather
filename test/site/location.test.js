import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolveLocation, DEFAULT_LOCATION, isTownList, isForecastBody, nearestTown, isTownCoordList, locateTown } from '../../site/js/logic/location.js';

const towns = [{ county: '臺北市', towns: ['中正區', '大安區'] }, { county: '新北市', towns: ['五股區'] }];
test('resolveLocation keeps a valid saved location', () => assert.deepEqual(resolveLocation({county:'新北市',town:'五股區'}, towns), {county:'新北市',town:'五股區'}));
test('resolveLocation falls back to default for unknown names', () => {
  assert.deepEqual(resolveLocation({county:'台北市',town:'中正區'}, towns), DEFAULT_LOCATION);
  assert.deepEqual(resolveLocation({county:'臺北市',town:'五股區'}, towns), DEFAULT_LOCATION);
  assert.deepEqual(resolveLocation(null, towns), DEFAULT_LOCATION);
  assert.deepEqual(resolveLocation('garbage', towns), DEFAULT_LOCATION);
});

test('isTownList accepts only a non-empty list of {county, towns[]}', () => {
  assert.equal(isTownList(towns), true);
  for (const bad of [null, {}, 'x', [], [null], [{ county: '臺北市' }], [{ county: '臺北市', towns: [] }], [{ county: '臺北市', towns: [1] }], [{ county: 5, towns: ['a'] }]])
    assert.equal(isTownList(bad), false);
});

test('isForecastBody requires string county/town and object sources', () => {
  assert.equal(isForecastBody({ county: '臺北市', town: '中正區', sources: {} }), true);
  for (const bad of [null, {}, [], 'x', { county: '臺北市', town: '中正區' }, { county: 1, town: 'a', sources: {} }, { county: 'a', town: 'b', sources: null }])
    assert.equal(isForecastBody(bad), false);
});

// 鄉鎮經緯度來自氣象署鄉鎮預報（大約是鄉鎮公所的位置），由 scripts/build-towns.mjs 產生。
const coords = [
  { county: '臺北市', town: '中正區', lat: 25.0324, lon: 121.5199 },
  { county: '新北市', town: '五股區', lat: 25.0830, lon: 121.4381 },
];
test('nearestTown picks the town whose point is closest to the position', () => {
  assert.deepEqual(nearestTown(coords, { lat: 25.07, lon: 121.45 }), { county: '新北市', town: '五股區' });
  assert.deepEqual(nearestTown(coords, { lat: 25.03, lon: 121.51 }), { county: '臺北市', town: '中正區' });
});
test('nearestTown returns null when every town is more than 50 km away (outside Taiwan)', () => {
  assert.equal(nearestTown(coords, { lat: 35.68, lon: 139.69 }), null); // 東京
  assert.equal(nearestTown(coords, { lat: 25.0324, lon: 122.05 }), null); // 中正區往東約 53 km
  assert.deepEqual(nearestTown(coords, { lat: 25.0324, lon: 121.95 }), { county: '臺北市', town: '中正區' }); // 約 43 km
});

test('isTownCoordList accepts only a non-empty list of {county, town, lat, lon}', () => {
  assert.equal(isTownCoordList(coords), true);
  for (const bad of [null, {}, [], [null], [{ county: '臺北市', town: '中正區', lat: 25 }], [{ county: '臺北市', town: '中正區', lat: '25', lon: 121 }], [{ county: 1, town: 'a', lat: 25, lon: 121 }]])
    assert.equal(isTownCoordList(bad), false);
});

test('site/data/town-coords.json has a point for every town in towns.json', () => {
  const list = JSON.parse(readFileSync('site/data/towns.json', 'utf8'));
  const points = JSON.parse(readFileSync('site/data/town-coords.json', 'utf8'));
  assert.equal(isTownCoordList(points), true);
  const have = new Set(points.map((p) => `${p.county}/${p.town}`));
  for (const c of list) for (const t of c.towns) assert.ok(have.has(`${c.county}/${t}`), `${c.county}${t}`);
});

// locateTown 的兩個參數：向瀏覽器要位置、載入鄉鎮經緯度清單。失敗時丟出的 Error 訊息會直接顯示給使用者。
const at = (lat, lon) => async () => ({ coords: { latitude: lat, longitude: lon } });
const failWith = (code) => async () => { throw { code }; }; // 瀏覽器的 GeolocationPositionError：1 不允許、2 取不到、3 逾時
const coordsFile = async () => coords;
test('locateTown returns the nearest town for the browser position', async () => {
  assert.deepEqual(await locateTown(at(25.07, 121.45), coordsFile), { county: '新北市', town: '五股區' });
});
test('locateTown says where to allow location when the user said no', async () => {
  await assert.rejects(locateTown(failWith(1), coordsFile), /允許這個網站使用位置/);
});
test('locateTown asks to try again when the position is unavailable or times out', async () => {
  for (const code of [2, 3]) await assert.rejects(locateTown(failWith(code), coordsFile), /暫時無法取得目前位置/);
});
test('locateTown reports a missing or broken coordinate file', async () => {
  await assert.rejects(locateTown(at(25.07, 121.45), async () => { throw new TypeError('Failed to fetch'); }), /無法載入鄉鎮位置資料/);
  await assert.rejects(locateTown(at(25.07, 121.45), async () => ({})), /無法載入鄉鎮位置資料/);
});
test('locateTown says the position is outside Taiwan', async () => {
  await assert.rejects(locateTown(at(35.68, 139.69), coordsFile), /不在台灣/);
});
