import { test } from 'node:test';
import assert from 'node:assert/strict';
import { redact } from '../../scripts/redact.mjs';
import { parseDatasets, collectDatasets } from '../../scripts/parse-datasets.mjs';

test('redact removes the key from member names, values and embedded URLs', () => {
  const key = 'SECRETKEY123';
  const out = redact({ [`a${key}`]: [key, `https://x/?Authorization=${key}&f=1`, { n: 1 }] }, key);
  assert.equal(JSON.stringify(out).includes(key), false);
  assert.deepEqual(out, { aREDACTED: ['REDACTED', 'https://x/?Authorization=REDACTED&f=1', { n: 1 }] });
});

const endpoint = (id, summary, { quote = false, comment = false } = {}) =>
  `  ${quote ? `"/v1/rest/datastore/${id}" ` : `/v1/rest/datastore/${id}`}:\n    get:\n${comment ? '# 註解\n' : ''}${summary ? `      summary: ${summary}\n` : ''}`;
const yamlDoc = (...eps) => `paths:\n${eps.join('')}`;
const sum = (c, span) => `鄉鎮天氣預報-${c}未來${span}天氣預報`;

test('a missing summary leaves that ID absent and does not borrow the neighbour (quoted, comment between get: and summary:)', () => {
  const text = yamlDoc(
    endpoint('F-D0047-001', null),
    endpoint('F-D0047-003', sum('宜蘭縣', '1週'), { quote: true, comment: true }),
  );
  assert.deepEqual(collectDatasets(text), { 宜蘭縣: { weekly: 'F-D0047-003' } });
});

test('collectDatasets pairs ids and skips 臺灣', () => {
  const text = yamlDoc(
    endpoint('F-D0047-001', sum('宜蘭縣', '3天')),
    endpoint('F-D0047-003', sum('宜蘭縣', '1週')),
    endpoint('F-D0047-089', sum('臺灣', '3天')),
  );
  assert.deepEqual(collectDatasets(text), { 宜蘭縣: { threeDay: 'F-D0047-001', weekly: 'F-D0047-003' } });
});

test('a path with a prefix before /v1/rest/datastore/ does not replace the canonical ID', () => {
  const text = yamlDoc(
    endpoint('F-D0047-001', sum('宜蘭縣', '3天')),
    `  /archive/v1/rest/datastore/F-D0047-045:\n    get:\n      summary: ${sum('宜蘭縣', '3天')}（舊版）\n`,
  );
  assert.deepEqual(collectDatasets(text), { 宜蘭縣: { threeDay: 'F-D0047-001' } });
});

test('parseDatasets throws on an incomplete set', () => {
  const text = yamlDoc(endpoint('F-D0047-001', sum('宜蘭縣', '3天')));
  assert.throws(() => parseDatasets(text), /不完整/);
});

test('parseDatasets accepts 22 complete counties', () => {
  const eps = Array.from({ length: 22 }, (_, i) => [
    endpoint(`F-D0047-${String(i * 2 + 1).padStart(3, '0')}`, sum(`縣${i}`, '3天')),
    endpoint(`F-D0047-${String(i * 2 + 2).padStart(3, '0')}`, sum(`縣${i}`, '1週')),
  ]).flat();
  assert.equal(Object.keys(parseDatasets(yamlDoc(...eps))).length, 22);
});
