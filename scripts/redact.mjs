// 把 JSON 裡出現授權碼的地方（欄位名稱和字串值，含網址裡夾帶的）換成 REDACTED
export function redact(v, key) {
  if (typeof v === 'string') return v.split(key).join('REDACTED');
  if (Array.isArray(v)) return v.map((x) => redact(x, key));
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [redact(k, key), redact(x, key)]));
  }
  return v;
}
