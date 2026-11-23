import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tempBar, daylightFraction, weekSummary, dayRow, hourLabel, hhmm, weekdayChar, coversWholeDay, SHOW_WEEK_POP_AT } from '../../site/js/logic/format.js';

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
