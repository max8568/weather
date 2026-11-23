import { readFileSync } from 'node:fs';
import { DATASETS } from '../../src/datasets.js';

const dir = label => new URL(`../fixtures/${label}/`, import.meta.url);

export function fixtureCwa(label, { fail = [] } = {}) {
  const files = {
    'F-C0032-001': 'F-C0032-001.json',
    [DATASETS['新北市'].threeDay]: 'threeDay.json',
    [DATASETS['新北市'].weekly]: 'weekly.json',
    'O-A0001-001': 'O-A0001-001.json',
    'A-B0062-001': 'A-B0062-001.json',
  };
  return {
    async get(datasetId) {
      if (fail.includes(datasetId) || !files[datasetId]) throw new Error(`${datasetId} stub failure`);
      return JSON.parse(readFileSync(new URL(files[datasetId], dir(label)), 'utf8'));
    },
  };
}
