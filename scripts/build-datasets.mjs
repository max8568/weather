// 下載氣象署 API 文件，整理出「縣市 -> 3 天 / 1 週預報資料集代碼」，寫入 worker/src/datasets.js
import { writeFileSync } from 'node:fs';
import { parseDatasets } from './parse-datasets.mjs';

const res = await fetch('https://opendata.cwa.gov.tw/apidoc/v1');
if (!res.ok) throw new Error(`下載失敗：HTTP ${res.status}`);
const datasets = parseDatasets(await res.text()); // 不完整會在這裡丟錯誤，不會寫檔

const out = `// 由 scripts/build-datasets.mjs 產生，不要手改
export const DATASETS = ${JSON.stringify(datasets, null, 2)};
`;
writeFileSync(new URL('../worker/src/datasets.js', import.meta.url), out);
console.log('counties:', Object.keys(datasets).length);
