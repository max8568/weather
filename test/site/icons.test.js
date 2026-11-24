import { test } from 'node:test';
import assert from 'node:assert/strict';
import { iconKey, isNight, iconUrl, captionMargin } from '../../site/js/logic/icons.js';

const cases = { '晴':'clear', '晴時多雲':'partly-cloudy', '多雲時晴':'partly-cloudy', '多雲':'cloudy', '多雲時陰':'cloudy',
  '陰時多雲':'overcast', '陰':'overcast', '多雲短暫陣雨':'rain', '晴午後短暫雷陣雨':'thunderstorm', '晴有霧':'fog', '有雨或雪':'snow' };
test('iconKey', () => {
  for (const [w, k] of Object.entries(cases)) assert.equal(iconKey(w), k, w);
  assert.equal(iconKey(null), 'cloudy');
});
test('isNight reads the hour from the Taipei ISO string', () => {
  assert.equal(isNight('2026-11-23T05:59:00+08:00'), true);
  assert.equal(isNight('2026-11-23T06:00:00+08:00'), false);
  assert.equal(isNight('2026-11-23T17:59:00+08:00'), false);
  assert.equal(isNight('2026-11-23T18:00:00+08:00'), true);
});
test('iconUrl night variant', () => assert.equal(iconUrl('clear', {night:true}), 'icons/weather/fill/clear-night.svg'));
test('iconUrl file names and style', () => {
  assert.equal(iconUrl('clear'), 'icons/weather/fill/clear-day.svg');
  assert.equal(iconUrl('partly-cloudy', {night:true, style:'line'}), 'icons/weather/line/partly-cloudy-night.svg');
  assert.equal(iconUrl('thunderstorm'), 'icons/weather/fill/thunderstorms-rain.svg');
  assert.equal(iconUrl('rain', {night:true}), 'icons/weather/fill/rain.svg');
  for (const k of ['cloudy', 'overcast', 'snow', 'fog']) assert.equal(iconUrl(k), `icons/weather/fill/${k}.svg`);
});

// 溫度卡片右邊，天氣說明往上拉到圖示下方的距離（圖示寬度的 %）
test('weather caption under a cloud icon keeps the combo design pull-up of 18%', () => {
  assert.equal(captionMargin('cloudy'), -18);
  assert.equal(captionMargin('partly-cloudy', { night: true }), -18);
  assert.equal(captionMargin('overcast'), -18);
});

test('weather caption is not pulled up into rain drops, snowflakes or fog lines', () => {
  for (const key of ['rain', 'thunderstorm', 'snow', 'fog']) assert.equal(captionMargin(key), 0, key);
});

test('weather caption under the sun and moon is pulled up only as far as the rays and moon allow', () => {
  assert.equal(captionMargin('clear'), -1.6);
  assert.equal(captionMargin('clear', { night: true }), -12.5);
});
