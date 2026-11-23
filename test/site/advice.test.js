import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adviceItems } from '../../site/js/logic/advice.js';

test('clothing boundaries', () => {
  const k = t => adviceItems({maxT:t, pop:30, weather:'多雲'}).map(i => i.label);
  assert.deepEqual(k(26), ['短袖']); assert.deepEqual(k(25), ['薄長袖']); assert.deepEqual(k(20), ['薄長袖']);
  assert.deepEqual(k(19), ['外套']); assert.deepEqual(k(15), ['外套']); assert.deepEqual(k(14), ['厚外套']);
  assert.deepEqual(k(null), []);
});
test('clothing keys', () => {
  const k = t => adviceItems({maxT:t, pop:30, weather:'多雲'})[0].key;
  assert.deepEqual([26, 22, 17, 10].map(k), ['short-sleeve', 'light-long-sleeve', 'jacket', 'heavy-coat']);
});
test('umbrella at 50%', () => {
  const has = p => adviceItems({maxT:null, pop:p, weather:'多雲'}).some(i => i.key === 'umbrella' && i.label === '帶傘');
  assert.equal(has(50), true); assert.equal(has(49), false);
});
test('laundry only when pop <= 20 and no rain', () => {
  const has = (p, w) => adviceItems({maxT:null, pop:p, weather:w}).some(i => i.key === 'laundry' && i.label === '適合曬衣');
  assert.equal(has(20, '多雲'), true); assert.equal(has(20, '多雲短暫雨'), false); assert.equal(has(21, '多雲'), false);
});
test('null pop gives neither umbrella nor laundry', () => {
  assert.deepEqual(adviceItems({maxT:27, pop:null, weather:'晴'}).map(i => i.key), ['short-sleeve']);
});
