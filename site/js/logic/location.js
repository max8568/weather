export const DEFAULT_LOCATION = { county: '臺北市', town: '中正區' };

// saved 來自 localStorage，可能是任何東西；縣市或鄉鎮不在清單裡就回預設值。
export function resolveLocation(saved, towns) {
  if (saved && typeof saved === 'object') {
    const entry = towns.find((c) => c.county === saved.county);
    if (entry && entry.towns.includes(saved.town)) return { county: saved.county, town: saved.town };
  }
  return { ...DEFAULT_LOCATION };
}

// 縣市清單必須是非空陣列，每筆是 {county: 字串, towns: 非空的字串陣列}。
export function isTownList(list) {
  return Array.isArray(list) && list.length > 0 && list.every((c) =>
    c && typeof c.county === 'string' && Array.isArray(c.towns) && c.towns.length > 0 && c.towns.every((t) => typeof t === 'string'));
}

// Worker 的 200 回應至少要有字串 county、town 和物件 sources。
export function isForecastBody(body) {
  return !!body && typeof body === 'object' && !Array.isArray(body)
    && typeof body.county === 'string' && typeof body.town === 'string'
    && !!body.sources && typeof body.sources === 'object';
}
