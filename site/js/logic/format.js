export const SHOW_WEEK_POP_AT = 30;

const nums = (list) => list.filter((v) => typeof v === 'number');
const maxOf = (list) => { const n = nums(list); return n.length ? Math.max(...n) : null; };
const minOf = (list) => { const n = nums(list); return n.length ? Math.min(...n) : null; };

// 一天的溫度區間在整週區間裡的位置，單位是百分比。
export function tempBar(min, max, weekMin, weekMax) {
  if (weekMax === weekMin) return { left: 0, width: 100 };
  const span = weekMax - weekMin;
  return { left: ((min - weekMin) / span) * 100, width: ((max - min) / span) * 100 };
}

const toMinutes = (s) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));

export function daylightFraction(now, sunrise, sunset) {
  const n = toMinutes(now), a = toMinutes(sunrise), b = toMinutes(sunset);
  if (n <= a) return 0;
  if (n >= b) return 1;
  return (n - a) / (b - a);
}

const halves = (days) => days.flatMap((d) => [d.day, d.night]).filter(Boolean);

export function weekSummary(days) {
  const hs = halves(days);
  const hum = nums(hs.map((h) => h.humidity));
  return {
    maxAT: maxOf(hs.map((h) => h.maxAT)),
    minAT: minOf(hs.map((h) => h.minAT)),
    maxUV: maxOf(hs.map((h) => h.uv)),
    avgHumidity: hum.length ? Math.round(hum.reduce((a, b) => a + b, 0) / hum.length) : null,
  };
}

export function dayRow(day) {
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

export function hhmm(iso) {
  return iso.slice(11, 16);
}

export function hourLabel(iso, index) {
  if (index === 0) return '現在';
  const hour = iso.slice(11, 13);
  if (hour === '00') return `${iso.slice(5, 7)}/${iso.slice(8, 10)}`;
  return `${hour}時`;
}

// 同一天的逐時資料有沒有涵蓋整天：第一筆不晚於 03:00、最後一筆不早於 21:00。
// times 是照時間排好的台北時間 ISO 字串，直接讀字串裡的時分。
export function coversWholeDay(times) {
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
export function dayExtremes(dateKey, hourly, weekly, field) {
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
export function beaufortText(v) {
  if (typeof v !== 'number') return '--';
  return v === 1 ? '≤1 級' : `${Math.round(v)} 級`;
}

// 最上方三個實測值（溫度、風向、濕度）來自哪個測站。同一站就寫「五股測站」；
// 不同站就照測站分組：「溫度、風向 五股測站・濕度 新莊測站」。三個都沒有值時是空字串。
export function heroStations(obs) {
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
export function weekdayChar(date) {
  const day = new Date(Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)))).getUTCDay();
  return '日一二三四五六'[day];
}

// 7 日預報溫度條的固定色階：18° 以下是藍色（越冷越深），18° 以上是紅色（越熱越深）。
// 16° 到 20° 之間由淺藍漸變到淺紅，18° 剛好落在中間的淺灰紫色。顏色都偏淺（相對亮度 0.2 以上）。
const TEMP_SCALE = [[0, '#5f84ba'], [16, '#8cc1f2'], [20, '#f3aa94'], [40, '#ca6360']];
const hexRgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));

export function tempColor(t) {
  const v = Math.min(40, Math.max(0, t));
  const k = TEMP_SCALE.findIndex(([at], i) => i && v <= at);
  const [a0, c0] = TEMP_SCALE[k - 1], [a1, c1] = TEMP_SCALE[k];
  const f = (v - a0) / (a1 - a0), x = hexRgb(c0), y = hexRgb(c1);
  return `#${x.map((n, i) => Math.round(n + (y[i] - n) * f).toString(16).padStart(2, '0')).join('')}`;
}

// 一天最低溫到最高溫那一段的漸層：兩端和中間經過的色階點都標上顏色。
export function tempGradient(min, max) {
  const pts = [min, ...TEMP_SCALE.map(([at]) => at).filter((at) => at > min && at < max), max];
  const at = (t) => (max === min ? 0 : ((t - min) / (max - min)) * 100);
  return `linear-gradient(90deg, ${pts.map((t, i) => `${tempColor(t)} ${i === pts.length - 1 ? 100 : +at(t).toFixed(2)}%`).join(', ')})`;
}

// 溫度卡片上的日期：「11 月 23 日・星期一」。iso 是台北時間字串，直接讀日期，不用瀏覽器的時鐘。
export function dateLabel(iso) {
  return `${Number(iso.slice(5, 7))} 月 ${Number(iso.slice(8, 10))} 日・星期${weekdayChar(iso)}`;
}

// 「目前觀測」的五格，固定順序。每格帶自己的測站；缺值顯示 --，不寫單位和測站。
const OBS_ITEMS = [
  ['濕度', 'humidity', '%'], ['風速', 'windSpeed', 'm/s'], ['風向', 'windDirection', ''],
  ['氣壓', 'pressure', 'hPa'], ['今天累積雨量', 'rainToday', 'mm'],
];
export function obsItems(obs) {
  return OBS_ITEMS.map(([label, key, unit]) => {
    const o = obs?.[key];
    const v = o?.value;
    const ok = key === 'windDirection' ? typeof v === 'string' && v !== '' : typeof v === 'number';
    return ok ? { label, value: String(v), unit, station: o.station || '' } : { label, value: '--', unit: '', station: '' };
  });
}
