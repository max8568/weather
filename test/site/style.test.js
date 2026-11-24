import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// 首頁樣式裡跟組合版設計稿、可讀性有關的幾條規則
const css = readFileSync('site/css/style.css', 'utf8').replace(/\r\n/g, '\n');
const rule = (sel) => (css.match(new RegExp(`(^|\\n)${sel.replace(/[.]/g, '[.]')} [{]([^}]*)[}]`)) || [])[2] || '';

test('7-day day names are bold, like the combo design', () => {
  assert.match(rule('.week-label'), /font-weight: 700;/);
});

test('observation times under the values reach 4.5:1 contrast on the grey card', () => {
  // #6e6e73 在 #f6f7f9 上約 4.7:1；--muted（#8a8a8e）只有約 3.2:1
  assert.match(rule('.obs-time'), /color: #6e6e73;/);
});

test('the 24-hour range and the weather description share a row and line up on one baseline', () => {
  // 左欄和右欄的高度各自不同（圖示大小跟著卡片寬度變），放在同一列對齊基線，兩行字才會一樣高
  assert.match(rule('.hero-range'), /grid-area: 2 \/ 1;/);
  assert.match(rule('.hero-weather'), /grid-area: 2 \/ 2;/);
  for (const sel of ['.hero-range', '.hero-weather']) assert.match(rule(sel), /align-self: baseline;/, sel);
});

test('temperature card gives the number and the icon the spare room: 68px number, 62/38 split', () => {
  // 左欄最寬的是「未來 24 小時 18°–22°」（134px）；320 寬時左欄 62% 還剩 12px
  assert.match(rule('.temp'), /font-size: 68px;/);
  assert.match(rule('.hero-card'), /grid-template-columns: minmax\(0, 1fr\) 38%;/);
});

test('the 生活建議 period label stays on one line (only about 5px to spare at 320px)', () => {
  assert.match(css, /\n\.advice-label \{[^}]*white-space: nowrap;/);
});

test('while a sheet is open the page behind it cannot scroll, and the scrollbar keeps its space', () => {
  // sheet.js 打開面板時在 <html> 加 sheet-open；沒鎖的話，手指在面板上不能捲的地方滑，會捲到後面的主頁面
  assert.match(rule('html.sheet-open'), /overflow: hidden;/);
  assert.match(rule('html.sheet-open'), /scrollbar-gutter: stable;/);
});

test('sheet.js marks <html> while a sheet is open and clears it on close', () => {
  const js = readFileSync('site/js/render/sheet.js', 'utf8');
  assert.match(js, /document\.documentElement\.classList\.add\('sheet-open'\)/);
  assert.match(js, /document\.documentElement\.classList\.remove\('sheet-open'\)/);
});
