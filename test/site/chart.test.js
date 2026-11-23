import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scalePoints, smoothPath, stepPath, stepSegments, smoothSegments, bandSegments, niceTicks } from '../../site/js/chart.js';

// d 字串裡每一段 C 的六個數字
const curves = (d) => [...d.matchAll(/C([^C]+)/g)].map((m) => m[1].trim().split(/\s+/).map(Number));

test('stepPath', () => assert.equal(stepPath([[0, 10], [10, 20]], 20), 'M0 10 H10 V20 H20'));
test('stepPath with more points', () => {
  assert.equal(stepPath([[0, 10], [10, 20], [30, 5]], 40), 'M0 10 H10 V20 H30 V5 H40');
  assert.equal(stepPath([], 40), '');
});

const STEP_SCALE = { xs: [0, 10, 20], endX: 30, height: 100, min: 0, max: 100, padTop: 0, padBottom: 0 };
test('stepSegments breaks the line and the fill at a missing slot', () => {
  const s = stepSegments([20, null, 70], STEP_SCALE);
  assert.equal(s.line, 'M0 80 H10 M20 30 H30');
  assert.equal(s.area, 'M0 80 H10 V100 H0 Z M20 30 H30 V100 H20 Z');
});
test('stepSegments without gaps is one stepPath', () => {
  const s = stepSegments([20, 50, 70], STEP_SCALE);
  assert.equal(s.line, 'M0 80 H10 V50 H20 V30 H30');
  assert.equal(s.area, 'M0 80 H10 V50 H20 V30 H30 V100 H0 Z');
});
test('stepSegments with leading, trailing and only missing slots', () => {
  assert.equal(stepSegments([null, 50, null], STEP_SCALE).line, 'M10 50 H20');
  assert.deepEqual(stepSegments([null, null, null], STEP_SCALE), { line: '', area: '' });
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

const SMOOTH_SCALE = { xs: [0, 10, 20, 30, 40], height: 100, min: 0, max: 100, padTop: 0, padBottom: 0 };
test('smoothSegments starts a new line and fill after a missing value', () => {
  const s = smoothSegments([20, 30, null, 70, 60], SMOOTH_SCALE);
  const a = smoothPath([[0, 80], [10, 70]]), b = smoothPath([[30, 30], [40, 40]]);
  assert.equal(s.line, `${a} ${b}`);
  assert.equal(s.area, `${a} L10 100 L0 100 Z ${b} L40 100 L30 100 Z`);
  assert.ok(!s.line.includes(' C20 '), 'nothing is drawn at the missing slot');
});
test('smoothSegments without gaps is one smoothPath closed to the bottom', () => {
  const s = smoothSegments([20, 30, 50, 70, 60], SMOOTH_SCALE);
  const d = smoothPath([[0, 80], [10, 70], [20, 50], [30, 30], [40, 40]]);
  assert.equal(s.line, d);
  assert.equal(s.area, `${d} L40 100 L0 100 Z`);
  assert.deepEqual(smoothSegments([null, null], { ...SMOOTH_SCALE, xs: [0, 10] }), { line: '', area: '' });
});
test('bandSegments fills between two lines only where both have values', () => {
  const hi = [30, 40, null, 50, 60], lo = [10, 20, 25, null, null];
  const d = bandSegments(hi, lo, SMOOTH_SCALE);
  const top = smoothPath([[0, 70], [10, 60]]), bottom = smoothPath([[10, 80], [0, 90]]).replace('M', 'L');
  assert.equal(d, `${top} ${bottom} Z`);
  assert.equal(bandSegments([30, 40], [10, 20], { ...SMOOTH_SCALE, xs: [0, 10] }), d);
});
