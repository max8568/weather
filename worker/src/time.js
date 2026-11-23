// 所有日期和時段判斷都用台北時間（UTC+8，沒有夏令時間）。
// 做法：把時間往後挪 8 小時，只用 getUTC*()，不用本地時間 getter。

const OFFSET_MS = 8 * 3600e3;
const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];
const p2 = n => String(n).padStart(2, '0');

export function parseCwaTime(s) {
  const t = String(s).trim().replace(' ', 'T');
  return new Date(/(Z|[+-]\d{2}:?\d{2})$/.test(t) ? t : `${t}+08:00`);
}

export function toTaipei(d) {
  const t = new Date(d.getTime() + OFFSET_MS);
  const y = t.getUTCFullYear(), m = t.getUTCMonth() + 1, day = t.getUTCDate();
  return {
    dateKey: `${y}-${p2(m)}-${p2(day)}`, y, m, d: day,
    hour: t.getUTCHours(), minute: t.getUTCMinutes(), weekday: t.getUTCDay(),
  };
}

export function isoTaipei(d) {
  const t = new Date(d.getTime() + OFFSET_MS);
  return `${toTaipei(d).dateKey}T${p2(t.getUTCHours())}:${p2(t.getUTCMinutes())}:${p2(t.getUTCSeconds())}+08:00`;
}

export function addDays(dateKey, n) {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export function periodLabel(start, now) {
  const s = toTaipei(start);
  const today = toTaipei(now).dateKey;
  const part = s.hour < 6 ? '凌晨' : s.hour < 18 ? '白天' : '晚上';
  if (s.dateKey === today) return part === '晚上' ? '今晚明晨' : `今日${part}`;
  if (s.dateKey === addDays(today, 1)) return `明日${part}`;
  return `${s.m}/${s.d} ${part}`;
}

export function dayLabel(dateKey, todayKey) {
  if (dateKey === todayKey) return '今天';
  const [y, m, d] = dateKey.split('-').map(Number);
  return `週${WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()]}`;
}
