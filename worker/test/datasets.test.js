import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DATASETS } from '../src/datasets.js';

test('DATASETS covers 22 counties with paired ids', () => {
  assert.equal(Object.keys(DATASETS).length, 22);
  assert.deepEqual(DATASETS['宜蘭縣'], { threeDay: 'F-D0047-001', weekly: 'F-D0047-003' });
  assert.deepEqual(DATASETS['臺北市'], { threeDay: 'F-D0047-061', weekly: 'F-D0047-063' });
  assert.deepEqual(DATASETS['新北市'], { threeDay: 'F-D0047-069', weekly: 'F-D0047-071' });
  assert.ok(!('臺灣' in DATASETS));
});
