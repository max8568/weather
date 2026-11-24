import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// 首頁樣式裡跟組合版設計稿、可讀性有關的幾條規則
const css = readFileSync('site/css/style.css', 'utf8').replace(/\r\n/g, '\n');
const rule = (sel) => (css.match(new RegExp(`(^|\\n)${sel.replace(/[.]/g, '[.]')} [{]([^}]*)[}]`)) || [])[2] || '';

test('7-day day names are bold, like the combo design', () => {
  assert.match(rule('.week-label'), /font-weight: 700;/);
});

test('station names under the observations reach 4.5:1 contrast on the grey card', () => {
  // #6e6e73 在 #f6f7f9 上約 4.7:1；--muted（#8a8a8e）只有約 3.2:1
  assert.match(rule('.obs-station'), /color: #6e6e73;/);
});
