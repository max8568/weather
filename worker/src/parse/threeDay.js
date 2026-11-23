import { THREE_DAY, TOWN_COORDS } from '../fields.js';
import { isoTaipei } from '../time.js';
import { num, str, findTown, pointSeries, intervalSeries, valueAt } from './series.js';

export class TownNotFound extends Error {}

// 最後一個時間 <= t 的點（風速等 3 小時一筆的資料，在那 3 小時內都沿用）
function pointAt(points, t) {
  let v;
  for (const p of points) if (p.time <= t) v = p.value;
  return v;
}

export function parseThreeDay(json, town, now) {
  const loc = findTown(json, town);
  if (!loc) throw new TownNotFound(`找不到鄉鎮：${town}`);

  const temps = pointSeries(loc, THREE_DAY.temperature);
  const apparent = pointSeries(loc, THREE_DAY.apparent);
  const humidity = pointSeries(loc, THREE_DAY.humidity);
  const comfort = pointSeries(loc, THREE_DAY.comfort);
  const beaufort = pointSeries(loc, THREE_DAY.beaufort);
  const windDir = pointSeries(loc, THREE_DAY.windDirection);
  const pop = intervalSeries(loc, THREE_DAY.pop);
  const weather = intervalSeries(loc, THREE_DAY.weather);
  const weatherCode = intervalSeries(loc, THREE_DAY.weatherCode);

  let start = -1;
  temps.forEach((p, i) => { if (p.time <= now) start = i; });
  const slots = start < 0 ? temps : temps.slice(start);

  const hourly = slots.map(({ time, value }) => ({
    time: isoTaipei(time),
    temperature: num(value),
    apparentTemperature: num(pointAt(apparent, time)),
    humidity: num(pointAt(humidity, time)),
    beaufort: num(pointAt(beaufort, time)),
    windDirection: str(pointAt(windDir, time)),
    comfort: str(pointAt(comfort, time)),
    weather: str(valueAt(weather, time)),
    weatherCode: str(valueAt(weatherCode, time)),
    pop: num(valueAt(pop, time)),
  }));

  const limit = now.getTime() + 24 * 3600e3;
  const next = slots.filter(s => s.time.getTime() < limit).map(s => num(s.value)).filter(v => v !== null);

  return {
    lat: num(loc[TOWN_COORDS.lat]),
    lon: num(loc[TOWN_COORDS.lon]),
    current: {
      weather: str(valueAt(weather, now) ?? weather[0]?.value),
      weatherCode: str(valueAt(weatherCode, now) ?? weatherCode[0]?.value),
      pop: num(valueAt(pop, now) ?? pop[0]?.value),
      apparentTemperature: hourly[0]?.apparentTemperature ?? null,
    },
    next24h: next.length ? { max: Math.max(...next), min: Math.min(...next) } : { max: null, min: null },
    hourly,
  };
}
