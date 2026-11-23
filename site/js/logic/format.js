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
