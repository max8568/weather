import { SUN } from '../fields.js';
import { str } from './series.js';

export function parseSun(json, county) {
  const loc = json?.records?.locations?.location?.find(l => l[SUN.county] === county);
  const day = loc?.time?.[0];
  const sunrise = str(day?.[SUN.sunrise]), sunset = str(day?.[SUN.sunset]);
  if (!loc || !day || !sunrise || !sunset) throw new Error(`找不到日出日落資料：${county}`);
  return { date: day[SUN.date], sunrise, sunset };
}
