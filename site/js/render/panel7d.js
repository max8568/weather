import { openSheet } from './sheet.js';
import { scalePoints, smoothSegments, bandSegments, niceTicks } from '../chart.js';
import { iconKey, iconUrl } from '../logic/icons.js';
import { weekSummary, dayRow, weekdayChar, beaufortText } from '../logic/format.js';
import { h, img, deg, pct, choiceRow, dateRow } from './sections.js';

const num = (v) => (typeof v === 'number' ? String(v) : '--');
const nums = (list) => list.filter((v) => typeof v === 'number');

// 小卡：標題，下面是彩色圓點和數值。
function dotTile(label, dot, ...value) {
  const v = h('div', 'tile-value');
  v.append(h('span', `dot ${dot}`), ...value);
  const t = h('div', 'tile');
  t.append(h('div', 'tile-label', label), v);
  return t;
}

function uvValue(uv, level) {
  return typeof uv === 'number' ? [String(uv), h('small', '', level || '')] : ['--'];
}

function halfBlock(name, half, night) {
  const text = h('div');
  text.append(
    h('div', 'half-name', name),
    h('div', 'half-temp', `${num(half.minT)} - ${num(half.maxT)}°`),
    h('div', 'half-line', `降雨 ${pct(half.pop)}・濕度 ${pct(half.humidity)}`),
    h('div', 'half-line', `蒲福風級 ${beaufortText(half.beaufort)}`),
  );
  const look = h('div', 'half-look');
  if (half.weather) look.append(img(iconUrl(iconKey(half.weather), { night }), half.weather), h('div', '', half.weather));
  const box = h('div', 'half');
  box.append(text, look);
  return box;
}

// 每日預報：選一天，顯示有資料的白天、晚上兩段和三格小卡。
function dailyView(days, state) {
  const detail = h('div');
  const row = dateRow(days.map((d) => ({ date: d.date, top: d.label === '今天' ? '今天' : weekdayChar(d.date) })), (i) => {
    state.day = i;
    show();
  });
  function show() {
    const d = days[state.day], r = dayRow(d);
    row.select(state.day);
    const halves = [];
    if (d.day) halves.push(halfBlock('白天', d.day, false));
    if (d.night) halves.push(halfBlock('晚上', d.night, true));
    const tiles = h('div', 'tiles p7-tiles');
    tiles.append(
      dotTile('體感最高', 'max', deg(r.maxAT)),
      dotTile('體感最低', 'min', deg(r.minAT)),
      dotTile('紫外線', 'uv', ...uvValue(d.day?.uv, d.day?.uvLevel)),
    );
    detail.replaceChildren(...halves, tiles);
  }
  show();
  const view = h('div');
  view.append(row.row, detail);
  return view;
}

// 本週氣溫：最高溫、最低溫兩條平滑曲線，中間淡淡填色。今天那一點標數字：最高溫寫在點上方、最低溫寫在點下方，兩個溫度很接近時才不會疊在一起。
function weekChart(days) {
  const rows = days.map(dayRow);
  const maxs = rows.map((r) => r.max), mins = rows.map((r) => r.min);
  const all = nums([...maxs, ...mins]);
  const ticks = all.length ? niceTicks(Math.min(...all) - 1, Math.max(...all) + 1, 3) : niceTicks(0, 1, 3);
  const W = 358, L = 24, R = W - 46, PLOT = 170, H = 216;
  const xs = days.map((_, i) => (days.length > 1 ? L + (i * (R - L)) / (days.length - 1) : L));
  const scale = { height: PLOT, min: ticks[0], max: ticks[ticks.length - 1], padTop: 30, padBottom: 22, xs };
  const yOf = (v) => scalePoints([v], { ...scale, xs: [0] })[0][1].toFixed(1);
  // 缺值的那天兩條線都斷開，填色也只填兩邊都有值的區段
  const band = bandSegments(maxs, mins, scale);
  const area = band ? `<path class="area" d="${band}"/>` : '';
  const grid = ticks.map((t) => `<line class="grid" x1="${L}" x2="${R}" y1="${yOf(t)}" y2="${yOf(t)}"/>
    <text class="y-label" x="${W - 2}" y="${yOf(t)}" dy="4" text-anchor="end">${t}°</text>`).join('');
  const labels = days.map((d, i) => (d.label === '今天'
    ? `<text class="x-label today" x="${xs[i]}" y="${PLOT + 16}" text-anchor="middle">今天</text>`
    : `<text class="x-label" x="${xs[i]}" y="${PLOT + 16}" text-anchor="middle">${Number(d.date.slice(5, 7))}/${Number(d.date.slice(8, 10))}<tspan x="${xs[i]}" dy="17">(${weekdayChar(d.date)})</tspan></text>`)).join('');
  const mark = (v, cls, dy) => (typeof v === 'number'
    ? `<circle class="halo ${cls}" cx="${xs[0]}" cy="${yOf(v)}" r="10"/><circle class="${cls}" cx="${xs[0]}" cy="${yOf(v)}" r="4.5"/>
       <text class="mark ${cls}" x="${xs[0] - 8}" y="${yOf(v)}" dy="${dy}">${v}°</text>` : '');
  const box = h('div');
  box.innerHTML = `<svg class="week-chart" viewBox="0 0 ${W} ${H}" aria-hidden="true">${grid}${area}
    <path class="hi" d="${smoothSegments(maxs, scale).line}"/><path class="lo" d="${smoothSegments(mins, scale).line}"/>${mark(maxs[0], 'hi', -15)}${mark(mins[0], 'lo', 26)}${labels}</svg>`;
  return box.firstElementChild;
}

// 一週概況：整週氣溫曲線，加上四格整週的統計。
function summaryView(days) {
  const s = weekSummary(days);
  const uvHalf = days.flatMap((d) => [d.day, d.night]).find((x) => x && x.uv === s.maxUV);
  const legend = h('div', 'legend');
  legend.append(h('span', 'dot max'), '最高溫', h('span', 'dot min'), '最低溫');
  const head = h('div', 'week-head');
  head.append(h('h3', '', '本週氣溫'), legend);
  const tiles = h('div', 'tiles p7-tiles');
  tiles.append(
    dotTile('體感最高', 'max', deg(s.maxAT)),
    dotTile('體感最低', 'min', deg(s.minAT)),
    dotTile('紫外線', 'uv', ...uvValue(s.maxUV, uvHalf?.uvLevel)),
    dotTile('濕度', 'min', pct(s.avgHumidity)),
  );
  const view = h('div');
  view.append(head, weekChart(days), tiles);
  return view;
}

export function open7dPanel(data) {
  const days = data.weekly?.days;
  if (!days?.length) return;
  const state = { tab: 0, day: 0 };
  const body = h('div');
  // 換分頁時把內容整個換掉，不用 hidden 藏起來：面板的 Tab 鍵循環會把藏起來的按鈕也算進去。
  const tabs = choiceRow('seg light', ['每日預報', '一週概況'], (i) => { state.tab = i; show(); });
  function show() {
    tabs.select(state.tab);
    body.replaceChildren(state.tab ? summaryView(days) : dailyView(days, state));
  }
  show();
  const root = h('div', 'p7');
  root.append(tabs.row, body);
  openSheet({ title: '7日預報', content: root });
}
