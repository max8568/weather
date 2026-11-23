import { OBS } from '../fields.js';
import { num, str } from './series.js';
import { parseCwaTime, isoTaipei } from '../time.js';

const DIRS = ['北風', '東北風', '東風', '東南風', '南風', '西南風', '西風', '西北風'];
export const degreesToText = deg => DIRS[Math.round(deg / 45) % 8];

const get = (o, path) => path.split('.').reduce((v, k) => v?.[k], o);

function wgs84(st) {
  const c = get(st, OBS.coords)?.find?.(x => x?.CoordinateName === 'WGS84');
  const lat = num(c?.StationLatitude), lon = num(c?.StationLongitude);
  return lat === null || lon === null ? null : { lat, lon };
}

function haversineKm(a, b) {
  const r = Math.PI / 180;
  const dLat = (b.lat - a.lat) * r, dLon = (b.lon - a.lon) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

function candidates(stations, { lat, lon, county, town }) {
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    return stations
      .map(st => { const c = wgs84(st); return { st, d: c ? haversineKm({ lat, lon }, c) : Infinity }; })
      .sort((a, b) => a.d - b.d)
      .map(x => x.st);
  }
  const inCounty = stations.filter(st => get(st, OBS.county) === county);
  return [...inCounty.filter(st => get(st, OBS.town) === town), ...inCounty.filter(st => get(st, OBS.town) !== town)];
}

const ELEMENTS = {
  temperature: v => num(v),
  humidity: v => num(v),
  windDirection: v => { const n = num(v); return n === null ? null : degreesToText(n); },
  windSpeed: v => num(v),
  pressure: v => num(v),
  rainToday: v => num(v),
};

export function pickObservations(json, where = {}) {
  const list = candidates(json?.records?.Station ?? [], where);
  const result = {};
  for (const [key, convert] of Object.entries(ELEMENTS)) {
    result[key] = null;
    for (const st of list) {
      const value = convert(get(st, OBS[key]));
      if (value === null) continue;
      const t = str(get(st, OBS.time));
      result[key] = { value, station: get(st, OBS.name), time: t ? isoTaipei(parseCwaTime(t)) : null };
      break;
    }
  }
  const first = result.temperature ?? Object.values(result).find(Boolean) ?? null;
  return { time: first?.time ?? null, ...result };
}
