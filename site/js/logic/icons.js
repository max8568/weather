// 天氣文字 → 圖示。規則依序比對，先符合的先用。
export function iconKey(weather) {
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
export function isNight(iso) {
  const h = Number(iso.slice(11, 13));
  return h < 6 || h >= 18;
}

const FILES = {
  clear: ['clear-day', 'clear-night'],
  'partly-cloudy': ['partly-cloudy-day', 'partly-cloudy-night'],
  cloudy: ['cloudy'], overcast: ['overcast'], rain: ['rain'],
  thunderstorm: ['thunderstorms-rain'], snow: ['snow'], fog: ['fog'],
};

export function iconUrl(key, { night = false, style = 'fill' } = {}) {
  const [dayFile, nightFile] = FILES[key] || FILES.cloudy;
  return `icons/weather/${style}/${night && nightFile ? nightFile : dayFile}.svg`;
}
