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

function fileName(key, night) {
  const [dayFile, nightFile] = FILES[key] || FILES.cloudy;
  return night && nightFile ? nightFile : dayFile;
}

export function iconUrl(key, { night = false, style = 'fill' } = {}) {
  return `icons/weather/${style}/${fileName(key, night)}.svg`;
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
export function captionMargin(key, { night = false } = {}) {
  const pull = (DRAWN_BOTTOM[fileName(key, night)] + 7 - 64) / 64;
  return Math.min(0, Math.round(pull * 1000) / 10);
}
