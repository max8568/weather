import { DATASETS } from './datasets.js';
import { HttpError } from './cwa.js';
import { isoTaipei, toTaipei } from './time.js';
import { parseCounty36h } from './parse/county36h.js';
import { parseThreeDay, TownNotFound } from './parse/threeDay.js';
import { parseWeekly } from './parse/weekly.js';
import { pickObservations } from './parse/observation.js';
import { parseSun } from './parse/sun.js';

export async function buildForecast({ county, town, now, cwa }) {
  const ds = Object.hasOwn(DATASETS, county) ? DATASETS[county] : null;
  if (!ds) throw new HttpError(400, '未知的縣市');

  const q = v => encodeURIComponent(v);
  const today = toTaipei(now).dateKey;
  const ids = {
    county36h: 'F-C0032-001', threeDay: ds.threeDay, weekly: ds.weekly,
    observation: 'O-A0001-001', sun: 'A-B0062-001',
  };

  const [r36, r3, rw, ro, rs] = await Promise.allSettled([
    cwa.get(ids.county36h, `locationName=${q(county)}`, 1800),
    cwa.get(ids.threeDay, `LocationName=${q(town)}`, 1800),
    cwa.get(ids.weekly, `LocationName=${q(town)}`, 1800),
    cwa.get(ids.observation, '', 600),
    cwa.get(ids.sun, `CountyName=${q(county)}&Date=${today}`, 86400),
  ]);

  const out = {};
  const sources = {};
  const fail = (name, err) => {
    console.error(`${ids[name]} 失敗: ${err?.message ?? err}`);
    out[name] = null;
    sources[name] = { ok: false };
  };
  const section = (name, result, parse, townIs400 = false) => {
    if (result.status === 'rejected') return fail(name, result.reason);
    try {
      out[name] = parse(result.value);
      sources[name] = { ok: true };
    } catch (err) {
      if (townIs400 && err instanceof TownNotFound) throw new HttpError(400, '未知的鄉鎮');
      fail(name, err);
    }
  };

  section('county36h', r36, j => parseCounty36h(j, county, now));
  section('threeDay', r3, j => parseThreeDay(j, town, now), true);
  section('weekly', rw, j => parseWeekly(j, town, now));
  const { lat, lon } = out.threeDay ?? { lat: null, lon: null };
  section('observation', ro, j => pickObservations(j, { lat, lon, county, town }));
  section('sun', rs, j => parseSun(j, county));

  if (Object.values(out).every(v => v === null)) throw new HttpError(502, '氣象署資料暫時無法取得');

  return {
    county, town, generatedAt: isoTaipei(now), sources,
    county36h: out.county36h, threeDay: out.threeDay, weekly: out.weekly,
    observation: out.observation, sun: out.sun,
  };
}
