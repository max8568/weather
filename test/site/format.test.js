import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tempBar, daylightFraction, weekSummary, dayRow, hourLabel, hhmm, weekdayChar, coversWholeDay, dayExtremes, beaufortText, heroStations, SHOW_WEEK_POP_AT, tempColor, tempGradient, dateLabel, obsItems, obsTime, weekPopText, dataTimeParts } from '../../site/js/logic/format.js';

const half = (o) => ({ weather: '多雲', maxT: null, minT: null, maxAT: null, minAT: null, pop: null, humidity: null, uv: null, ...o });

test('tempBar', () => {
  const b = tempBar(17, 20, 14, 28); assert.equal(b.left.toFixed(2), '21.43'); assert.equal(b.width.toFixed(2), '21.43');
  assert.deepEqual(tempBar(20, 20, 20, 20), { left: 0, width: 100 });
});
test('daylightFraction clamps', () => {
  assert.equal(daylightFraction('05:00','06:16','17:04'), 0); assert.equal(daylightFraction('18:00','06:16','17:04'), 1);
  assert.equal(daylightFraction('11:40','06:16','17:04'), 0.5);
});
test('weekSummary ignores nulls', () => {
  const days = [
    { day: half({ maxAT: 28, minAT: 18, uv: 7, humidity: 70 }), night: half({ maxAT: 20, minAT: 15, uv: null, humidity: 81 }) },
    { day: null, night: half({ maxAT: 22, minAT: 14, humidity: null }) },
  ];
  assert.deepEqual(weekSummary(days), { maxAT: 28, minAT: 14, maxUV: 7, avgHumidity: 76 });
  assert.deepEqual(weekSummary([]), { maxAT: null, minAT: null, maxUV: null, avgHumidity: null });
});
test('dayRow combines both halves', () => {
  const d = { date: '2026-11-23', label: '今天',
    day: half({ weather: '晴', maxT: 25, minT: 19, maxAT: 26, minAT: 18, pop: 10, uv: 6 }),
    night: half({ weather: '多雲', maxT: 21, minT: 17, maxAT: 22, minAT: 16, pop: 30 }) };
  assert.deepEqual(dayRow(d), { min: 17, max: 25, pop: 30, uv: 6, minAT: 16, maxAT: 26, weather: '晴', night: false });
});
test('dayRow uses night half when day is missing', () => {
  const d = { date: '2026-11-23', label: '今天', day: null, night: half({ weather: '陰', maxT: 21, minT: 17, maxAT: 22, minAT: 16, pop: 30 }) };
  assert.deepEqual(dayRow(d), { min: 17, max: 21, pop: 30, uv: null, minAT: 16, maxAT: 22, weather: '陰', night: true });
});
test('dayRow handles missing night half', () => {
  const d = { date: '2026-11-29', label: '週日', day: half({ weather: '晴', maxT: 25, minT: 19, pop: null, uv: 5 }), night: null };
  assert.deepEqual(dayRow(d), { min: 19, max: 25, pop: null, uv: 5, minAT: null, maxAT: null, weather: '晴', night: false });
});
test('hourLabel and hhmm', () => {
  assert.equal(hourLabel('2026-11-23T09:00:00+08:00', 0), '現在'); assert.equal(hourLabel('2026-11-23T15:00:00+08:00', 3), '15時');
  assert.equal(hhmm('2026-11-23T09:27:00+08:00'), '09:27');
  assert.equal(hourLabel('2026-11-24T00:00:00+08:00', 5), '11/24');
  assert.equal(hourLabel('2026-12-01T00:00:00+08:00', 2), '12/01');
  assert.equal(hourLabel('2027-01-02T00:00:00+08:00', 4), '01/02');
  assert.equal(hourLabel('2026-11-24T00:00:00+08:00', 0), '現在');
  assert.equal(hourLabel('2026-11-24T03:00:00+08:00', 6), '03時');
});
test('SHOW_WEEK_POP_AT', () => assert.equal(SHOW_WEEK_POP_AT, 30));
test('weekdayChar reads the weekday from the date string', () => {
  assert.equal(weekdayChar('2026-11-23'), '一'); assert.equal(weekdayChar('2026-11-29'), '日');
  assert.equal(weekdayChar('2026-11-28'), '六'); assert.equal(weekdayChar('2026-12-01T00:00:00+08:00'), '二');
});
test('coversWholeDay: slots must start by 03:00 and end at 21:00 or later', () => {
  const at = (date, hours) => hours.map((h) => `${date}T${String(h).padStart(2, '0')}:00:00+08:00`);
  assert.equal(coversWholeDay(at('2026-11-25', [0, 3, 6, 9, 12, 15, 18, 21])), true);
  assert.equal(coversWholeDay(at('2026-11-24', Array.from({ length: 24 }, (_, h) => h))), true);
  assert.equal(coversWholeDay(at('2026-11-23', [23])), false);
  assert.equal(coversWholeDay(at('2026-11-27', [0, 3, 6, 9, 12, 15])), false);
  assert.equal(coversWholeDay(at('2026-11-26', [3, 6, 9, 12, 15, 18, 21])), true);
  assert.equal(coversWholeDay(at('2026-11-26', [4, 21])), false);
  assert.equal(coversWholeDay([]), false);
});

const slot = (date, hour, o) => ({ time: `${date}T${String(hour).padStart(2, '0')}:00:00+08:00`, temperature: null, apparentTemperature: null, humidity: null, beaufort: null, ...o });
const fullWeek = { days: [
  { date: '2026-11-24', label: '週二',
    day: half({ start: '2026-11-24T06:00:00+08:00', end: '2026-11-24T18:00:00+08:00', maxT: 20, minT: 18, maxAT: 21, minAT: 17, humidity: 84 }),
    night: half({ start: '2026-11-24T18:00:00+08:00', end: '2026-11-25T06:00:00+08:00', maxT: 18, minT: 16, maxAT: 17, minAT: 15, humidity: 74 }) },
] };
test('dayExtremes uses the weekly daily extremes when the day has both halves', () => {
  const hourly = [slot('2026-11-24', 21, { temperature: 19, apparentTemperature: 19, humidity: 80 }), slot('2026-11-24', 23, { temperature: 18, apparentTemperature: 18, humidity: 82 })];
  assert.deepEqual(dayExtremes('2026-11-24', hourly, fullWeek, 'temperature'), { min: 16, max: 20, partial: false });
  assert.deepEqual(dayExtremes('2026-11-24', hourly, fullWeek, 'apparentTemperature'), { min: 15, max: 21, partial: false });
});
test('dayExtremes keeps the hourly rule for beaufort and humidity', () => {
  const hourly = [slot('2026-11-24', 21, { humidity: 80 }), slot('2026-11-24', 23, { humidity: 82 })];
  assert.deepEqual(dayExtremes('2026-11-24', hourly, fullWeek, 'humidity'), { min: 80, max: 82, partial: true });
});
test('dayExtremes falls back to hourly slots, marked partial, when weekly has only the night half', () => {
  const week = { days: [{ date: '2026-11-23', label: '今天', day: null, night: half({ maxT: 22, minT: 20, maxAT: 24, minAT: 21 }) }] };
  const hourly = [slot('2026-11-23', 23, { temperature: 21 }), slot('2026-11-24', 0, { temperature: 20 })];
  assert.deepEqual(dayExtremes('2026-11-23', hourly, week, 'temperature'), { min: 21, max: 21, partial: true });
});
test('dayExtremes falls back to hourly slots when weekly is null', () => {
  const hourly = [0, 3, 6, 9, 12, 15, 18, 21].map((hr, i) => slot('2026-11-25', hr, { temperature: 16 + i }));
  assert.deepEqual(dayExtremes('2026-11-25', hourly, null, 'temperature'), { min: 16, max: 23, partial: false });
  assert.deepEqual(dayExtremes('2026-11-26', hourly, null, 'temperature'), { min: null, max: null, partial: true });
});
test('dayExtremes widens the weekly range to include every hourly value of that date', () => {
  // 11/24 00:00 逐時 21°，比一週預報的最高 20° 還高；23:00 的 15° 比一週預報的最低 16° 還低
  const hourly = [slot('2026-11-24', 0, { temperature: 21 }), slot('2026-11-24', 12, { temperature: 19 }), slot('2026-11-24', 23, { temperature: 15 }), slot('2026-11-25', 0, { temperature: 30 })];
  assert.deepEqual(dayExtremes('2026-11-24', hourly, fullWeek, 'temperature'), { min: 15, max: 21, partial: false });
  // 一週預報缺值時只用逐時的；兩邊都缺就是 null
  const noT = { maxT: null, minT: null };
  const noTemps = { days: [{ ...fullWeek.days[0], day: { ...fullWeek.days[0].day, ...noT }, night: { ...fullWeek.days[0].night, ...noT } }] };
  assert.deepEqual(dayExtremes('2026-11-24', hourly, noTemps, 'temperature'), { min: 15, max: 21, partial: false });
  assert.deepEqual(dayExtremes('2026-11-24', [], noTemps, 'temperature'), { min: null, max: null, partial: true });
});

test('dayExtremes: a 12:00-18:00 day half is not a whole day, so the hourly rule applies', () => {
  const week = { days: [{ date: '2026-11-24', label: '週二',
    day: half({ start: '2026-11-24T12:00:00+08:00', end: '2026-11-24T18:00:00+08:00', maxT: 20, minT: 18, maxAT: 21, minAT: 17 }),
    night: half({ start: '2026-11-24T18:00:00+08:00', end: '2026-11-25T06:00:00+08:00', maxT: 18, minT: 16, maxAT: 17, minAT: 15 }) }] };
  const hourly = [slot('2026-11-24', 12, { temperature: 19 }), slot('2026-11-24', 15, { temperature: 19.5 }), slot('2026-11-24', 23, { temperature: 17 })];
  assert.deepEqual(dayExtremes('2026-11-24', hourly, week, 'temperature'), { min: 17, max: 19.5, partial: true });
});
test('dayExtremes: a night half ending before 06:00 next day is not a whole day', () => {
  const week = { days: [{ ...fullWeek.days[0], night: { ...fullWeek.days[0].night, end: '2026-11-25T00:00:00+08:00' } }] };
  const hourly = [slot('2026-11-24', 21, { temperature: 19 })];
  assert.deepEqual(dayExtremes('2026-11-24', hourly, week, 'temperature'), { min: 19, max: 19, partial: true });
});
test('dayExtremes: both halves but missing extrema keep the partial label', () => {
  const week = { days: [{ ...fullWeek.days[0], night: { ...fullWeek.days[0].night, minT: null } }] };
  const hourly = [slot('2026-11-24', 21, { temperature: 19 }), slot('2026-11-24', 23, { temperature: 18 })];
  assert.deepEqual(dayExtremes('2026-11-24', hourly, week, 'temperature'), { min: 18, max: 19, partial: true });
  // 體感溫度要的欄位都有，照樣用一週預報的整天數值
  assert.deepEqual(dayExtremes('2026-11-24', hourly, week, 'apparentTemperature'), { min: 15, max: 21, partial: false });
});

test('beaufortText: 1 is shown as ≤1 級 (CWA reports 0-1 as "<= 1")', () => {
  assert.equal(beaufortText(1), '≤1 級');
  assert.equal(beaufortText(3), '3 級');
  assert.equal(beaufortText(0), '0 級');
  assert.equal(beaufortText(null), '--');
  assert.equal(beaufortText(undefined), '--');
});

const obsAt = (station) => ({ value: 1, station, time: '2026-11-23T11:00:00+08:00' });
test('heroStations: one station when all hero readings share it, grouped by station otherwise', () => {
  assert.equal(heroStations({ temperature: obsAt('五股'), windDirection: obsAt('五股'), humidity: obsAt('五股') }), '五股測站');
  assert.equal(heroStations({ temperature: obsAt('五股'), windDirection: obsAt('五股'), humidity: obsAt('新莊') }), '溫度、風向 五股測站・濕度 新莊測站');
  assert.equal(heroStations({ temperature: obsAt('五股'), windDirection: obsAt('泰山'), humidity: obsAt('新莊') }), '溫度 五股測站・風向 泰山測站・濕度 新莊測站');
  assert.equal(heroStations({ temperature: null, windDirection: obsAt('泰山'), humidity: obsAt('泰山') }), '泰山測站');
  assert.equal(heroStations({ temperature: null, windDirection: null, humidity: null }), '');
  assert.equal(heroStations(null), '');
});

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const lum = (hex) => { const [r, g, b] = rgb(hex).map((c) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };

test('tempColor: blue up to 15°, red from 21°, light everywhere', () => {
  for (const t of [0, 8, 15]) { const [r, , b] = rgb(tempColor(t)); assert.ok(b > r, `${t}`); }
  for (const t of [21, 30, 40]) { const [r, , b] = rgb(tempColor(t)); assert.ok(r > b, `${t}`); }
  for (let t = 0; t <= 40; t++) assert.ok(lum(tempColor(t)) >= 0.2, `${t} ${tempColor(t)}`);
  assert.equal(tempColor(-5), tempColor(0)); assert.equal(tempColor(45), tempColor(40));
});
test('tempGradient: every stop is that temperature on the scale', () => {
  for (const [min, max] of [[19, 24], [17, 20], [16, 21], [10, 30]]) {
    const stops = tempGradient(min, max).match(/linear-gradient\(90deg, (.*)\)/)[1].split(', ').map((x) => x.split(' '));
    assert.equal(stops[0][1], '0%'); assert.equal(stops.at(-1)[1], '100%');
    for (const [color, at] of stops) {
      const want = rgb(tempColor(min + (parseFloat(at) / 100) * (max - min)));
      rgb(color).forEach((c, k) => assert.ok(Math.abs(c - want[k]) <= 1, `${min}-${max} ${at}`));
    }
  }
  assert.match(tempGradient(16, 21), /#f3aa94 80%/);
});
test('dateLabel', () => {
  assert.equal(dateLabel('2026-11-23T16:10:00+08:00'), '11 月 23 日・星期一');
  assert.equal(dateLabel('2026-12-01T06:00:00+08:00'), '12 月 1 日・星期二');
  assert.equal(dateLabel('2027-01-01T00:30:00+08:00'), '1 月 1 日・星期五');
});
test('obsItems: each item keeps its own station; missing values show -- with no station', () => {
  const o = (value, station) => ({ value, station, time: '2026-11-23T16:00:00+08:00' });
  const items = obsItems({ time: '2026-11-23T16:00:00+08:00', humidity: o(68, '臺北'), windSpeed: o(2.5, '五股'),
    windDirection: o('東北風', '五股'), pressure: o(null, '臺北'), rainToday: null });
  assert.deepEqual(items.map((x) => x.label), ['濕度', '風速', '風向', '氣壓', '今天累積雨量']);
  assert.deepEqual(items[0], { label: '濕度', value: '68', unit: '%', station: '臺北', time: '16:00' });
  assert.deepEqual(items[1], { label: '風速', value: '2.5', unit: 'm/s', station: '五股', time: '16:00' });
  assert.deepEqual(items[2], { label: '風向', value: '東北風', unit: '', station: '五股', time: '16:00' });
  assert.deepEqual(items[3], { label: '氣壓', value: '--', unit: '', station: '', time: '' });
  assert.deepEqual(items[4], { label: '今天累積雨量', value: '--', unit: '', station: '', time: '' });
  assert.ok(obsItems(null).every((x) => x.value === '--' && x.station === ''));
});

test('obsTime: one shared time when every shown reading has it, empty when the readings differ', () => {
  const at = (value, time) => ({ value, station: '臺北', time });
  const same = obsItems({ humidity: at(68, '2026-11-23T11:00:00+08:00'), windSpeed: at(2.5, '2026-11-23T11:00:00+08:00') });
  assert.equal(obsTime(same), '11:00');
  // Worker 的混合測站測試：濕度 11:00、風速 10:50，不能都標成同一個時間
  const mixed = obsItems({ humidity: at(68, '2026-11-23T11:00:00+08:00'), windSpeed: at(2.5, '2026-11-23T10:50:00+08:00') });
  assert.equal(obsTime(mixed), '');
  assert.equal(obsTime(obsItems(null)), '');
});

test('weekPopText: 30% and up is shown, below 30% is blank, missing is --', () => {
  assert.equal(weekPopText(70), '70%');
  assert.equal(weekPopText(30), '30%');
  assert.equal(weekPopText(20), '');
  assert.equal(weekPopText(0), '');
  assert.equal(weekPopText(null), '--');
  assert.equal(weekPopText(undefined), '--');
});

test('dataTimeParts: each station group is its own part, so the footer can wrap between them', () => {
  const obs = { time: '2026-11-23T10:50:00+08:00', temperature: obsAt('五股'), windDirection: obsAt('泰山'), humidity: obsAt('新莊') };
  assert.deepEqual(dataTimeParts({ observation: obs, generatedAt: '2026-11-23T11:05:00+08:00' }),
    ['溫度 五股測站', '風向 泰山測站', '濕度 新莊測站', '觀測時間 10:50', '上次更新 11:05']);
  assert.deepEqual(dataTimeParts({ observation: null, generatedAt: '2026-11-23T11:05:00+08:00' }), ['上次更新 11:05']);
});
