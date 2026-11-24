// 由 docs/weather-layout-claude/build-panels.mjs 從 site/ 產生，不要手改；網站改了就重跑那支程式。
(function () {
const M = {};
M['render/ui-icons.js'] = (function () {
// 介面用的線條圖示，24×24，顏色跟著文字顏色（currentColor）。
const svg = (d) => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;

// 長袖衣服的外形，從左邊領口畫到右邊領口，領口各自畫。
const sleeves = 'M9 4L5.5 6l-3 11 2.5 1 2-6.5V20h10v-8.5l2 6.5 2.5-1-3-11L15 4';
// 曬衣繩、兩個夾子、兩件衣服。
const clothesline = 'M3 7h18M8.5 5v4.5M15.5 5v4.5M6 17v-5a2.5 2.5 0 0 1 5 0v5zM13 17v-5a2.5 2.5 0 0 1 5 0v5z';

const menu = svg('M5 9h14M5 15h14');
const chevronRight = svg('M9 6l6 6-6 6');
const close = svg('M6 6l12 12M18 6L6 18');
const shortSleeve = svg('M8 4c1 1.5 2.3 2 4 2s3-.5 4-2l4 3-2 3-2-1v11H8V9l-2 1-2-3z');
// 毛衣：圓領、袖口和下擺的羅紋。
const longSleeve = svg(`${sleeves}M9 4c.7 1.3 1.7 2 3 2s2.3-.7 3-2M3 15.3l2.4 1.2M21 15.3l-2.4 1.2M7 18h10`);
// 開襟外套：V 領，前面開口。
const lightJacket = svg(`${sleeves}M9 4l3 6 3-6M12 10v10`);
// 羽絨外套：立領、拉鍊、橫向車線。
const heavyCoat = svg(`${sleeves}M9 4h6M12 4v16M7 12.5h10M7 16.5h10`);
// 收起來直立的傘，握把朝上。
const umbrella = svg('M12 10V5a1.5 1.5 0 0 1 3 0v.5M8.5 10h7l-1.2 10.1a1 1 0 0 1-1 .9h-2.6a1 1 0 0 1-1-.9z');
const laundry = svg(clothesline);
const noLaundry = svg(`${clothesline}M5 20L19 4`);
const wind = svg('M3 9h10.5a2.5 2.5 0 1 0-2.5-2.5M3 13h15.5a2.5 2.5 0 1 1-2.5 2.5M3 17h8');
const heart = svg('M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z');
return { menu, chevronRight, close, shortSleeve, longSleeve, lightJacket, heavyCoat, umbrella, laundry, noLaundry, wind, heart };
})();
M['logic/icons.js'] = (function () {
// 天氣文字 → 圖示。規則依序比對，先符合的先用。
function iconKey(weather) {
  const w = typeof weather === 'string' ? weather : '';
  if (w.includes('雷')) return 'thunderstorm';
  if (/[雪冰霰]/.test(w)) return 'snow';
  if (w.includes('雨')) return 'rain';
  if (w.includes('霧')) return 'fog';
  if (w.startsWith('晴')) return /[雲陰]/.test(w) ? 'partly-cloudy' : 'clear';
  if (w.includes('晴')) return 'partly-cloudy';
  if (w.startsWith('陰')) return 'overcast';
  return 'cloudy';
}

// iso 是 Worker 給的台北時間字串，直接讀小時，不用瀏覽器的時鐘。
function isNight(iso) {
  const h = Number(iso.slice(11, 13));
  return h < 6 || h >= 18;
}

const FILES = {
  clear: ['clear-day', 'clear-night'],
  'partly-cloudy': ['partly-cloudy-day', 'partly-cloudy-night'],
  cloudy: ['cloudy'], overcast: ['overcast'], rain: ['rain'],
  thunderstorm: ['thunderstorms-rain'], snow: ['snow'], fog: ['fog'],
};

function fileName(key, night) {
  const [dayFile, nightFile] = FILES[key] || FILES.cloudy;
  return night && nightFile ? nightFile : dayFile;
}

function iconUrl(key, { night = false, style = 'fill' } = {}) {
  return `../../site/icons/weather/${style}/${fileName(key, night)}.svg`;
}

// fill 圖示在 64×64 的畫布裡畫到的最低點（y 座標），算進線條粗細、線頭，和動畫移到最低時的位置。
// 雲只畫到 45.5；太陽的光芒、雨滴、雪花、霧會畫到接近底部。
const DRAWN_BOTTOM = {
  cloudy: 45.5, overcast: 45.5, 'partly-cloudy-day': 45.5, 'partly-cloudy-night': 45.5,
  'clear-night': 49, 'clear-day': 56, rain: 59, 'thunderstorms-rain': 59.1, fog: 59.5, snow: 60,
};

// 溫度卡片右邊的天氣說明要往上疊進圖示多少（圖示寬度的 %，負的），讓字停在圖示畫到的最低點下方 7/64。
// 7/64 是組合版設計稿的距離：多雲時晴的雲畫到 45.5，字往上拉 18%。
// 最多拉到圖片底部，不往下推：雨滴和雪花落到最低時已經淡出。
function captionMargin(key, { night = false } = {}) {
  const pull = (DRAWN_BOTTOM[fileName(key, night)] + 7 - 64) / 64;
  return Math.min(0, Math.round(pull * 1000) / 10);
}
return { iconKey, isNight, iconUrl, captionMargin };
})();
M['logic/format.js'] = (function () {
const SHOW_WEEK_POP_AT = 30;

const nums = (list) => list.filter((v) => typeof v === 'number');
const maxOf = (list) => { const n = nums(list); return n.length ? Math.max(...n) : null; };
const minOf = (list) => { const n = nums(list); return n.length ? Math.min(...n) : null; };

// 一天的溫度區間在整週區間裡的位置，單位是百分比。
function tempBar(min, max, weekMin, weekMax) {
  if (weekMax === weekMin) return { left: 0, width: 100 };
  const span = weekMax - weekMin;
  return { left: ((min - weekMin) / span) * 100, width: ((max - min) / span) * 100 };
}

const toMinutes = (s) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));

function daylightFraction(now, sunrise, sunset) {
  const n = toMinutes(now), a = toMinutes(sunrise), b = toMinutes(sunset);
  if (n <= a) return 0;
  if (n >= b) return 1;
  return (n - a) / (b - a);
}

const halves = (days) => days.flatMap((d) => [d.day, d.night]).filter(Boolean);

function weekSummary(days) {
  const hs = halves(days);
  const hum = nums(hs.map((h) => h.humidity));
  return {
    maxAT: maxOf(hs.map((h) => h.maxAT)),
    minAT: minOf(hs.map((h) => h.minAT)),
    maxUV: maxOf(hs.map((h) => h.uv)),
    avgHumidity: hum.length ? Math.round(hum.reduce((a, b) => a + b, 0) / hum.length) : null,
  };
}

function dayRow(day) {
  const hs = [day.day, day.night].filter(Boolean);
  const main = day.day || day.night;
  return {
    min: minOf(hs.map((h) => h.minT)),
    max: maxOf(hs.map((h) => h.maxT)),
    pop: maxOf(hs.map((h) => h.pop)),
    uv: day.day ? day.day.uv : null,
    minAT: minOf(hs.map((h) => h.minAT)),
    maxAT: maxOf(hs.map((h) => h.maxAT)),
    weather: main ? main.weather : null,
    night: !day.day,
  };
}

function hhmm(iso) {
  return iso.slice(11, 16);
}

function hourLabel(iso, index) {
  if (index === 0) return '現在';
  const hour = iso.slice(11, 13);
  if (hour === '00') return `${iso.slice(5, 7)}/${iso.slice(8, 10)}`;
  return `${hour}時`;
}

// 同一天的逐時資料有沒有涵蓋整天：第一筆不晚於 03:00、最後一筆不早於 21:00。
// times 是照時間排好的台北時間 ISO 字串，直接讀字串裡的時分。
function coversWholeDay(times) {
  if (!times.length) return false;
  return hhmm(times[0]) <= '03:00' && hhmm(times[times.length - 1]) >= '21:00';
}

// 一週預報每段裡的最低、最高欄位
const WEEKLY_EXTREMES = { temperature: ['minT', 'maxT'], apparentTemperature: ['minAT', 'maxAT'] };

const nextDate = (dateKey) => new Date(Date.UTC(Number(dateKey.slice(0, 4)), Number(dateKey.slice(5, 7)) - 1, Number(dateKey.slice(8, 10)) + 1)).toISOString().slice(0, 10);

// 72 小時面板上「最高 最低」的數字。field 是逐時資料的欄位名稱。
// 氣溫和體感溫度：一週預報那天的白天從 06:00 以前開始、晚上到隔天 06:00 以後才結束，
// 而且兩段的最低、最高都有值，才算涵蓋整天，用一週預報給的整天最高最低，
// 再把那天的逐時數值也算進去（兩份預報可能對不上，畫面上選到的數值不能比「最高」還高）。
// 氣象署 11:00 發布後，當天白天那段是 12:00–18:00，這時不算整天。
// 其他情況只用逐時資料裡那天的最高最低；逐時資料沒涵蓋整天時 partial 是 true，畫面要寫「預報時段內」。
function dayExtremes(dateKey, hourly, weekly, field) {
  const slots = hourly.filter((p) => p.time.slice(0, 10) === dateKey);
  const values = slots.map((p) => p[field]);
  const keys = WEEKLY_EXTREMES[field];
  const day = keys && weekly ? weekly.days.find((d) => d.date === dateKey) : null;
  const halves = day && day.day && day.night ? [day.day, day.night] : null;
  const wholeDay = halves
    && day.day.start.slice(0, 16) <= `${dateKey}T06:00`
    && day.night.end.slice(0, 16) >= `${nextDate(dateKey)}T06:00`
    && halves.every((h) => keys.every((k) => typeof h[k] === 'number'));
  if (wholeDay) {
    return {
      min: minOf([...halves.map((h) => h[keys[0]]), ...values]),
      max: maxOf([...halves.map((h) => h[keys[1]]), ...values]),
      partial: false,
    };
  }
  return { min: minOf(values), max: maxOf(values), partial: !coversWholeDay(slots.map((p) => p.time)) };
}

// 蒲福風級。氣象署把 0 到 1 級寫成「<= 1」，Worker 轉成 1，畫面寫「≤1 級」。
function beaufortText(v) {
  if (typeof v !== 'number') return '--';
  return v === 1 ? '≤1 級' : `${Math.round(v)} 級`;
}

// 最上方三個實測值（溫度、風向、濕度）來自哪個測站。同一站就寫「五股測站」；
// 不同站就照測站分組：「溫度、風向 五股測站・濕度 新莊測站」。三個都沒有值時是空字串。
function heroStations(obs) {
  const groups = [];
  for (const [label, o] of [['溫度', obs?.temperature], ['風向', obs?.windDirection], ['濕度', obs?.humidity]]) {
    if (!o) continue;
    const g = groups.find((x) => x.station === o.station);
    if (g) g.labels.push(label);
    else groups.push({ station: o.station, labels: [label] });
  }
  if (groups.length === 1) return `${groups[0].station}測站`;
  return groups.map((g) => `${g.labels.join('、')} ${g.station}測站`).join('・');
}

// 日期字串（或台北時間 ISO 的前 10 碼）是星期幾，用 UTC 算，不受瀏覽器時區影響。
function weekdayChar(date) {
  const day = new Date(Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)))).getUTCDay();
  return '日一二三四五六'[day];
}

// 7 日預報溫度條的固定色階：18° 以下是藍色（越冷越深），18° 以上是紅色（越熱越深）。
// 16° 到 20° 之間由淺藍漸變到淺紅，18° 剛好落在中間的淺灰紫色。顏色都偏淺（相對亮度 0.2 以上）。
const TEMP_SCALE = [[0, '#5f84ba'], [16, '#8cc1f2'], [20, '#f3aa94'], [40, '#ca6360']];
const hexRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

function tempColor(t) {
  const v = Math.min(40, Math.max(0, t));
  const k = TEMP_SCALE.findIndex(([at], i) => i && v <= at);
  const [a0, c0] = TEMP_SCALE[k - 1], [a1, c1] = TEMP_SCALE[k];
  const f = (v - a0) / (a1 - a0), x = hexRgb(c0), y = hexRgb(c1);
  return `#${x.map((n, i) => Math.round(n + (y[i] - n) * f).toString(16).padStart(2, '0')).join('')}`;
}

// 一天最低溫到最高溫那一段的漸層：兩端和中間經過的色階點都標上顏色。
function tempGradient(min, max) {
  const pts = [min, ...TEMP_SCALE.map(([at]) => at).filter((at) => at > min && at < max), max];
  const at = (t) => (max === min ? 0 : ((t - min) / (max - min)) * 100);
  return `linear-gradient(90deg, ${pts.map((t, i) => `${tempColor(t)} ${i === pts.length - 1 ? 100 : +at(t).toFixed(2)}%`).join(', ')})`;
}

// 溫度卡片上的日期：「11 月 23 日・星期一」。iso 是台北時間字串，直接讀日期，不用瀏覽器的時鐘。
function dateLabel(iso) {
  return `${Number(iso.slice(5, 7))} 月 ${Number(iso.slice(8, 10))} 日・星期${weekdayChar(iso)}`;
}

// 「目前觀測」的五格，固定順序。每格帶自己的測站和觀測時間（HH:MM）；缺值顯示 --，不寫單位、測站和時間。
const OBS_ITEMS = [
  ['濕度', 'humidity', '%'], ['風速', 'windSpeed', 'm/s'], ['風向', 'windDirection', ''],
  ['氣壓', 'pressure', 'hPa'], ['今天累積雨量', 'rainToday', 'mm'],
];
function obsItems(obs) {
  return OBS_ITEMS.map(([label, key, unit]) => {
    const o = obs?.[key];
    const v = o?.value;
    const ok = key === 'windDirection' ? typeof v === 'string' && v !== '' : typeof v === 'number';
    return ok
      ? { label, value: String(v), unit, station: o.station || '', time: o.time ? hhmm(o.time) : '' }
      : { label, value: '--', unit: '', station: '', time: '' };
  });
}

// 有值的格子都是同一個觀測時間時回傳那個時間，標在「目前觀測」標題旁；時間不一樣（不同測站）時回傳空字串，改成每格各寫自己的時間。
function obsTime(items) {
  const times = [...new Set(items.filter((x) => x.value !== '--').map((x) => x.time))];
  return times.length === 1 ? times[0] : '';
}

// 7 日預報的降雨機率：30% 以上才寫出來，低於 30% 留空；沒有資料寫 --，跟「機率很低」分得出來。
function weekPopText(pop) {
  if (typeof pop !== 'number') return '--';
  return pop >= SHOW_WEEK_POP_AT ? `${pop}%` : '';
}

// 頁尾資料時間那一行的每一段。不同測站各自一段，窄螢幕可以在段和段之間換行。
function dataTimeParts(data) {
  const stations = heroStations(data.observation);
  const time = data.observation?.time;
  return [
    ...(stations ? stations.split('・') : []),
    ...(time ? [`觀測時間 ${hhmm(time)}`] : []),
    `上次更新 ${hhmm(data.generatedAt)}`,
  ];
}
return { SHOW_WEEK_POP_AT, tempBar, daylightFraction, weekSummary, dayRow, hhmm, hourLabel, coversWholeDay, dayExtremes, beaufortText, heroStations, weekdayChar, tempColor, tempGradient, dateLabel, obsItems, obsTime, weekPopText, dataTimeParts };
})();
M['logic/advice.js'] = (function () {
// 穿著、薄外套、帶傘、曬衣建議。缺值的項目不給。night：這個時段的開始時間是不是在晚上（18:00 到 06:00）。
function adviceItems({ maxT, minT, pop, weather, night }) {
  const items = [];
  if (typeof maxT === 'number') {
    if (maxT >= 22) items.push({ key: 'short-sleeve', label: '短袖' });
    else if (maxT >= 16) items.push({ key: 'long-sleeve', label: '長袖' });
    else items.push({ key: 'heavy-coat', label: '厚外套' });
    if (maxT >= 16 && typeof minT === 'number' && minT <= (night ? 20 : 16)) items.push({ key: 'light-jacket', label: '薄外套' });
  }
  if (typeof pop === 'number') {
    if (pop >= 50) items.push({ key: 'umbrella', label: '帶雨傘' });
    if (pop <= 20 && !(weather || '').includes('雨')) items.push({ key: 'laundry', label: '適合曬衣' });
    else items.push({ key: 'no-laundry', label: '不適合曬衣' });
  }
  return items;
}
return { adviceItems };
})();
M['chart.js'] = (function () {
// 手寫的 SVG 圖表。上半部是算路徑的純函式（有測試），下半部 renderChart 把它們畫出來。

const r = (v) => Number(v.toFixed(2));

// 數值換成座標：min 在底部、max 在頂部，null 的點略過。
// 橫座標預設是把 width 平均分給每個點；有傳 xs 的話直接用 xs[i]
// （72 小時圖的資料前段每小時一筆、後段每 3 小時一筆，橫座標要照時間算）。min 等於 max 時全部放在底部。
function scalePoints(values, { width = 0, height, min, max, padTop = 8, padBottom = 8, xs } = {}) {
  const inner = height - padTop - padBottom;
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  const out = [];
  values.forEach((v, i) => {
    if (typeof v !== 'number') return;
    const ratio = max === min ? 0 : (v - min) / (max - min);
    out.push([xs ? xs[i] : i * step, height - padBottom - ratio * inner]);
  });
  return out;
}

// Fritsch–Carlson 單調三次插值：曲線經過每個點，兩點之間不會超出這兩點的高低範圍。
function smoothPath(points) {
  const n = points.length;
  if (!n) return '';
  let d = `M${r(points[0][0])} ${r(points[0][1])}`;
  if (n === 1) return d;
  const dx = [], s = [];
  for (let k = 0; k < n - 1; k++) {
    dx[k] = points[k + 1][0] - points[k][0];
    s[k] = (points[k + 1][1] - points[k][1]) / dx[k];
  }
  const m = [s[0]];
  for (let k = 1; k < n - 1; k++) m[k] = s[k - 1] * s[k] <= 0 ? 0 : (s[k - 1] + s[k]) / 2;
  m[n - 1] = s[n - 2];
  for (let k = 0; k < n - 1; k++) {
    if (s[k] === 0) { m[k] = 0; m[k + 1] = 0; continue; }
    const a = m[k] / s[k], b = m[k + 1] / s[k], len = a * a + b * b;
    if (len > 9) {
      const t = 3 / Math.sqrt(len);
      m[k] = t * a * s[k];
      m[k + 1] = t * b * s[k];
    }
  }
  for (let k = 0; k < n - 1; k++) {
    const [xa, ya] = points[k], [xb, yb] = points[k + 1], h = dx[k] / 3;
    d += ` C${r(xa + h)} ${r(ya + m[k] * h)} ${r(xb - h)} ${r(yb - m[k + 1] * h)} ${r(xb)} ${r(yb)}`;
  }
  return d;
}

// 階梯線：每個值一直維持到下一個點，最後一個值畫到 endX。
function stepPath(points, endX) {
  if (!points.length) return '';
  let d = `M${r(points[0][0])} ${r(points[0][1])}`;
  for (const [x, y] of points.slice(1)) d += ` H${r(x)} V${r(y)}`;
  return `${d} H${r(endX)}`;
}

// 有缺值的階梯圖：連續有值的時段各畫一段，每段畫到下一個時段的起點（最後一段畫到 endX）。
// 缺值的時段沒有線、也沒有填色，跟上方顯示的「--」一致。其餘參數和 scalePoints 一樣，xs 必填。
function stepSegments(values, { xs, endX, ...scale }) {
  const bottom = r(scalePoints([scale.min], { ...scale, xs: [0] })[0][1]);
  const lines = [], areas = [];
  let start = 0;
  for (let i = 0; i <= values.length; i++) {
    if (i < values.length && typeof values[i] === 'number') continue;
    if (i > start) {
      const pts = scalePoints(values.slice(start, i), { ...scale, xs: xs.slice(start, i) });
      const line = stepPath(pts, i < values.length ? xs[i] : endX);
      lines.push(line);
      areas.push(`${line} V${bottom} H${r(pts[0][0])} Z`);
    }
    start = i + 1;
  }
  return { line: lines.join(' '), area: areas.join(' ') };
}

// 連續有值的索引範圍 [start, end)。缺值的位置把資料切成好幾段。
function numberRuns(values) {
  const runs = [];
  let start = -1;
  values.forEach((v, i) => {
    if (typeof v === 'number') { if (start < 0) start = i; }
    else if (start >= 0) { runs.push([start, i]); start = -1; }
  });
  if (start >= 0) runs.push([start, values.length]);
  return runs;
}

// 有缺值的平滑曲線：連續有值的部分各畫一段，各自往下填色到底部；缺值的地方不畫線也不填色，
// 跟上方顯示的「--」一致。其餘參數和 scalePoints 一樣，xs 必填。
function smoothSegments(values, { xs, ...scale }) {
  const bottom = r(scalePoints([scale.min], { ...scale, xs: [0] })[0][1]);
  const lines = [], areas = [];
  for (const [a, b] of numberRuns(values)) {
    const pts = scalePoints(values.slice(a, b), { ...scale, xs: xs.slice(a, b) });
    const line = smoothPath(pts);
    lines.push(line);
    areas.push(`${line} L${r(pts[pts.length - 1][0])} ${bottom} L${r(pts[0][0])} ${bottom} Z`);
  }
  return { line: lines.join(' '), area: areas.join(' ') };
}

// 兩條平滑曲線（7 日面板的最高溫、最低溫）中間的填色：兩邊都有值的連續區段各填一塊。
function bandSegments(hi, lo, { xs, ...scale }) {
  const both = hi.map((v, i) => (typeof v === 'number' && typeof lo[i] === 'number' ? v : null));
  return numberRuns(both).map(([a, b]) => {
    const part = { ...scale, xs: xs.slice(a, b) };
    const top = smoothPath(scalePoints(hi.slice(a, b), part));
    const bottom = smoothPath(scalePoints(lo.slice(a, b), part).reverse()).replace('M', 'L');
    return `${top} ${bottom} Z`;
  }).join(' ');
}

const STEPS = [1, 2, 3, 5, 10, 20, 25, 50, 100];

// 刻度：從小到大試間隔，取第一個能讓格數不超過 maxIntervals 的。
function niceTicks(lo, hi, maxIntervals = 5) {
  for (const step of STEPS) {
    const a = Math.floor(lo / step) * step;
    let b = Math.ceil(hi / step) * step;
    if (b === a) b = a + step;
    if ((b - a) / step <= maxIntervals || step === STEPS[STEPS.length - 1]) {
      const ticks = [];
      for (let v = a; v <= b; v += step) ticks.push(v);
      return ticks;
    }
  }
}

const NS = 'http://www.w3.org/2000/svg';
function svgEl(tag, attrs = {}, style = {}) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  Object.assign(e.style, style);
  return e;
}

const PAD_X = 12;      // 第一個點和最後一個點離圖邊的距離，選中時的圓點才不會被切掉
const LABEL_H = 26;           // 底下時間文字的高度
const PAD_TOP = 16;
const PAD_BOTTOM = 2;
const HOLD_MS = 300;          // 手指按住多久開始選時刻
const HOLD_SLOP = 8;          // 按住期間手指可以晃動的距離（px），超過就當成滑動
let uid = 0;

// 畫一張圖到 container。values 和 xs、xLabels 一一對應；xLabels 空字串的位置不寫字。
// fill 是線下方漸層的上、下兩個顏色。y 軸刻度放在右邊，橫向捲動時固定在畫面右側。
function renderChart(container, {
  values, xs, xLabels = [], min, max, yTicks = [], unit = '', kind = 'line',
  color = 'currentColor', fill = ['transparent', 'transparent'], height = 150, onSelect,
}) {
  xs = xs || values.map((_, i) => PAD_X + i * 16);
  const width = (xs.length ? xs[xs.length - 1] : 0) + PAD_X;
  const plotH = height - LABEL_H;
  const scale = { height: plotH, min, max, padTop: PAD_TOP, padBottom: PAD_BOTTOM, xs };
  const yOf = (v) => scalePoints([v], { ...scale, xs: [0] })[0][1];
  const top = yOf(max), bottom = yOf(min);

  const svg = svgEl('svg', { width, height, viewBox: `0 0 ${width} ${height}`, 'aria-hidden': 'true' });
  const id = `chart-fill-${++uid}`;
  const grad = svgEl('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 });
  grad.append(svgEl('stop', { offset: 0 }, { stopColor: fill[0] }), svgEl('stop', { offset: 1 }, { stopColor: fill[1] }));
  const defs = svgEl('defs');
  defs.append(grad);
  svg.append(defs);

  for (const t of yTicks) {
    const y = r(yOf(t));
    svg.append(svgEl('line', { class: 'grid', x1: 0, x2: width, y1: y, y2: y }));
  }
  xLabels.forEach((label, i) => {
    if (!label) return;
    svg.append(svgEl('line', { class: 'grid dash', x1: xs[i], x2: xs[i], y1: r(top), y2: r(bottom) }));
    const text = svgEl('text', { class: 'x-label', x: xs[i], y: height - 6, 'text-anchor': xs[i] < 30 ? 'start' : 'middle' });
    text.textContent = label;
    svg.append(text);
  });

  const pts = scalePoints(values, scale);
  if (pts.length) {
    let line, area;
    if (kind === 'step') ({ line, area } = stepSegments(values, { ...scale, endX: width }));
    else ({ line, area } = smoothSegments(values, scale));
    svg.append(svgEl('path', { d: area, fill: `url(#${id})` }));
    svg.append(svgEl('path', { d: line, fill: 'none', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, { stroke: color }));
  }
  const dot = svgEl('g');
  svg.append(dot);

  const axis = document.createElement('div');
  axis.className = 'chart-y';
  for (const t of yTicks) {
    const label = document.createElement('span');
    label.textContent = `${t}${unit}`;
    label.style.top = `${r(yOf(t))}px`;
    axis.append(label);
  }

  const wrap = document.createElement('div');
  wrap.className = 'chart';
  wrap.append(svg, axis);
  container.replaceChildren(wrap);

  let current = -1;
  function select(i) {
    current = i;
    dot.replaceChildren();
    const v = values[i];
    if (typeof v !== 'number') return;
    const cx = xs[i], cy = r(yOf(v));
    if (kind === 'line') dot.append(svgEl('circle', { cx, cy, r: 13, 'fill-opacity': 0.15 }, { fill: color }));
    dot.append(svgEl('circle', { cx, cy, r: kind === 'line' ? 6 : 4.5 }, { fill: color }));
  }

  function pick(clientX) {
    const x = clientX - svg.getBoundingClientRect().left;
    let best = 0;
    xs.forEach((v, i) => { if (Math.abs(v - x) < Math.abs(xs[best] - x)) best = i; });
    if (best === current) return;
    select(best);
    if (onSelect) onSelect(best);
  }
  // 點一下選那個時刻；滑鼠或觸控筆按住拖動時一路跟著選。
  svg.addEventListener('click', (e) => pick(e.clientX));
  svg.addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch' && e.buttons & 1) pick(e.clientX); });

  // 手指：按住不動約 300ms 才開始選，之後到放開前左右移動都在選時刻，這段期間圖表和頁面都不捲動。
  // 沒按住就滑動，照常捲動圖表。要擋住捲動只能在 touchmove 呼叫 preventDefault，所以用 touch 事件。
  let hold = 0, scrubbing = false, startX = 0, startY = 0;
  const stopTouch = () => { clearTimeout(hold); hold = 0; scrubbing = false; };
  svg.addEventListener('touchstart', (e) => {
    stopTouch();
    if (e.touches.length !== 1) return;
    ({ clientX: startX, clientY: startY } = e.touches[0]);
    hold = setTimeout(() => { hold = 0; scrubbing = true; pick(startX); }, HOLD_MS);
  }, { passive: true });
  svg.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (scrubbing) {
      e.preventDefault();
      pick(t.clientX);
    } else if (hold && Math.hypot(t.clientX - startX, t.clientY - startY) > HOLD_SLOP) {
      stopTouch(); // 手指在 300ms 內就移動了，當成滑動
    }
  }, { passive: false });
  svg.addEventListener('touchend', stopTouch);
  svg.addEventListener('touchcancel', stopTouch);
  svg.addEventListener('contextmenu', (e) => { if (scrubbing) e.preventDefault(); });

  return { select };
}
return { scalePoints, smoothPath, stepPath, stepSegments, smoothSegments, bandSegments, niceTicks, PAD_X, renderChart };
})();
M['render/sections.js'] = (function () {
const { iconKey, isNight, iconUrl } = M['logic/icons.js'];
const { adviceItems } = M['logic/advice.js'];
const { tempBar, tempGradient, daylightFraction, dayRow, hourLabel, hhmm, weekdayChar, obsItems, obsTime, weekPopText, dataTimeParts } = M['logic/format.js'];
const ui = M['render/ui-icons.js'];

function h(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text != null) e.textContent = text;
  return e;
}

function img(src, alt, className) {
  const e = h('img', className);
  e.src = src;
  e.alt = alt;
  return e;
}

// 一排只能選一個的按鈕（面板的分頁、日期列）。items 是每顆按鈕的內容，選中的那顆 aria-pressed="true"。
function choiceRow(className, items, onPick) {
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
function dateRow(items, onPick) {
  const md = (date) => `${Number(date.slice(5, 7))}月${Number(date.slice(8, 10))}日`;
  const c = choiceRow('date-row', items.map(({ date, top }) => [h('span', 'dow', top), h('span', 'dnum', String(Number(date.slice(8, 10))))]), onPick);
  c.buttons.forEach((b, i) => b.setAttribute('aria-label', `${md(items[i].date)} 星期${weekdayChar(items[i].date)}`));
  return c;
}

// 缺值一律顯示 --，不拿別的數字補。
const deg = (v) => (typeof v === 'number' ? `${Math.round(v)}°` : '--°');
const pct = (v) => (typeof v === 'number' ? `${v}%` : '--');
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

function renderUnavailable(el, title) {
  el.replaceChildren(sectionHead(title), h('p', 'unavailable', '暫時無法取得'));
}

// 頁尾的資料時間：實測溫度、風向、濕度的測站（可能不同站，各自一段）、觀測時間、上次更新。
// 每一段各自不斷行，窄螢幕放不下時只在「・」之後換行。
function renderDataTime(el, data) {
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

function renderNowTiles(el, data) {
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

function renderHourly(el, data, { onDetail }) {
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

function renderAdvice(el, data) {
  const periods = data.county36h;
  if (!periods?.length) return renderUnavailable(el, '生活建議');
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

function renderWeekly(el, data, { onDetail }) {
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

// 目前觀測：五格實測值，每格數字下面寫它自己的測站（不同項目可能來自不同測站）；缺值的格子只寫 --。
// 每格觀測時間相同時，時間寫在標題旁；不同時每格在測站後面寫自己的時間。
function renderObsTiles(el, data) {
  const o = data.observation;
  if (!o) return renderUnavailable(el, '目前觀測');
  const items = obsItems(o), shared = obsTime(items);
  const dl = h('dl');
  for (const it of items) {
    const dd = h('dd', '', it.value);
    if (it.unit) dd.append(h('small', '', it.unit));
    if (it.station) dd.append(h('span', 'obs-station', `${it.station}測站${!shared && it.time ? ` ${it.time}` : ''}`));
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

function renderSun(el, data) {
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
return { h, img, choiceRow, dateRow, deg, pct, renderUnavailable, renderDataTime, renderNowTiles, renderHourly, renderAdvice, renderWeekly, renderObsTiles, renderSun };
})();
M['render/sheet.js'] = (function () {
// 從下方滑出的面板。左上關閉按鈕、點背景或按 Esc 關閉。
function openSheet({ title, content, onClose }) {
  const backdrop = document.createElement('div');
  backdrop.className = 'sheet-backdrop';
  const sheet = document.createElement('div');
  sheet.className = 'sheet';
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.setAttribute('aria-label', title);

  const head = document.createElement('div');
  head.className = 'sheet-head';
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'sheet-close';
  closeBtn.setAttribute('aria-label', '關閉');
  closeBtn.textContent = '×';
  const h = document.createElement('h2');
  h.textContent = title;
  head.append(closeBtn, h);

  const body = document.createElement('div');
  body.className = 'sheet-body';
  body.append(content);
  sheet.append(head, body);
  backdrop.append(sheet);
  document.body.append(backdrop);
  const trigger = document.activeElement;
  const page = document.querySelector('main');
  if (page) page.inert = true;
  closeBtn.focus();

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    document.removeEventListener('keydown', onKey);
    backdrop.classList.add('closing');
    sheet.inert = true;
    if (page) page.inert = false;
    if (trigger && trigger.isConnected) trigger.focus();
    setTimeout(() => backdrop.remove(), 250);
    if (onClose) onClose();
  }
  function onKey(e) {
    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Tab') return;
    const items = [...sheet.querySelectorAll('button, [tabindex="0"]')];
    const i = items.indexOf(document.activeElement);
    if (!items.length) return;
    if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
    else if (!e.shiftKey && (i === -1 || i === items.length - 1)) { e.preventDefault(); items[0].focus(); }
  }
  document.addEventListener('keydown', onKey);
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  return { close };
}
return { openSheet };
})();
M['render/panel72h.js'] = (function () {
const { openSheet } = M['render/sheet.js'];
const { renderChart, niceTicks, PAD_X } = M['chart.js'];
const { iconKey, isNight, iconUrl } = M['logic/icons.js'];
const { weekdayChar, dayExtremes, beaufortText, hhmm } = M['logic/format.js'];
const { h, img, pct, choiceRow, dateRow } = M['render/sections.js'];
const ui = M['render/ui-icons.js'];

const HOUR_PX = 16;
const DAY_LEAD = 40;
const TABS = [
  { label: '氣溫', key: 'temperature', unit: '°' },
  { label: '體感溫度', key: 'apparentTemperature', unit: '°' },
  { label: '蒲福風級', key: 'beaufort', unit: ' 級', floor: 0, text: beaufortText },
  { label: '濕度', key: 'humidity', unit: '%', floor: 0, ceil: 100 },
];
const POP_TICKS = [0, 20, 40, 60, 80, 100];

const nums = (list) => list.filter((v) => typeof v === 'number');
const fmt = (v, unit) => (typeof v === 'number' ? `${Math.round(v)}${unit}` : '--');
const show = (t, v) => (t.text ? t.text(v) : fmt(v, t.unit));
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

function open72hPanel(data) {
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
    dateLine.textContent = `${date.slice(0, 4)}年${Number(date.slice(5, 7))}月${Number(date.slice(8, 10))}日 星期${weekdayChar(date)} ${hhmm(p.time)}`;
    tabs.select(tab);
    value.textContent = show(t, p[t.key]);
    icon.hidden = !p.weather;
    icon.src = iconUrl(iconKey(p.weather), { night: isNight(p.time) });
    icon.alt = p.weather || '';
    const ext = dayExtremes(date, pts, data.weekly, t.key);
    range.replaceChildren(h('span', '', `最高 ${show(t, ext.max)}`), h('span', '', `最低 ${show(t, ext.min)}`));
    if (ext.partial) range.prepend(h('span', '', '預報時段內'));
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
return { open72hPanel };
})();
M['render/panel7d.js'] = (function () {
const { openSheet } = M['render/sheet.js'];
const { scalePoints, smoothSegments, bandSegments, niceTicks } = M['chart.js'];
const { iconKey, iconUrl } = M['logic/icons.js'];
const { weekSummary, dayRow, weekdayChar, beaufortText } = M['logic/format.js'];
const { h, img, deg, pct, choiceRow, dateRow } = M['render/sections.js'];

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

function open7dPanel(data) {
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
return { open7dPanel };
})();
window.SITE_PANELS = { open72hPanel: M['render/panel72h.js'].open72hPanel, open7dPanel: M['render/panel7d.js'].open7dPanel };
})();
