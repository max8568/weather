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
const EXPECTED = ['combo', 'bento', 'tabbar', 'chart', 'days'];

test('layouts are registered in order', () => {
  // vm 裡的陣列原型跟這裡不同，先轉成這邊的陣列再比
  assert.deepEqual(Array.from(W.LAYOUTS, (l) => l.key), EXPECTED);
});

test('every layout shows all the data', () => {
  const MUST = ['中正區', '06:16', '17:04', '1016.2', '2.5', '68', '0.5', '中量級',
    '今日白天', '今晚明晨', '明日白天', '週二', '週三', '週四', '週五', '週六', '週日', '實測', '未來 24 小時'];
  for (const l of W.LAYOUTS) {
    const html = l.render(W.WEATHER);
    for (const s of MUST) assert.ok(html.includes(s), `${l.key} missing ${s}`);
  }
});

const byKey = (key) => W.LAYOUTS.find((l) => l.key === key).render(W.WEATHER);

test('tab bar labels the measured temperature where it is shown', () => {
  const sky = byKey('tabbar').match(/<div class="sky">([\s\S]*?)<\/div>/)[1];
  assert.ok(sky.includes('實測'), sky);
});

test('chart does not put sunrise and sunset under the measured heading', () => {
  const obs = byKey('chart').match(/<section class="block obs">([\s\S]*?)<\/section>/)[1];
  assert.ok(!obs.includes('日出') && !obs.includes('日落'), obs);
});

test('chart lets a finger on it scroll the page up and down', () => {
  const css = readFileSync(DIR + 'layouts/05-chart.css', 'utf8');
  assert.ok(!/touch-action:\s*pan-x\s*;/.test(css));
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

test('combo temperature card has the place and the date, and leaves the measured label to the observations card', () => {
  const now = byKey('combo').match(/<section class="now">([\s\S]*?)<\/section>/)[1];
  assert.ok(now.includes('臺北市 中正區') && now.includes('11 月 23 日・星期一'), now);
  assert.ok(!now.includes('實測'), now);
});

test('combo advice cards follow the live site: period, range, rain, comfort, then one icon per advice item', () => {
  const arts = byKey('combo').match(/<article>[\s\S]*?<\/article>/g);
  assert.equal(arts.length, W.WEATHER.advice.length);
  W.WEATHER.advice.forEach((a, i) => {
    for (const s of [a.label, `${a.min} - ${a.max}°`, `降雨 ${a.pop}%`, a.comfort]) assert.ok(arts[i].includes(s), `${a.label} missing ${s}`);
    const items = arts[i].match(/<li>[\s\S]*?<\/li>/g) || [];
    assert.equal(items.length, a.items.length, a.label);
    a.items.forEach((it, j) => assert.ok(items[j].includes('<svg') && items[j].includes(it.label), it.label));
  });
});

test('combo shows the three stats in one row below the temperature card', () => {
  const html = byKey('combo');
  const stats = html.match(/<dl class="stats">([\s\S]*?)<\/dl>/);
  assert.ok(stats && stats.index > html.indexOf('<section class="now">'));
  assert.equal(stats[1].match(/<div>/g).length, 3);
  const css = readFileSync(DIR + 'layouts/00-combo.css', 'utf8');
  assert.match(css, /\.v-combo \.stats \{[^}]*grid-template-columns: repeat\(3, 1fr\);/);
});

test('combo shows the weather under the icon and the 24-hour range on the left', () => {
  const html = byKey('combo'), w = W.WEATHER;
  const right = html.match(/<div class="now-icon">([\s\S]*?)<\/div>/)[1];
  assert.ok(right.includes('<img') && right.includes(`<p class="cond">${w.now.weather}</p>`), right);
  const left = html.match(/<div class="now-text">([\s\S]*?)<\/div>/)[1];
  assert.ok(left.includes(`未來 24 小時 ${w.next24h.min}°–${w.next24h.max}°`) && !left.includes(w.now.weather), left);
});

test('7-day bars are colored on a fixed scale: blue up to 18°, red above, blended around 18°', () => {
  const { tempColor } = W.P;
  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  for (const t of [0, 8, 15]) { const [r, , b] = rgb(tempColor(t)); assert.ok(b > r, `${t}° should be blue`); }
  for (const t of [21, 30, 40]) { const [r, , b] = rgb(tempColor(t)); assert.ok(r > b, `${t}° should be red`); }
  // 每一條溫度條上的每個顏色點，都是那個溫度在固定色階上的顏色
  const bars = [...byKey('combo').matchAll(/<i style="[^"]*background:linear-gradient[(]90deg, ([^)]*)[)]/g)].map((m) => m[1]);
  assert.equal(bars.length, W.WEATHER.week.length);
  W.WEATHER.week.forEach((d, i) => {
    const stops = bars[i].split(', ').map((x) => x.split(' '));
    assert.equal(stops[0][1], '0%'); assert.equal(stops.at(-1)[1], '100%');
    // 百分比有四捨五入，每個顏色分量容許差 1
    for (const [color, at] of stops) {
      const want = rgb(tempColor(d.min + (parseFloat(at) / 100) * (d.max - d.min)));
      rgb(color).forEach((c, k) => assert.ok(Math.abs(c - want[k]) <= 1, `${d.label} ${at} ${color}`));
    }
  });
});

test('7-day rows leave room between the rain chance and the lowest temperature', () => {
  const css = readFileSync(DIR + 'layouts/00-combo.css', 'utf8');
  const left = Number(css.match(/[.]v-combo [.]w-range [{][^}]*margin: 0 26px 0 (\d+)px;/)[1]);
  assert.ok(left >= 48, left);
  // 溫度條下面不畫灰色底線
  assert.doesNotMatch(css, /[.]w-range::before/);
});

test('7-day title has no subtitle', () => {
  assert.match(byKey('combo'), /<section class="sec week"><div class="sec-head"><h2>7 日預報<\/h2>/);
});

test('7-day bar colors are light: every color on the scale has relative luminance of at least 0.2', () => {
  const lin = (c) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  for (let t = 0; t <= 40; t++) {
    const [r, g, b] = [1, 3, 5].map((i) => lin(parseInt(W.P.tempColor(t).slice(i, i + 2), 16)));
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    assert.ok(y >= 0.2, `${t}° ${W.P.tempColor(t)} ${y.toFixed(3)}`);
  }
});

test('combo sunrise and sunset card follows the live site: times at both ends, an arc, and the sun at the data time', () => {
  const html = byKey('combo'), w = W.WEATHER;
  const sun = html.match(/<section class="sec sun">([\s\S]*?)<\/section>/)[1];
  assert.ok(sun.includes(w.sun.rise) && sun.includes(w.sun.set) && sun.includes('class="sun-arc"'), sun);
  const m = (s) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
  const f = (m(w.updated) - m(w.sun.rise)) / (m(w.sun.set) - m(w.sun.rise));
  assert.ok(sun.includes(`<circle class="sun-dot" cx="${(40 + (0.25 + 0.5 * f) * 240).toFixed(1)}"`), sun);
});

test('combo cards use the overview card style: grey, 1px border, 6px corners', () => {
  const css = readFileSync(DIR + 'layouts/00-combo.css', 'utf8');
  const rule = (sel) => (css.match(new RegExp(`${sel.replace(/\./g, '\.')} \{([^}]*)\}`)) || [])[1] || '';
  for (const sel of ['.v-combo .card', '.v-combo .now']) {
    assert.match(rule(sel), /background: var\(--card\);/, sel);
    assert.match(rule(sel), /border: 1px solid var\(--line\);/, sel);
    assert.match(rule(sel), /border-radius: 6px;/, sel);
  }
  // 三格那排跟原型一樣是白底
  for (const p of [/background: var\(--bg\);/, /border: 1px solid var\(--line\);/, /border-radius: 6px;/]) assert.match(rule('.v-combo .stats'), p);
  assert.match(rule('.v-combo'), /--card: #f6f7f9;[^]*--line: #e2e5ea;/);
});

test('combo section titles sit above their cards, not inside them', () => {
  const html = byKey('combo');
  for (const title of ['逐小時預報', '7 日預報', '目前觀測', '日出日落']) {
    assert.match(html, new RegExp(`<h2>${title}(<span>[^<]*</span>)?</h2>(<button[^>]*>[^]*?</button>)?</div>\\s*<div class="card">`), title);
  }
});

test('combo advice cards sit right under the title, each one grey, with no box around them', () => {
  const html = byKey('combo');
  assert.match(html, /<h2>生活建議<\/h2>\s*<div class="advs hscroll"/);
  const css = readFileSync(DIR + 'layouts/00-combo.css', 'utf8');
  const art = css.match(/\.v-combo \.advs article \{([^}]*)\}/)[1];
  for (const p of [/background: var\(--card\);/, /border: 1px solid var\(--line\);/, /border-radius: 6px;/]) assert.match(art, p);
});

test('combo hourly and 7-day sections each have a detail button, like the live site', () => {
  const html = byKey('combo');
  for (const [cls, key] of [['hours', 'hourly'], ['week', 'weekly']]) {
    const head = html.match(new RegExp(`<section class="sec ${cls}"><div class="sec-head">([^]*?)</div>`))[1];
    assert.match(head, new RegExp(`<button type="button" class="more" data-detail="${key}">詳細預報<svg`), cls);
  }
});

test('the detail panels bundled into the prototype match the site source', async () => {
  const { build } = await import('../../docs/weather-layout-claude/build-panels.mjs');
  const out = build();
  const norm = (x) => x.replace(/\r\n/g, '\n');
  assert.equal(norm(readFileSync(DIR + 'site-panels.js', 'utf8')), out.js, 'site-panels.js is out of date: run node docs/weather-layout-claude/build-panels.mjs');
  assert.equal(norm(readFileSync(DIR + 'site-panels.css', 'utf8')), out.css, 'site-panels.css is out of date: run node docs/weather-layout-claude/build-panels.mjs');
});

test('the bundle loads as a plain script and exposes both site panels', () => {
  const win = {};
  win.window = win;
  vm.runInContext(readFileSync(DIR + 'site-panels.js', 'utf8'), vm.createContext(win), { filename: 'site-panels.js' });
  assert.equal(typeof win.SITE_PANELS.open72hPanel, 'function');
  assert.equal(typeof win.SITE_PANELS.open7dPanel, 'function');
});

test('the detail panels get data that agrees with the 7-day list and the hourly strip', async () => {
  const { dayRow } = await import('../../site/js/logic/format.js');
  const win = {};
  win.window = win;
  const ctx = vm.createContext(win);
  for (const f of ['data.js', 'detail.js']) vm.runInContext(readFileSync(DIR + f, 'utf8'), ctx, { filename: f });
  const data = JSON.parse(JSON.stringify(win.DETAIL.siteData(win.WEATHER)));
  assert.equal(data.threeDay.hourly.length, 72);
  data.threeDay.hourly.forEach((x, i) => {
    assert.equal(x.temperature, win.WEATHER.hourly[i].temp);
    for (const k of ['apparentTemperature', 'beaufort', 'humidity', 'pop']) assert.equal(typeof x[k], 'number', `${x.time} ${k}`);
    for (const k of ['weather', 'windDirection', 'comfort']) assert.equal(typeof x[k], 'string', `${x.time} ${k}`);
  });
  assert.equal(data.weekly.days.length, 7);
  data.weekly.days.forEach((d, i) => {
    const r = dayRow(d), wk = win.WEATHER.week[i];
    assert.deepEqual([r.min, r.max, r.pop], [wk.min, wk.max, wk.pop], wk.label);
    for (const half of [d.day, d.night]) for (const k of ['humidity', 'beaufort', 'minAT', 'maxAT']) assert.equal(typeof half[k], 'number', `${wk.label} ${k}`);
  });
});
