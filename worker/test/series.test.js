import test from 'node:test';
import assert from 'node:assert/strict';
import { num, str, findTown, pointSeries, intervalSeries, valueAt } from '../src/parse/series.js';

const loc = {
  LocationName: '五股區',
  WeatherElement: [
    { ElementName: '溫度', Time: [
      { DataTime: '2026-11-23T10:00:00+08:00', ElementValue: [{ Temperature: '22' }] },
      { DataTime: '2026-11-23T11:00:00+08:00', ElementValue: [{ Temperature: '-99' }] },
    ] },
    { ElementName: '天氣現象', Time: [
      { StartTime: '2026-11-23T06:00:00+08:00', EndTime: '2026-11-23T18:00:00+08:00', ElementValue: [{ Weather: '晴' }] },
      { StartTime: '2026-11-23T18:00:00+08:00', EndTime: '2026-11-24T06:00:00+08:00', ElementValue: [{ Weather: '陰' }] },
    ] },
  ],
};

test('num treats -99 and -998 as missing', () => {
  assert.equal(num('-99'), null);
  assert.equal(num('-998.0'), null);
  assert.equal(num('22.5'), 22.5);
  assert.equal(num('abc'), null);
  assert.equal(num(undefined), null);
  assert.equal(num(null), null);
  assert.equal(num(''), null);
  assert.equal(num('0'), 0);
});
test('str treats undefined, empty and -99 as missing', () => {
  assert.equal(str(undefined), null);
  assert.equal(str(''), null);
  assert.equal(str('-99'), null);
  assert.equal(str('晴'), '晴');
});
test('findTown', () => {
  const json = { records: { Locations: [{ Location: [loc] }] } };
  assert.equal(findTown(json, '五股區'), loc);
  assert.equal(findTown(json, '不存在'), null);
  assert.equal(findTown({}, '五股區'), null);
});
test('pointSeries uses DataTime and keeps raw values', () => {
  const s = pointSeries(loc, ['溫度', 'Temperature']);
  assert.equal(s.length, 2);
  assert.equal(s[0].time.toISOString(), '2026-11-23T02:00:00.000Z');
  assert.equal(s[0].value, '22');
  assert.equal(s[1].value, '-99');
  assert.deepEqual(pointSeries(loc, ['沒有', 'X']), []);
});
test('valueAt picks interval containing t, end exclusive', () => {
  const iv = intervalSeries(loc, ['天氣現象', 'Weather']);
  assert.equal(iv.length, 2);
  const t = s => new Date(s);
  assert.equal(valueAt(iv, t('2026-11-23T06:00:00+08:00')), '晴');
  assert.equal(valueAt(iv, t('2026-11-23T17:59:59+08:00')), '晴');
  assert.equal(valueAt(iv, t('2026-11-23T18:00:00+08:00')), '陰');
  assert.equal(valueAt(iv, t('2026-11-24T06:00:00+08:00')), undefined);
  assert.equal(valueAt(iv, t('2026-11-23T05:59:59+08:00')), undefined);
});

test('num and str reject wrong input types', () => {
  assert.equal(num(false), null);
  assert.equal(num(true), null);
  assert.equal(num([]), null);
  assert.equal(num({}), null);
  assert.equal(num(' '), null);
  assert.equal(num(22), 22);
  assert.equal(num(-99), null);
  assert.equal(str(false), null);
  assert.equal(str(0), null);
  assert.equal(str([]), null);
});
