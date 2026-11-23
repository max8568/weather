import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

const DIR = 'site/icons/weather/fill/';
const CLOUDY = ['cloudy', 'fog', 'overcast', 'partly-cloudy-day', 'partly-cloudy-night', 'rain', 'snow', 'thunderstorms-rain'];
const CLOUDLESS = ['clear-day', 'clear-night', 'sunrise', 'sunset'];

test('cloud outlines are dark enough for grey cards', () => {
  for (const f of CLOUDY) {
    const s = readFileSync(DIR + f + '.svg', 'utf8');
    assert.ok(!s.includes('#e6effc') && !s.includes('#deeafb'), f);
    assert.ok(s.includes('stroke="#a3b1c6"') && s.includes('stop-color="#cfdbec"'), f);
  }
});

test('cloudless icons are untouched', () => {
  for (const f of CLOUDLESS) {
    const s = readFileSync(DIR + f + '.svg', 'utf8');
    assert.ok(!s.includes('#a3b1c6') && !s.includes('#cfdbec'), f);
  }
  const LINE = 'site/icons/weather/line/';
  for (const f of readdirSync(LINE)) {
    assert.ok(!readFileSync(LINE + f, 'utf8').includes('#a3b1c6'), f);
  }
});
