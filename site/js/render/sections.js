import { iconKey, isNight, iconUrl } from '../logic/icons.js';
import { adviceItems } from '../logic/advice.js';
import { tempBar, daylightFraction, dayRow, hourLabel, hhmm, weekdayChar, SHOW_WEEK_POP_AT } from '../logic/format.js';
import * as ui from './ui-icons.js';

export function h(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text != null) e.textContent = text;
  return e;
}

export function img(src, alt, className) {
  const e = h('img', className);
  e.src = src;
  e.alt = alt;
  return e;
}

// 一排只能選一個的按鈕（面板的分頁、日期列）。items 是每顆按鈕的內容，選中的那顆 aria-pressed="true"。
export function choiceRow(className, items, onPick) {
  const row = h('div', className);
  const buttons = items.map((content, i) => {
    const b = h('button');
    b.type = 'button';
    b.append(...[].concat(content));
    b.addEventListener('click', () => onPick(i));
    return b;
  });
  row.append(...buttons);
  const select = (i) => buttons.forEach((b, j) => b.setAttribute('aria-pressed', String(i === j)));
  return { row, buttons, select };
}

// 面板上方的日期列：上面是星期（或「今天」），下面是幾號。
export function dateRow(items, onPick) {
  const md = (date) => `${Number(date.slice(5, 7))}月${Number(date.slice(8, 10))}日`;
  const c = choiceRow('date-row', items.map(({ date, top }) => [h('span', 'dow', top), h('span', 'dnum', String(Number(date.slice(8, 10))))]), onPick);
  c.buttons.forEach((b, i) => b.setAttribute('aria-label', `${md(items[i].date)} 星期${weekdayChar(items[i].date)}`));
  return c;
}

// 缺值一律顯示 --，不拿別的數字補。
export const deg = (v) => (typeof v === 'number' ? `${Math.round(v)}°` : '--°');
export const pct = (v) => (typeof v === 'number' ? `${v}%` : '--');
const num = (v) => (typeof v === 'number' ? String(v) : '--');

function sectionHead(title, onDetail) {
  const head = h('div', 'sec-head');
  head.append(h('h2', '', title));
  if (onDetail) {
    const more = h('button', 'more', '詳細預報');
    more.type = 'button';
    more.insertAdjacentHTML('beforeend', ui.chevronRight);
    more.addEventListener('click', onDetail);
    head.append(more);
  }
  return head;
}

// 橫向捲動的區域要能用鍵盤捲。
function scroller(className, label) {
  const e = h('div', className);
  e.tabIndex = 0;
  e.setAttribute('role', 'region');
  e.setAttribute('aria-label', label);
  return e;
}

function tile(label, value, extra) {
  const t = h('div', 'tile');
  t.append(h('div', 'tile-label', label), value, ...(extra || []));
  return t;
}

export function renderUnavailable(el, title) {
  el.replaceChildren(sectionHead(title), h('p', 'unavailable', '暫時無法取得'));
}

export function renderDataTime(el, data) {
  const obsTime = data.observation?.time;
  const updated = `上次更新 ${hhmm(data.generatedAt)}`;
  el.textContent = obsTime ? `觀測時間 ${hhmm(obsTime)}・${updated}` : updated;
}

export function renderNowTiles(el, data) {
  const td = data.threeDay, wk = data.weekly;
  if (!td && !wk) return renderUnavailable(el, '目前天氣');
  const uv = wk?.uv;
  const uvValue = h('div', 'tile-value');
  if (uv) uvValue.append(String(uv.value), h('small', '', uv.level));
  else uvValue.textContent = '--';
  const grid = h('div', 'tiles');
  grid.append(
    tile('降雨機率', h('div', 'tile-value', pct(td?.current.pop))),
    tile(uv?.label || '紫外線', uvValue),
    tile('體感溫度', h('div', 'tile-value', deg(td?.current.apparentTemperature))),
  );
  el.replaceChildren(grid);
}

export function renderHourly(el, data, { onDetail }) {
  const td = data.threeDay;
  if (!td) return renderUnavailable(el, '逐小時預報');
  const strip = scroller('hourly-strip', '逐小時預報');
  td.hourly.forEach((p, i) => {
    const cell = h('div', 'hour');
    cell.append(
      h('div', 'hour-time', hourLabel(p.time, i)),
      img(iconUrl(iconKey(p.weather), { night: isNight(p.time), style: 'line' }), p.weather || '', 'hour-icon'),
      h('div', 'hour-pop', pct(p.pop)),
      h('div', 'hour-temp', deg(p.temperature)),
    );
    strip.append(cell);
  });
  const card = h('div', 'card');
  card.append(strip);
  el.replaceChildren(sectionHead('逐小時預報', onDetail), card);
}

const ADVICE_ICONS = {
  'short-sleeve': ui.shortSleeve, 'light-long-sleeve': ui.lightLongSleeve, jacket: ui.jacket,
  'heavy-coat': ui.heavyCoat, umbrella: ui.umbrella, laundry: ui.laundry,
};

export function renderAdvice(el, data) {
  const periods = data.county36h;
  if (!periods) return renderUnavailable(el, '生活建議');
  const row = scroller('advice-row', '生活建議');
  for (const p of periods) {
    const info = h('div', 'advice-info');
    info.append(
      h('div', 'advice-label', p.label),
      h('div', 'advice-temp', `${num(p.minT)} - ${num(p.maxT)}°`),
      h('div', 'advice-pop', `降雨 ${pct(p.pop)}`),
    );
    const look = h('div', 'advice-look');
    if (p.weather) look.append(img(iconUrl(iconKey(p.weather), { night: isNight(p.start) }), p.weather));
    look.append(h('div', 'advice-comfort', p.comfort || ''));
    const top = h('div', 'advice-top');
    top.append(info, look);
    const card = h('div', 'advice-card');
    card.append(top);
    const items = adviceItems(p);
    if (items.length) {
      const list = h('div', 'advice-items');
      for (const it of items) {
        const item = h('div', 'advice-item');
        item.innerHTML = ADVICE_ICONS[it.key];
        item.append(h('div', '', it.label));
        list.append(item);
      }
      card.append(list);
    }
    row.append(card);
  }
  el.replaceChildren(sectionHead('生活建議'), row);
}

const monthDay = (date) => `${Number(date.slice(5, 7))}月${Number(date.slice(8, 10))}日`;

export function renderWeekly(el, data, { onDetail }) {
  const wk = data.weekly;
  if (!wk) return renderUnavailable(el, '7 日預報');
  const rows = wk.days.map((d) => ({ d, r: dayRow(d) }));
  const mins = rows.map(({ r }) => r.min).filter((v) => typeof v === 'number');
  const maxs = rows.map(({ r }) => r.max).filter((v) => typeof v === 'number');
  const weekMin = Math.min(...mins), weekMax = Math.max(...maxs);
  const list = h('div', 'card week-list');
  for (const { d, r } of rows) {
    const day = h('div', 'week-day');
    day.append(h('div', 'week-label', d.label), h('div', 'week-date', monthDay(d.date)));
    const look = h('div', 'week-look');
    if (r.weather) look.append(img(iconUrl(iconKey(r.weather), { night: r.night }), r.weather));
    look.append(h('div', 'week-pop', typeof r.pop === 'number' && r.pop >= SHOW_WEEK_POP_AT ? `${r.pop}%` : ''));
    const bar = h('div', 'week-bar');
    if (typeof r.min === 'number' && typeof r.max === 'number') {
      const b = tempBar(r.min, r.max, weekMin, weekMax);
      const fill = h('span');
      fill.style.clipPath = `inset(0 ${100 - b.left - b.width}% 0 ${b.left}% round 2px)`;
      bar.append(fill);
    }
    const temps = h('div', 'week-temps');
    temps.append(h('span', '', deg(r.min)), bar, h('span', '', deg(r.max)));
    const extra = h('div', 'week-extra');
    extra.append(h('span', '', `紫外線 ${num(r.uv)}`), h('span', '', `體感 ${deg(r.minAT)}/${deg(r.maxAT)}`));
    const right = h('div', 'week-right');
    right.append(temps, extra);
    const row = h('div', 'week-row');
    row.append(day, look, right);
    list.append(row);
  }
  el.replaceChildren(sectionHead('7 日預報', onDetail), list);
}

export function renderObsTiles(el, data) {
  const o = data.observation;
  if (!o) return renderUnavailable(el, '觀測資料');
  const grid = h('div', 'tiles');
  for (const [label, obs, unit] of [['今天累積雨量', o.rainToday, 'mm'], ['風速', o.windSpeed, 'm/s'], ['氣壓', o.pressure, 'hPa']]) {
    grid.append(tile(label, h('div', 'tile-value', num(obs?.value)), [
      h('div', 'tile-unit', unit),
      h('div', 'tile-station', obs ? `${obs.station}測站` : ''),
    ]));
  }
  el.replaceChildren(grid);
}

// 弧線是一段餘弦曲線：兩端在地平線下，t = 0.25 和 0.75 跟地平線相交，中間是白天。
const ARC = { x0: 40, width: 240, base: 62, amp: 30 };
const arcPoint = (t) => [ARC.x0 + t * ARC.width, ARC.base - ARC.amp * Math.cos(Math.PI * (2 * t - 1))];

export function renderSun(el, data) {
  const s = data.sun;
  if (!s) return renderUnavailable(el, '日出日落');
  const end = (cls, iconFile, label, time) => {
    const box = h('div', cls);
    box.append(img(`icons/weather/fill/${iconFile}.svg`, label), h('div', 'sun-time', time));
    return box;
  };
  const times = h('div', 'sun-times');
  times.append(end('sun-end', 'sunrise', '日出', s.sunrise), end('sun-end right', 'sunset', '日落', s.sunset));

  const path = Array.from({ length: 49 }, (_, i) => arcPoint(i / 48))
    .map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const f = daylightFraction(hhmm(data.generatedAt), s.sunrise, s.sunset);
  const [sx, sy] = arcPoint(0.25 + 0.5 * f);
  const { x0, width, base } = ARC;
  const wrap = h('div');
  wrap.innerHTML = `<svg class="sun-arc" viewBox="0 20 320 80" aria-hidden="true">
    <defs><linearGradient id="sun-arc-fade" gradientUnits="userSpaceOnUse" x1="${x0}" x2="${x0 + width}">
      <stop offset="0" stop-color="currentColor" stop-opacity="0"/><stop offset=".25" stop-color="currentColor"/>
      <stop offset=".75" stop-color="currentColor"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/>
    </linearGradient></defs>
    <line class="horizon" x1="16" x2="304" y1="${base}" y2="${base}"/>
    <path d="${path}" fill="none" stroke="url(#sun-arc-fade)" stroke-width="2"/>
    <circle class="sun-dot" cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="7"/>
  </svg>`;
  const card = h('div', 'card sun-card');
  card.append(times, wrap.firstElementChild);
  el.replaceChildren(card);
}
