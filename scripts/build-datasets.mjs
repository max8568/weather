// 下載氣象署 API 文件，整理出「縣市 -> 3 天 / 1 週預報資料集代碼」，寫入 worker/src/datasets.js
import { writeFileSync } from 'node:fs';

const res = await fetch('https://opendata.cwa.gov.tw/apidoc/v1');
if (!res.ok) throw new Error(`下載失敗：HTTP ${res.status}`);
const lines = (await res.text()).split(/\r?\n/);

const datasets = {};
for (let i = 0; i < lines.length; i++) {
  const m = lines[i].match(/\/v1\/rest\/datastore\/(F-D0047-\d{3}):/);
  if (!m) continue;
  for (let j = i + 1; j < Math.min(i + 12, lines.length); j++) {
    const s = lines[j].match(/summary:\s*鄉鎮天氣預報-(.+?)未來(3天|1週)天氣預報/);
    if (!s) continue;
    const [, county, span] = s;
    if (county === '臺灣') break;
    (datasets[county] ??= {})[span === '3天' ? 'threeDay' : 'weekly'] = m[1];
    break;
  }
}

const out = `// 由 scripts/build-datasets.mjs 產生，不要手改
export const DATASETS = ${JSON.stringify(datasets, null, 2)};
`;
writeFileSync(new URL('../worker/src/datasets.js', import.meta.url), out);
console.log('counties:', Object.keys(datasets).length);
