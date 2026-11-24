import { iconKey, isNight, iconUrl } from '../logic/icons.js';
import { adviceItems } from '../logic/advice.js';
import { tempBar, tempGradient, daylightFraction, dayRow, hourLabel, hhmm, weekdayChar, obsItems, obsTime, weekPopText, dataTimeParts, timeRange } from '../logic/format.js';
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

// 區塊標題放在卡片外面；sub 是標題後面的小字副標題，onDetail 有值時右邊加「詳細預報」。
function sectionHead(title, onDetail, sub) {
  const head = h('div', 'sec-head');
  const h2 = h('h2', '', title);
  if (sub) h2.append(h('span', '', sub));
  head.append(h2);
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

export function renderUnavailable(el, title) {
  el.replaceChildren(sectionHead(title), h('p', 'unavailable', '暫時無法取得'));
}

// 頁尾的資料時間：實測溫度、風向、濕度的測站（可能不同站，各自一段）、觀測時間、上次更新。
// 每一段各自不斷行，窄螢幕放不下時只在「・」之後換行。
export function renderDataTime(el, data) {
  const parts = dataTimeParts(data);
  el.replaceChildren(...parts.flatMap((text, i) => (i ? ['・', h('span', '', text)] : [h('span', '', text)])));
}

// 溫度卡片下面一排三格：名稱在上、數字在下，單位用小字；缺值只寫 --，不寫單位。
function stat(label, value, unit) {
  const dd = h('dd', '', value);
  if (value !== '--' && unit) dd.append(h('small', '', unit));
  const box = h('div');
  box.append(h('dt', '', label), dd);
  return box;
}

export function renderNowTiles(el, data) {
  const td = data.threeDay, wk = data.weekly;
  if (!td && !wk) return renderUnavailable(el, '目前天氣');
  const uv = wk?.uv, pop = td?.current.pop, feels = td?.current.apparentTemperature;
  const stats = h('dl', 'stats');
  stats.append(
    stat('降雨機率', typeof pop === 'number' ? String(pop) : '--', '%'),
    stat('體感溫度', typeof feels === 'number' ? String(Math.round(feels)) : '--', '°C'),
    stat(uv?.label || '紫外線', uv ? String(uv.value) : '--', uv?.level || ''),
  );
  el.replaceChildren(stats);
}

export function renderHourly(el, data, { onDetail }) {
  const td = data.threeDay;
  if (!td?.hourly?.length) return renderUnavailable(el, '逐小時預報');
  const strip = scroller('hourly-strip', '逐小時預報');
  td.hourly.forEach((p, i) => {
    // 午夜那格（不是第一格）左邊畫一條直線，分開兩天
    const cell = h('div', i && p.time.slice(11, 13) === '00' ? 'hour day-start' : 'hour');
    cell.append(
      h('div', 'hour-time', hourLabel(p.time, i)),
      img(iconUrl(iconKey(p.weather), { night: isNight(p.time) }), p.weather || '', 'hour-icon'),
      h('div', 'hour-temp', deg(p.temperature)),
      h('div', 'hour-pop', pct(p.pop)),
    );
    strip.append(cell);
  });
  const card = h('div', 'card');
  card.append(strip);
  el.replaceChildren(sectionHead('逐小時預報', onDetail), card);
}

const ADVICE_ICONS = {
  'short-sleeve': ui.shortSleeve, 'long-sleeve': ui.longSleeve, 'heavy-coat': ui.heavyCoat,
  'light-jacket': ui.lightJacket, umbrella: ui.umbrella, laundry: ui.laundry, 'no-laundry': ui.noLaundry,
};

export function renderAdvice(el, data) {
  const periods = data.county36h;
  if (!periods?.length) return renderUnavailable(el, '生活建議');
  const row = scroller('advice-row', '生活建議');
  for (const p of periods) {
    const info = h('div', 'advice-info');
    info.append(
      h('div', 'advice-label', `${p.label} ${timeRange(p.start, p.end)}`),
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
    const items = adviceItems({ ...p, night: isNight(p.start) });
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

export function renderWeekly(el, data, { onDetail }) {
  const wk = data.weekly;
  if (!wk?.days?.length) return renderUnavailable(el, '7 日預報');
  const rows = wk.days.map((d) => ({ d, r: dayRow(d) }));
  const mins = rows.map(({ r }) => r.min).filter((v) => typeof v === 'number');
  const maxs = rows.map(({ r }) => r.max).filter((v) => typeof v === 'number');
  const weekMin = Math.min(...mins), weekMax = Math.max(...maxs);
  const list = h('div', 'card week-list');
  // 每天一行：名稱、圖示、降雨機率（30% 以上才寫）、最低溫、溫度條、最高溫。
  // 彩色段的位置照整週範圍換算，顏色照固定色階（18° 以下藍、以上紅）。
  for (const { d, r } of rows) {
    const bar = h('div', 'week-bar');
    if (typeof r.min === 'number' && typeof r.max === 'number') {
      const b = tempBar(r.min, r.max, weekMin, weekMax);
      const fill = h('span');
      fill.style.left = `${b.left}%`;
      fill.style.width = `${b.width}%`;
      fill.style.background = tempGradient(r.min, r.max);
      bar.append(fill);
    }
    const temps = h('div', 'week-temps');
    temps.append(h('span', '', deg(r.min)), bar, h('span', '', deg(r.max)));
    const row = h('div', 'week-row');
    row.append(
      h('div', 'week-label', d.label),
      // 沒有天氣現象時放一個空的位置，後面幾欄才不會往左移
      r.weather ? img(iconUrl(iconKey(r.weather), { night: r.night }), r.weather) : h('span'),
      h('div', 'week-pop', weekPopText(r.pop)),
      temps,
    );
    list.append(row);
  }
  el.replaceChildren(sectionHead('7 日預報', onDetail), list);
}

// 目前觀測：五格實測值，不寫測站；缺值的格子只寫 --。
// 每格觀測時間相同時，時間寫在標題旁；不同時每格數字下面寫自己的時間。
export function renderObsTiles(el, data) {
  const o = data.observation;
  if (!o) return renderUnavailable(el, '目前觀測');
  const items = obsItems(o), shared = obsTime(items);
  const dl = h('dl');
  for (const it of items) {
    const dd = h('dd', '', it.value);
    if (it.unit) dd.append(h('small', '', it.unit));
    if (!shared && it.time) dd.append(h('span', 'obs-time', it.time));
    const box = h('div');
    box.append(h('dt', '', it.label), dd);
    dl.append(box);
  }
  const card = h('div', 'card obs-card');
  card.append(dl);
  el.replaceChildren(sectionHead('目前觀測', null, shared ? `實測 ${shared}` : '實測'), card);
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
  el.replaceChildren(sectionHead('日出日落'), card);
}
