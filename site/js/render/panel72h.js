import { openSheet } from './sheet.js';
import { renderChart, niceTicks, PAD_X } from '../chart.js';
import { iconKey, isNight, iconUrl } from '../logic/icons.js';
import { weekdayChar } from '../logic/format.js';
import { h, img, pct, choiceRow, dateRow } from './sections.js';
import * as ui from './ui-icons.js';

const HOUR_PX = 16;
const DAY_LEAD = 40;
const TABS = [
  { label: '氣溫', key: 'temperature', unit: '°' },
  { label: '體感溫度', key: 'apparentTemperature', unit: '°' },
  { label: '蒲福風級', key: 'beaufort', unit: ' 級', floor: 0 },
  { label: '濕度', key: 'humidity', unit: '%', floor: 0, ceil: 100 },
];
const POP_TICKS = [0, 20, 40, 60, 80, 100];

const nums = (list) => list.filter((v) => typeof v === 'number');
const fmt = (v, unit) => (typeof v === 'number' ? `${Math.round(v)}${unit}` : '--');
const dateOf = (iso) => iso.slice(0, 10);

// 每 6 小時標一次時間，午夜那格改標日期。
function xLabel(iso) {
  const hour = Number(iso.slice(11, 13));
  if (hour % 6) return '';
  return hour ? `${hour}時` : `${Number(iso.slice(5, 7))}/${Number(iso.slice(8, 10))} (${weekdayChar(iso)})`;
}

// 上下各多留 1 再取整齊的刻度，線才不會貼著圖的上下緣。
function ticksFor(values, { floor = -Infinity, ceil = Infinity }) {
  const n = nums(values);
  if (!n.length) return niceTicks(0, 1);
  return niceTicks(Math.max(floor, Math.min(...n) - 1), Math.min(ceil, Math.max(...n) + 1));
}

function extra(icon, label, value) {
  const box = h('div', 'p72-extra');
  box.innerHTML = icon;
  const text = h('div');
  text.append(h('div', 'extra-label', label), value);
  box.append(text);
  return box;
}

export function open72hPanel(data) {
  const pts = data.threeDay?.hourly;
  if (!pts?.length) return;
  // 前段每小時一筆、後段每 3 小時一筆，橫座標照時間算。
  const t0 = Date.parse(pts[0].time);
  const xs = pts.map((p) => PAD_X + ((Date.parse(p.time) - t0) / 3600e3) * HOUR_PX);
  const xLabels = pts.map((p) => xLabel(p.time));
  const dates = [...new Set(pts.map((p) => dateOf(p.time)))];
  let sel = 0, tab = 0, main;

  const days = dateRow(dates.map((date) => ({ date, top: weekdayChar(date) })), (i) => {
    const first = pts.findIndex((p) => dateOf(p.time) === dates[i]);
    select(first);
    // 第一格前面多留一點，那天午夜的日期文字（置中在格線上）才不會被切掉。
    scroll.scrollLeft = first ? xs[first] - DAY_LEAD : 0;
  });
  const dateLine = h('div', 'p72-date');
  const tabs = choiceRow('seg', TABS.map((t) => t.label), (i) => { tab = i; drawMain(); update(); });
  const value = h('span', 'p72-value');
  const icon = img('', '', 'p72-icon');
  const now = h('div', 'p72-now');
  now.append(value, icon);
  const range = h('div', 'p72-range');

  const mainSlot = h('div');
  const popValue = h('span', 'pop-value');
  const popHead = h('div', 'pop-head');
  popHead.append(h('span', '', '降雨機率'), popValue);
  const popSlot = h('div');
  // 兩張圖放在同一個橫向捲動容器裡，x 座標一樣，捲動時一起動。
  const scroll = h('div', 'chart-scroll');
  scroll.tabIndex = 0;
  scroll.setAttribute('role', 'region');
  scroll.setAttribute('aria-label', '72 小時圖表，左右鍵選時刻');
  scroll.append(mainSlot, popHead, popSlot);

  const wind = h('div', 'extra-value');
  const comfort = h('div', 'extra-value');
  const extras = h('div', 'p72-extras');
  extras.append(extra(ui.wind, '風向', wind), extra(ui.heart, '舒適度', comfort));

  function drawMain() {
    const t = TABS[tab];
    const values = pts.map((p) => p[t.key]);
    const ticks = ticksFor(values, t);
    main = renderChart(mainSlot, {
      values, xs, xLabels, min: ticks[0], max: ticks[ticks.length - 1], yTicks: ticks, unit: t.unit.trim(),
      kind: 'line', color: 'var(--text)', fill: ['rgba(26,26,26,.16)', 'rgba(26,26,26,0)'], height: 150, onSelect: select,
    });
  }
  drawMain();
  const pop = renderChart(popSlot, {
    values: pts.map((p) => p.pop), xs, xLabels, min: 0, max: 100, yTicks: POP_TICKS, unit: '%',
    kind: 'step', color: 'var(--pop)', fill: ['rgba(61,139,239,.3)', 'rgba(61,139,239,.18)'], height: 130, onSelect: select,
  });

  function select(i) { sel = i; update(); }

  function update() {
    const p = pts[sel], t = TABS[tab], date = dateOf(p.time);
    days.select(dates.indexOf(date));
    dateLine.textContent = `${date.slice(0, 4)}年${Number(date.slice(5, 7))}月${Number(date.slice(8, 10))}日 星期${weekdayChar(date)}`;
    tabs.select(tab);
    value.textContent = fmt(p[t.key], t.unit);
    icon.hidden = !p.weather;
    icon.src = iconUrl(iconKey(p.weather), { night: isNight(p.time) });
    icon.alt = p.weather || '';
    const sameDay = nums(pts.filter((q) => dateOf(q.time) === date).map((q) => q[t.key]));
    const hi = sameDay.length ? Math.max(...sameDay) : null, lo = sameDay.length ? Math.min(...sameDay) : null;
    range.replaceChildren(h('span', '', `最高 ${fmt(hi, t.unit)}`), h('span', '', `最低 ${fmt(lo, t.unit)}`));
    popValue.textContent = pct(p.pop);
    wind.textContent = p.windDirection || '--';
    comfort.textContent = p.comfort || '--';
    main.select(sel);
    pop.select(sel);
  }

  // 鍵盤：左右鍵移動選中的時刻，圖表跟著捲，讓選中的點留在畫面裡（右邊扣掉刻度那一欄）。
  scroll.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (!step) return;
    e.preventDefault();
    select(Math.min(pts.length - 1, Math.max(0, sel + step)));
    const visible = scroll.clientWidth - mainSlot.querySelector('.chart-y').offsetWidth;
    const x = xs[sel];
    if (x - PAD_X < scroll.scrollLeft) scroll.scrollLeft = x - PAD_X;
    else if (x + PAD_X > scroll.scrollLeft + visible) scroll.scrollLeft = x + PAD_X - visible;
  });

  update();
  const root = h('div', 'p72');
  root.append(days.row, dateLine, tabs.row, now, range, scroll, extras);
  openSheet({ title: '72 小時預報', content: root });
}
