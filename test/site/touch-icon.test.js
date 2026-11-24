import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// 加到 iPhone 主畫面時用的圖示
test('index.html links the home-screen icon', () => {
  const html = readFileSync('site/index.html', 'utf8');
  assert.match(html, /<link rel="apple-touch-icon" href="apple-touch-icon.png">/);
});

test('the home-screen icon is a 180x180 PNG with no transparency (iOS fills transparent areas with black)', () => {
  const png = readFileSync('site/apple-touch-icon.png');
  assert.equal(png.subarray(1, 4).toString('ascii'), 'PNG');
  assert.equal(png.readUInt32BE(16), 180); // width, from the IHDR chunk
  assert.equal(png.readUInt32BE(20), 180); // height
  assert.equal(png[25], 2);                // colour type 2 = RGB, no alpha channel
});
