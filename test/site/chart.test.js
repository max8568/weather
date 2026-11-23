import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scalePoints, smoothPath, stepPath, niceTicks } from '../../site/js/chart.js';

// d 字串裡每一段 C 的六個數字
const curves = (d) => [...d.matchAll(/C([^C]+)/g)].map((m) => m[1].trim().split(/\s+/).map(Number));

test('stepPath', () => assert.equal(stepPath([[0, 10], [10, 20]], 20), 'M0 10 H10 V20 H20'));
test('stepPath with more points', () => {
  assert.equal(stepPath([[0, 10], [10, 20], [30, 5]], 40), 'M0 10 H10 V20 H30 V5 H40');
  assert.equal(stepPath([], 40), '');
});

test('smoothPath passes through every point', () => {
  const pts = [[0, 50], [10, 20], [20, 20], [30, 40]];
  const d = smoothPath(pts);
  assert.ok(d.startsWith('M0 50'));
  for (const [x, y] of pts.slice(1)) assert.ok(d.includes(`${x} ${y}`), `${x} ${y}`);
});
test('smoothPath does not overshoot on a flat segment', () => {
  const segs = curves(smoothPath([[0, 50], [10, 20], [20, 20], [30, 40]]));
  assert.equal(segs.length, 3);
  const [, c1y, , c2y, x, y] = segs[1];
  assert.deepEqual([x, y], [20, 20]);
  assert.equal(c1y, 20);
  assert.equal(c2y, 20);
});
test('smoothPath control points stay between their end points', () => {
  const pts = [[0, 0], [10, 100], [20, 101], [30, 200], [40, 150]];
  const segs = curves(smoothPath(pts));
  assert.equal(segs.length, pts.length - 1);
  segs.forEach(([, c1y, , c2y], k) => {
    const lo = Math.min(pts[k][1], pts[k + 1][1]), hi = Math.max(pts[k][1], pts[k + 1][1]);
    for (const c of [c1y, c2y]) assert.ok(c >= lo && c <= hi, `segment ${k}: ${c} not in [${lo}, ${hi}]`);
  });
});
test('smoothPath format and short inputs', () => {
  assert.equal(smoothPath([]), '');
  assert.equal(smoothPath([[1, 2]]), 'M1 2');
  assert.equal(smoothPath([[0, 0], [10, 10]]), 'M0 0 C3.33 3.33 6.67 6.67 10 10');
});

test('scalePoints maps min to bottom and max to top', () => {
  assert.deepEqual(scalePoints([10, 15, 20], { width: 100, height: 50, min: 10, max: 20 }), [[0, 42], [50, 25], [100, 8]]);
  assert.deepEqual(scalePoints([10, 20], { width: 10, height: 50, min: 10, max: 20, padTop: 0, padBottom: 0 }), [[0, 50], [10, 0]]);
});
test('scalePoints skips nulls', () => {
  assert.deepEqual(scalePoints([10, null, 20], { width: 100, height: 50, min: 10, max: 20 }), [[0, 42], [100, 8]]);
});
test('scalePoints takes x positions from xs when given', () => {
  assert.deepEqual(scalePoints([10, null, 20], { xs: [5, 21, 69], height: 50, min: 10, max: 20 }), [[5, 42], [69, 8]]);
});
test('scalePoints puts every point at the bottom when min equals max', () => {
  assert.deepEqual(scalePoints([3, 3], { width: 10, height: 20, min: 3, max: 3 }), [[0, 12], [10, 12]]);
});

test('niceTicks picks the smallest step that fits', () => {
  assert.deepEqual(niceTicks(16, 27), [15, 18, 21, 24, 27]);
  assert.deepEqual(niceTicks(0, 5), [0, 1, 2, 3, 4, 5]);
  assert.deepEqual(niceTicks(59, 96), [50, 60, 70, 80, 90, 100]);
  assert.deepEqual(niceTicks(16, 27, 3), [15, 20, 25, 30]);
  assert.deepEqual(niceTicks(20, 20), [20, 21]);
});
