// 用法：node scripts/build-towns.mjs
// 對每個縣市抓 3 天預報（只要溫度），整理出鄉鎮清單，寫到 site/data/towns.json。授權碼從 worker/.dev.vars 讀。
import { readFileSync, writeFileSync } from 'node:fs';
import { DATASETS } from '../worker/src/datasets.js';

const ORDER = ['基隆市', '臺北市', '新北市', '桃園市', '新竹市', '新竹縣', '苗栗縣', '臺中市', '彰化縣', '南投縣', '雲林縣',
  '嘉義市', '嘉義縣', '臺南市', '高雄市', '屏東縣', '宜蘭縣', '花蓮縣', '臺東縣', '澎湖縣', '金門縣', '連江縣'];

const env = readFileSync(new URL('../worker/.dev.vars', import.meta.url), 'utf8');
const key = env.match(/^CWA_API_KEY=(.+)$/m)?.[1].trim();
if (!key) throw new Error('worker/.dev.vars 裡沒有 CWA_API_KEY');

const BASE = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/';
const result = [];
for (const county of ORDER) {
  const ds = DATASETS[county];
  if (!ds) throw new Error(`DATASETS 沒有 ${county}`);
  const url = new URL(BASE + ds.threeDay);
  url.searchParams.set('Authorization', key);
  url.searchParams.set('format', 'JSON');
  url.searchParams.set('ElementName', '溫度');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${county}: HTTP ${res.status}`);
  const body = await res.json();
  const locs = body?.records?.Locations?.[0]?.Location;
  if (!Array.isArray(locs) || !locs.length) throw new Error(`${county}: 沒有鄉鎮資料`);
  const towns = locs.slice().sort((a, b) => String(a.Geocode).localeCompare(String(b.Geocode))).map((l) => l.LocationName);
  result.push({ county, towns });
  console.log(county, towns.length);
}
writeFileSync(new URL('../site/data/towns.json', import.meta.url), JSON.stringify(result, null, 1) + '\n');
