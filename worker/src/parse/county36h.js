import { parseCwaTime, isoTaipei, periodLabel } from '../time.js';
import { num, str } from './series.js';

// F-C0032-001：records.location[].weatherElement[].time[].parameter
export function parseCounty36h(json, county, now) {
  const loc = json?.records?.location?.find(l => l.locationName === county);
  if (!loc) throw new Error(`找不到縣市：${county}`);
  const el = name => loc.weatherElement.find(e => e.elementName === name)?.time ?? [];
  const wx = el('Wx'), pop = el('PoP'), minT = el('MinT'), maxT = el('MaxT'), ci = el('CI');
  return wx.map((t, i) => {
    const start = parseCwaTime(t.startTime);
    return {
      label: periodLabel(start, now),
      start: isoTaipei(start),
      end: isoTaipei(parseCwaTime(t.endTime)),
      weather: str(t.parameter?.parameterName),
      weatherCode: str(t.parameter?.parameterValue),
      pop: num(pop[i]?.parameter?.parameterName),
      minT: num(minT[i]?.parameter?.parameterName),
      maxT: num(maxT[i]?.parameter?.parameterName),
      comfort: str(ci[i]?.parameter?.parameterName),
    };
  });
}
