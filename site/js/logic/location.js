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

// 鄉鎮經緯度清單必須是非空陣列，每筆是 {county: 字串, town: 字串, lat: 數字, lon: 數字}。
export function isTownCoordList(list) {
  return Array.isArray(list) && list.length > 0 && list.every((p) =>
    p && typeof p.county === 'string' && typeof p.town === 'string' && Number.isFinite(p.lat) && Number.isFinite(p.lon));
}

// 最大的山地鄉，鄉內有些地方離鄉公所三、四十公里；超過 50 公里就當作人不在台灣。
const MAX_KM = 50;

// 找離手機位置最近的鄉鎮點。台灣範圍小，經度乘上 cos(緯度) 後當平面算距離就夠準。
export function nearestTown(list, pos) {
  const kx = 111.32 * Math.cos(pos.lat * Math.PI / 180), ky = 110.57;
  let best = null, bestKm = Infinity;
  for (const p of list) {
    const km = Math.hypot((p.lon - pos.lon) * kx, (p.lat - pos.lat) * ky);
    if (km < bestKm) { best = p; bestKm = km; }
  }
  return best && bestKm <= MAX_KM ? { county: best.county, town: best.town } : null;
}

// 「使用目前位置」：向瀏覽器要位置，再找最近的鄉鎮。getPosition 失敗時丟的是瀏覽器的 GeolocationPositionError，
// code 1 是使用者不允許。這裡丟出的 Error 訊息會直接顯示在選地點的面板上。
export async function locateTown(getPosition, loadCoords) {
  let pos, list;
  try { pos = await getPosition(); } catch (err) {
    throw new Error(err?.code === 1
      ? '沒有取得位置權限。請到瀏覽器或手機的設定裡允許這個網站使用位置，或從下面選擇地點。'
      : '暫時無法取得目前位置，請再試一次，或從下面選擇地點。');
  }
  try { list = await loadCoords(); } catch { list = null; }
  if (!isTownCoordList(list)) throw new Error('無法載入鄉鎮位置資料，請再試一次，或從下面選擇地點。');
  const town = nearestTown(list, { lat: pos.coords.latitude, lon: pos.coords.longitude });
  if (!town) throw new Error('目前位置不在台灣，請從下面選擇地點。');
  return town;
}
