import { WEEKLY } from '../fields.js';
import { isoTaipei, toTaipei, dayLabel } from '../time.js';
import { num, str, findTown, intervalSeries, valueAt } from './series.js';
import { TownNotFound } from './threeDay.js';

export function uvLevelText(value) {
  if (value <= 2) return '低量級';
  if (value <= 5) return '中量級';
  if (value <= 7) return '高量級';
  if (value <= 10) return '過量級';
  return '危險級';
}

export function parseWeekly(json, town, now) {
  const loc = findTown(json, town);
  if (!loc) throw new TownNotFound(`找不到鄉鎮：${town}`);

  const s = Object.fromEntries(Object.entries(WEEKLY).map(([k, f]) => [k, intervalSeries(loc, f)]));
  const at = (k, t) => valueAt(s[k], t);

  const days = [];
  for (const w of s.weather) {
    const tp = toTaipei(w.start);
    let day = days.find(d => d.date === tp.dateKey);
    if (!day) {
      day = { date: tp.dateKey, label: dayLabel(tp.dateKey, toTaipei(now).dateKey), day: null, night: null };
      days.push(day);
    }
    const t = w.start;
    day[tp.hour >= 6 && tp.hour < 18 ? 'day' : 'night'] = {
      start: isoTaipei(w.start), end: isoTaipei(w.end),
      weather: str(w.value), weatherCode: str(at('weatherCode', t)),
      maxT: num(at('maxT', t)), minT: num(at('minT', t)),
      maxAT: num(at('maxAT', t)), minAT: num(at('minAT', t)),
      pop: num(at('pop', t)), humidity: num(at('humidity', t)),
      beaufort: num(at('beaufort', t)), windDirection: str(at('windDirection', t)),
      uv: num(at('uv', t)), uvLevel: str(at('uvLevel', t)),
    };
  }
  days.splice(7);

  let uv = null;
  const todayKey = toTaipei(now).dateKey;
  for (const d of days) {
    if (d.day && d.day.uv !== null) {
      uv = {
        value: d.day.uv,
        level: d.day.uvLevel ?? uvLevelText(d.day.uv),
        label: d.date === todayKey ? '紫外線' : '明天紫外線',
      };
      break;
    }
  }
  return { days, uv };
}
