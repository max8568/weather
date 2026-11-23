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
  return index === 0 ? '現在' : `${iso.slice(11, 13)}時`;
}

// 同一天的逐時資料有沒有涵蓋整天：第一筆不晚於 03:00、最後一筆不早於 21:00。
// times 是照時間排好的台北時間 ISO 字串，直接讀字串裡的時分。
export function coversWholeDay(times) {
  if (!times.length) return false;
  return hhmm(times[0]) <= '03:00' && hhmm(times[times.length - 1]) >= '21:00';
}

const WEEKLY_EXTREMES = { temperature: ['min', 'max'], apparentTemperature: ['minAT', 'maxAT'] };

// 72 小時面板上「最高 最低」的數字。field 是逐時資料的欄位名稱。
// 氣溫和體感溫度：一週預報裡那天白天、晚上兩段都有的話，用一週預報給的整天最高最低。
// 其他情況用逐時資料裡那天的最高最低；逐時資料沒涵蓋整天時 partial 是 true，畫面要寫「預報時段內」。
export function dayExtremes(dateKey, hourly, weekly, field) {
  const keys = WEEKLY_EXTREMES[field];
  const day = keys && weekly ? weekly.days.find((d) => d.date === dateKey) : null;
  if (day && day.day && day.night) {
    const r = dayRow(day);
    return { min: r[keys[0]], max: r[keys[1]], partial: false };
  }
  const slots = hourly.filter((p) => p.time.slice(0, 10) === dateKey);
  const values = slots.map((p) => p[field]);
  return { min: minOf(values), max: maxOf(values), partial: !coversWholeDay(slots.map((p) => p.time)) };
}

// 日期字串（或台北時間 ISO 的前 10 碼）是星期幾，用 UTC 算，不受瀏覽器時區影響。
export function weekdayChar(date) {
  const day = new Date(Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)))).getUTCDay();
  return '日一二三四五六'[day];
}
