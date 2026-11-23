import { test } from 'node:test';
import assert from 'node:assert/strict';
import { redact } from '../../scripts/redact.mjs';
import { parseDatasets } from '../../scripts/parse-datasets.mjs';

test('redact removes the key from member names, values and embedded URLs', () => {
  const key = 'SECRETKEY123';
  const out = redact({ [`a${key}`]: [key, `https://x/?Authorization=${key}&f=1`, { n: 1 }] }, key);
  assert.equal(JSON.stringify(out).includes(key), false);
  assert.deepEqual(out, { aREDACTED: ['REDACTED', 'https://x/?Authorization=REDACTED&f=1', { n: 1 }] });
});

const doc = (rows) => rows.map(([id, sum]) => `  /v1/rest/datastore/${id}:\n    get:\n${sum ? `      summary: ${sum}\n` : ''}`).join('');
const counties = Array.from({ length: 22 }, (_, i) => `縣${i}`);
const full = counties.flatMap((c, i) => [
  [`F-D0047-${String(i * 2 + 1).padStart(3, '0')}`, `鄉鎮天氣預報-${c}未來3天天氣預報`],
  [`F-D0047-${String(i * 2 + 2).padStart(3, '0')}`, `鄉鎮天氣預報-${c}未來1週天氣預報`],
]);

test('parseDatasets pairs ids for 22 counties', () => {
  const d = parseDatasets(doc(full));
  assert.equal(Object.keys(d).length, 22);
  assert.deepEqual(d['縣0'], { threeDay: 'F-D0047-001', weekly: 'F-D0047-002' });
});

test('parseDatasets throws when an endpoint has no summary instead of borrowing the next one', () => {
  const rows = full.map((r) => [...r]);
  rows[0][1] = null; // 縣0 的 3 天 endpoint 沒有 summary
  assert.throws(() => parseDatasets(doc(rows)), /不完整/);
});
