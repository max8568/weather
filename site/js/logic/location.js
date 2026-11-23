export const DEFAULT_LOCATION = { county: '臺北市', town: '中正區' };

// saved 來自 localStorage，可能是任何東西；縣市或鄉鎮不在清單裡就回預設值。
export function resolveLocation(saved, towns) {
  if (saved && typeof saved === 'object') {
    const entry = towns.find((c) => c.county === saved.county);
    if (entry && entry.towns.includes(saved.town)) return { county: saved.county, town: saved.town };
  }
  return { ...DEFAULT_LOCATION };
}
