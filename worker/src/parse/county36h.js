import { parseCwaTime, isoTaipei, periodLabel } from '../time.js';
import { num, str } from './series.js';

// F-C0032-001：records.location[].weatherElement[].time[].parameter
export function parseCounty36h(json, county, now) {
  const loc = json?.records?.location?.find(l => l.locationName === county);
  if (!loc) throw new Error(`找不到縣市：${county}`);
  const el = name => loc.weatherElement?.find(e => e.elementName === name)?.time ?? [];
  const wx = el('Wx');
  if (wx.length !== 3) throw new Error(`${county} 的 36 小時預報有 ${wx.length} 個時段，預期 3 個`);
  // 已經結束的時段不用（例如 18:00 以後，今天白天那段），剩 1 到 3 個
  const open = wx.filter(t => parseCwaTime(t.endTime) > now);
  if (!open.length) throw new Error(`${county} 的 36 小時預報時段都已經結束`);
  // 其他欄位用起訖時間對到天氣現象的時段，對不到就是缺值
  const slot = t => `${parseCwaTime(t.startTime).getTime()}|${parseCwaTime(t.endTime).getTime()}`;
  const param = (name, t) => el(name).find(x => x && typeof x === 'object' && slot(x) === slot(t))?.parameter?.parameterName;
  return open.map(t => {
    const start = parseCwaTime(t.startTime);
    return {
      label: periodLabel(start, now),
      start: isoTaipei(start),
      end: isoTaipei(parseCwaTime(t.endTime)),
      weather: str(t.parameter?.parameterName),
      weatherCode: str(t.parameter?.parameterValue),
      pop: num(param('PoP', t)),
      minT: num(param('MinT', t)),
      maxT: num(param('MaxT', t)),
      comfort: str(param('CI', t)),
    };
  });
}
