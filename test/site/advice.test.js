import { test } from 'node:test';
import assert from 'node:assert/strict';
import { adviceItems } from '../../site/js/logic/advice.js';

const L = a => adviceItems(a).map(i => i.label);
test('ref 0002 daytime card', () => assert.deepEqual(L({maxT:26, minT:18, pop:20, weather:'多雲時晴', night:false}), ['短袖', '適合曬衣']));
test('ref 0010 evening card', () => assert.deepEqual(L({maxT:22, minT:20, pop:70, weather:'短暫陣雨', night:true}), ['短袖', '薄外套', '帶雨傘', '不適合曬衣']));
test('ref 0010 tomorrow card', () => assert.deepEqual(L({maxT:20, minT:18, pop:100, weather:'陣雨', night:false}), ['長袖', '帶雨傘', '不適合曬衣']));
test('clothing boundaries', () => {
  const c = t => L({maxT:t, minT:null, pop:null, weather:'多雲', night:false});
  assert.deepEqual(c(22), ['短袖']); assert.deepEqual(c(21), ['長袖']); assert.deepEqual(c(16), ['長袖']);
  assert.deepEqual(c(15), ['厚外套']); assert.deepEqual(c(null), []);
});
test('light jacket boundaries', () => {
  const j = (minT, night) => L({maxT:24, minT, pop:null, weather:'多雲', night}).includes('薄外套');
  assert.equal(j(20, true), true); assert.equal(j(21, true), false);
  assert.equal(j(16, false), true); assert.equal(j(17, false), false);
  assert.equal(j(null, true), false);
});
test('no light jacket with heavy coat', () => assert.deepEqual(L({maxT:12, minT:8, pop:null, weather:'陰', night:true}), ['厚外套']));
test('umbrella at 50%', () => {
  const u = pop => L({maxT:null, minT:null, pop, weather:'多雲', night:false}).includes('帶雨傘');
  assert.equal(u(50), true); assert.equal(u(49), false);
});
test('laundry vs no-laundry', () => {
  const w = (pop, weather) => L({maxT:null, minT:null, pop, weather, night:false});
  assert.deepEqual(w(20, '多雲'), ['適合曬衣']); assert.deepEqual(w(21, '多雲'), ['不適合曬衣']);
  assert.deepEqual(w(20, '多雲短暫雨'), ['不適合曬衣']);
});
test('null pop gives no umbrella and no laundry item', () => assert.deepEqual(L({maxT:null, minT:null, pop:null, weather:'雨', night:false}), []));
test('keys', () => assert.deepEqual(adviceItems({maxT:22, minT:20, pop:70, weather:'雨', night:true}).map(i => i.key), ['short-sleeve', 'light-jacket', 'umbrella', 'no-laundry']));
