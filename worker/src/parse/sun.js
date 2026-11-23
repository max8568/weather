import { SUN } from '../fields.js';

const hhmm = v => {
  const m = typeof v === 'string' ? /^([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/.exec(v.trim()) : null;
  return m ? `${m[1].padStart(2, '0')}:${m[2]}` : null;
};

const validDate = v => {
  const m = typeof v === 'string' ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(v) : null;
  if (!m) return false;
  const [y, mo, d] = m.slice(1).map(Number);
  const t = new Date(Date.UTC(y, mo - 1, d));
  return t.getUTCFullYear() === y && t.getUTCMonth() === mo - 1 && t.getUTCDate() === d;
};

export function parseSun(json, county) {
  const loc = json?.records?.locations?.location?.find(l => l[SUN.county] === county);
  const day = loc?.time?.[0];
  const date = day?.[SUN.date];
  const sunrise = hhmm(day?.[SUN.sunrise]), sunset = hhmm(day?.[SUN.sunset]);
  if (!validDate(date) || !sunrise || !sunset) throw new Error(`找不到日出日落資料：${county}`);
  return { date, sunrise, sunset };
}
