import { parseCwaTime } from '../time.js';

// 缺值：氣象署用字串 "-99"（或更小的 -998 之類）表示。
export function num(v) {
  let n;
  if (typeof v === 'number') n = v;
  else if (typeof v === 'string' && v.trim() !== '') n = Number(v);
  else return null;
  return Number.isFinite(n) && n > -90 ? n : null;
}

export function str(v) {
  return typeof v === 'string' && v !== '' && v !== '-99' ? v : null;
}

export function findTown(json, town) {
  const list = json?.records?.Locations?.[0]?.Location;
  return list?.find(l => l.LocationName === town) ?? null;
}

function entries(loc, [el, key], build) {
  const e = loc?.WeatherElement?.find(x => x.ElementName === el);
  return (e?.Time ?? []).map(t => build(t, t.ElementValue?.[0]?.[key]));
}

export function pointSeries(loc, field) {
  return entries(loc, field, (t, value) => ({ time: parseCwaTime(t.DataTime), value }));
}

export function intervalSeries(loc, field) {
  return entries(loc, field, (t, value) => ({
    start: parseCwaTime(t.StartTime), end: parseCwaTime(t.EndTime), value,
  }));
}

export function valueAt(intervals, t) {
  return intervals.find(i => i.start <= t && t < i.end)?.value;
}
