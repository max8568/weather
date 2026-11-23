// 用法：node scripts/capture-fixtures.mjs <morning|evening>
// 從氣象署抓真實回應存成測試資料。授權碼從 worker/.dev.vars 讀，存檔前會換成 REDACTED。
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { redact } from './redact.mjs';

const label = process.argv[2];
const windows = { morning: [6, 17], evening: [18, 23] };
if (!windows[label]) throw new Error('用法：node scripts/capture-fixtures.mjs <morning|evening>');

const taipei = new Date(Date.now() + 8 * 3600e3);
const hour = taipei.getUTCHours();
const [from, to] = windows[label];
if (hour < from || hour > to) {
  throw new Error(`台北時間 ${hour} 點，不在 ${label} 時段（${from}:00–${to}:59）`);
}
const today = taipei.toISOString().slice(0, 10);

const env = readFileSync(new URL('../worker/.dev.vars', import.meta.url), 'utf8');
const key = env.match(/^CWA_API_KEY=(.+)$/m)?.[1].trim();
if (!key) throw new Error('worker/.dev.vars 裡沒有 CWA_API_KEY');

const BASE = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/';
async function get(id, params = {}) {
  const url = new URL(BASE + id);
  url.searchParams.set('Authorization', key);
  url.searchParams.set('format', 'JSON');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${id}: HTTP ${res.status}`);
  const json = await res.json();
  if (json.success === 'false' || json.success === false) throw new Error(`${id}: success=false`);
  return json;
}

// 先把 5 份都抓到並檢查過，才寫檔；任何一份失敗就不動上一次的存檔
const obs = await get('O-A0001-001');
const keep = new Set(['新北市', '臺北市', '桃園市']);
obs.records.Station = obs.records.Station.filter((s) => keep.has(s.GeoInfo?.CountyName));
const files = {
  'F-C0032-001.json': await get('F-C0032-001', { locationName: '新北市' }),
  'threeDay.json': await get('F-D0047-069', { LocationName: '五股區' }),
  'weekly.json': await get('F-D0047-071', { LocationName: '五股區' }),
  'O-A0001-001.json': obs,
  'A-B0062-001.json': await get('A-B0062-001', { CountyName: '新北市', Date: today }),
  'meta.json': { capturedAt: taipei.toISOString().replace('Z', '+08:00'), county: '新北市', town: '五股區' },
};
if (!obs.records.Station.length) throw new Error('O-A0001-001: 沒有符合的測站');
if (!files['threeDay.json'].records?.Locations?.[0]?.Location?.length) throw new Error('threeDay: 沒有鄉鎮資料');
if (!files['weekly.json'].records?.Locations?.[0]?.Location?.length) throw new Error('weekly: 沒有鄉鎮資料');
if (!files['A-B0062-001.json'].records?.locations?.location?.length) throw new Error('A-B0062-001: 沒有資料');
if (!files['F-C0032-001.json'].records?.location?.length) throw new Error('F-C0032-001: 沒有資料');

const dir = new URL(`../worker/test/fixtures/${label}/`, import.meta.url);
mkdirSync(dir, { recursive: true });
for (const [name, json] of Object.entries(files)) {
  writeFileSync(new URL(name, dir), JSON.stringify(redact(json, key), null, 1));
}
console.log('saved to', label, '; obs stations kept:', obs.records.Station.length);
