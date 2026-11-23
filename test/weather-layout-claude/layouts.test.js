import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import vm from 'node:vm';

const DIR = 'docs/weather-layout-claude/';

// 原型是一般的 <script>，不是 module：在 vm 裡給一個 window，照瀏覽器的順序執行。
function load() {
  const win = {};
  win.window = win;
  const ctx = vm.createContext(win);
  const files = ['data.js', 'parts.js', ...readdirSync(DIR + 'layouts').filter((f) => f.endsWith('.js')).sort().map((f) => 'layouts/' + f)];
  for (const f of files) vm.runInContext(readFileSync(DIR + f, 'utf8'), ctx, { filename: f });
  return win;
}

const W = load();
const EXPECTED = ['bento'];

test('layouts are registered in order', () => {
  // vm 裡的陣列原型跟這裡不同，先轉成這邊的陣列再比
  assert.deepEqual(Array.from(W.LAYOUTS, (l) => l.key), EXPECTED);
});

test('every layout shows all the data', () => {
  const MUST = ['中正區', '06:16', '17:04', '1016.2', '2.5', '68', '0.5', '中量級',
    '今日白天', '今晚明晨', '明日白天', '週二', '週三', '週四', '週五', '週六', '週日', '實測'];
  for (const l of W.LAYOUTS) {
    const html = l.render(W.WEATHER);
    for (const s of MUST) assert.ok(html.includes(s), `${l.key} missing ${s}`);
  }
});

test('hourly has 72 entries and matches next24h', () => {
  const h = W.WEATHER.hourly;
  assert.equal(h.length, 72);
  assert.equal(h[0].time, '2026-11-23T17:00');
  assert.equal(h[71].time, '2026-11-26T16:00');
  const t = h.slice(0, 24).map((x) => x.temp);
  assert.equal(Math.max(...t), W.WEATHER.next24h.max);
  assert.equal(Math.min(...t), W.WEATHER.next24h.min);
});

test('night hours use night icons', () => {
  for (const x of W.WEATHER.hourly) {
    const hour = Number(x.time.slice(11, 13));
    const night = hour < 6 || hour >= 18;
    if (/clear|partly-cloudy/.test(x.icon)) assert.equal(x.icon.endsWith('-night'), night, x.time);
  }
});

test('every icon file exists', () => {
  const w = W.WEATHER;
  const icons = [w.now.icon, ...w.hourly.map((x) => x.icon), ...w.advice.map((x) => x.icon), ...w.week.map((x) => x.icon)];
  for (const name of new Set(icons)) assert.ok(existsSync(`site/icons/weather/fill/${name}.svg`), name);
});
