// 手寫的 SVG 圖表。上半部是算路徑的純函式（有測試），下半部 renderChart 把它們畫出來。

const r = (v) => Number(v.toFixed(2));

// 數值換成座標：min 在底部、max 在頂部，null 的點略過。
// 橫座標預設是把 width 平均分給每個點；有傳 xs 的話直接用 xs[i]
// （72 小時圖的資料前段每小時一筆、後段每 3 小時一筆，橫座標要照時間算）。min 等於 max 時全部放在底部。
export function scalePoints(values, { width = 0, height, min, max, padTop = 8, padBottom = 8, xs } = {}) {
  const inner = height - padTop - padBottom;
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  const out = [];
  values.forEach((v, i) => {
    if (typeof v !== 'number') return;
    const ratio = max === min ? 0 : (v - min) / (max - min);
    out.push([xs ? xs[i] : i * step, height - padBottom - ratio * inner]);
  });
  return out;
}

// Fritsch–Carlson 單調三次插值：曲線經過每個點，兩點之間不會超出這兩點的高低範圍。
export function smoothPath(points) {
  const n = points.length;
  if (!n) return '';
  let d = `M${r(points[0][0])} ${r(points[0][1])}`;
  if (n === 1) return d;
  const dx = [], s = [];
  for (let k = 0; k < n - 1; k++) {
    dx[k] = points[k + 1][0] - points[k][0];
    s[k] = (points[k + 1][1] - points[k][1]) / dx[k];
  }
  const m = [s[0]];
  for (let k = 1; k < n - 1; k++) m[k] = s[k - 1] * s[k] <= 0 ? 0 : (s[k - 1] + s[k]) / 2;
  m[n - 1] = s[n - 2];
  for (let k = 0; k < n - 1; k++) {
    if (s[k] === 0) { m[k] = 0; m[k + 1] = 0; continue; }
    const a = m[k] / s[k], b = m[k + 1] / s[k], len = a * a + b * b;
    if (len > 9) {
      const t = 3 / Math.sqrt(len);
      m[k] = t * a * s[k];
      m[k + 1] = t * b * s[k];
    }
  }
  for (let k = 0; k < n - 1; k++) {
    const [xa, ya] = points[k], [xb, yb] = points[k + 1], h = dx[k] / 3;
    d += ` C${r(xa + h)} ${r(ya + m[k] * h)} ${r(xb - h)} ${r(yb - m[k + 1] * h)} ${r(xb)} ${r(yb)}`;
  }
  return d;
}

// 階梯線：每個值一直維持到下一個點，最後一個值畫到 endX。
export function stepPath(points, endX) {
  if (!points.length) return '';
  let d = `M${r(points[0][0])} ${r(points[0][1])}`;
  for (const [x, y] of points.slice(1)) d += ` H${r(x)} V${r(y)}`;
  return `${d} H${r(endX)}`;
}

// 有缺值的階梯圖：連續有值的時段各畫一段，每段畫到下一個時段的起點（最後一段畫到 endX）。
// 缺值的時段沒有線、也沒有填色，跟上方顯示的「--」一致。其餘參數和 scalePoints 一樣，xs 必填。
export function stepSegments(values, { xs, endX, ...scale }) {
  const bottom = r(scalePoints([scale.min], { ...scale, xs: [0] })[0][1]);
  const lines = [], areas = [];
  let start = 0;
  for (let i = 0; i <= values.length; i++) {
    if (i < values.length && typeof values[i] === 'number') continue;
    if (i > start) {
      const pts = scalePoints(values.slice(start, i), { ...scale, xs: xs.slice(start, i) });
      const line = stepPath(pts, i < values.length ? xs[i] : endX);
      lines.push(line);
      areas.push(`${line} V${bottom} H${r(pts[0][0])} Z`);
    }
    start = i + 1;
  }
  return { line: lines.join(' '), area: areas.join(' ') };
}

// 連續有值的索引範圍 [start, end)。缺值的位置把資料切成好幾段。
function numberRuns(values) {
  const runs = [];
  let start = -1;
  values.forEach((v, i) => {
    if (typeof v === 'number') { if (start < 0) start = i; }
    else if (start >= 0) { runs.push([start, i]); start = -1; }
  });
  if (start >= 0) runs.push([start, values.length]);
  return runs;
}

// 有缺值的平滑曲線：連續有值的部分各畫一段，各自往下填色到底部；缺值的地方不畫線也不填色，
// 跟上方顯示的「--」一致。其餘參數和 scalePoints 一樣，xs 必填。
export function smoothSegments(values, { xs, ...scale }) {
  const bottom = r(scalePoints([scale.min], { ...scale, xs: [0] })[0][1]);
  const lines = [], areas = [];
  for (const [a, b] of numberRuns(values)) {
    const pts = scalePoints(values.slice(a, b), { ...scale, xs: xs.slice(a, b) });
    const line = smoothPath(pts);
    lines.push(line);
    areas.push(`${line} L${r(pts[pts.length - 1][0])} ${bottom} L${r(pts[0][0])} ${bottom} Z`);
  }
  return { line: lines.join(' '), area: areas.join(' ') };
}

// 兩條平滑曲線（7 日面板的最高溫、最低溫）中間的填色：兩邊都有值的連續區段各填一塊。
export function bandSegments(hi, lo, { xs, ...scale }) {
  const both = hi.map((v, i) => (typeof v === 'number' && typeof lo[i] === 'number' ? v : null));
  return numberRuns(both).map(([a, b]) => {
    const part = { ...scale, xs: xs.slice(a, b) };
    const top = smoothPath(scalePoints(hi.slice(a, b), part));
    const bottom = smoothPath(scalePoints(lo.slice(a, b), part).reverse()).replace('M', 'L');
    return `${top} ${bottom} Z`;
  }).join(' ');
}

const STEPS = [1, 2, 3, 5, 10, 20, 25, 50, 100];

// 刻度：從小到大試間隔，取第一個能讓格數不超過 maxIntervals 的。
export function niceTicks(lo, hi, maxIntervals = 5) {
  for (const step of STEPS) {
    const a = Math.floor(lo / step) * step;
    let b = Math.ceil(hi / step) * step;
    if (b === a) b = a + step;
    if ((b - a) / step <= maxIntervals || step === STEPS[STEPS.length - 1]) {
      const ticks = [];
      for (let v = a; v <= b; v += step) ticks.push(v);
      return ticks;
    }
  }
}

const NS = 'http://www.w3.org/2000/svg';
function svgEl(tag, attrs = {}, style = {}) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  Object.assign(e.style, style);
  return e;
}

export const PAD_X = 12;      // 第一個點和最後一個點離圖邊的距離，選中時的圓點才不會被切掉
const LABEL_H = 26;           // 底下時間文字的高度
const PAD_TOP = 16;
const PAD_BOTTOM = 2;
const HOLD_MS = 300;          // 手指按住多久開始選時刻
const HOLD_SLOP = 8;          // 按住期間手指可以晃動的距離（px），超過就當成滑動
let uid = 0;

// 畫一張圖到 container。values 和 xs、xLabels 一一對應；xLabels 空字串的位置不寫字。
// fill 是線下方漸層的上、下兩個顏色。y 軸刻度放在右邊，橫向捲動時固定在畫面右側。
export function renderChart(container, {
  values, xs, xLabels = [], min, max, yTicks = [], unit = '', kind = 'line',
  color = 'currentColor', fill = ['transparent', 'transparent'], height = 150, onSelect,
}) {
  xs = xs || values.map((_, i) => PAD_X + i * 16);
  const width = (xs.length ? xs[xs.length - 1] : 0) + PAD_X;
  const plotH = height - LABEL_H;
  const scale = { height: plotH, min, max, padTop: PAD_TOP, padBottom: PAD_BOTTOM, xs };
  const yOf = (v) => scalePoints([v], { ...scale, xs: [0] })[0][1];
  const top = yOf(max), bottom = yOf(min);

  const svg = svgEl('svg', { width, height, viewBox: `0 0 ${width} ${height}`, 'aria-hidden': 'true' });
  const id = `chart-fill-${++uid}`;
  const grad = svgEl('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 });
  grad.append(svgEl('stop', { offset: 0 }, { stopColor: fill[0] }), svgEl('stop', { offset: 1 }, { stopColor: fill[1] }));
  const defs = svgEl('defs');
  defs.append(grad);
  svg.append(defs);

  for (const t of yTicks) {
    const y = r(yOf(t));
    svg.append(svgEl('line', { class: 'grid', x1: 0, x2: width, y1: y, y2: y }));
  }
  xLabels.forEach((label, i) => {
    if (!label) return;
    svg.append(svgEl('line', { class: 'grid dash', x1: xs[i], x2: xs[i], y1: r(top), y2: r(bottom) }));
    const text = svgEl('text', { class: 'x-label', x: xs[i], y: height - 6, 'text-anchor': xs[i] < 30 ? 'start' : 'middle' });
    text.textContent = label;
    svg.append(text);
  });

  const pts = scalePoints(values, scale);
  if (pts.length) {
    let line, area;
    if (kind === 'step') ({ line, area } = stepSegments(values, { ...scale, endX: width }));
    else ({ line, area } = smoothSegments(values, scale));
    svg.append(svgEl('path', { d: area, fill: `url(#${id})` }));
    svg.append(svgEl('path', { d: line, fill: 'none', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, { stroke: color }));
  }
  const dot = svgEl('g');
  svg.append(dot);

  const axis = document.createElement('div');
  axis.className = 'chart-y';
  for (const t of yTicks) {
    const label = document.createElement('span');
    label.textContent = `${t}${unit}`;
    label.style.top = `${r(yOf(t))}px`;
    axis.append(label);
  }

  const wrap = document.createElement('div');
  wrap.className = 'chart';
  wrap.append(svg, axis);
  container.replaceChildren(wrap);

  let current = -1;
  function select(i) {
    current = i;
    dot.replaceChildren();
    const v = values[i];
    if (typeof v !== 'number') return;
    const cx = xs[i], cy = r(yOf(v));
    if (kind === 'line') dot.append(svgEl('circle', { cx, cy, r: 13, 'fill-opacity': 0.15 }, { fill: color }));
    dot.append(svgEl('circle', { cx, cy, r: kind === 'line' ? 6 : 4.5 }, { fill: color }));
  }

  function pick(clientX) {
    const x = clientX - svg.getBoundingClientRect().left;
    let best = 0;
    xs.forEach((v, i) => { if (Math.abs(v - x) < Math.abs(xs[best] - x)) best = i; });
    if (best === current) return;
    select(best);
    if (onSelect) onSelect(best);
  }
  // 點一下選那個時刻；滑鼠或觸控筆按住拖動時一路跟著選。
  svg.addEventListener('click', (e) => pick(e.clientX));
  svg.addEventListener('pointermove', (e) => { if (e.pointerType !== 'touch' && e.buttons & 1) pick(e.clientX); });

  // 手指：按住不動約 300ms 才開始選，之後到放開前左右移動都在選時刻，這段期間圖表和頁面都不捲動。
  // 沒按住就滑動，照常捲動圖表。要擋住捲動只能在 touchmove 呼叫 preventDefault，所以用 touch 事件。
  let hold = 0, scrubbing = false, startX = 0, startY = 0;
  const stopTouch = () => { clearTimeout(hold); hold = 0; scrubbing = false; };
  svg.addEventListener('touchstart', (e) => {
    stopTouch();
    if (e.touches.length !== 1) return;
    ({ clientX: startX, clientY: startY } = e.touches[0]);
    hold = setTimeout(() => { hold = 0; scrubbing = true; pick(startX); }, HOLD_MS);
  }, { passive: true });
  svg.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (scrubbing) {
      e.preventDefault();
      pick(t.clientX);
    } else if (hold && Math.hypot(t.clientX - startX, t.clientY - startY) > HOLD_SLOP) {
      stopTouch(); // 手指在 300ms 內就移動了，當成滑動
    }
  }, { passive: false });
  svg.addEventListener('touchend', stopTouch);
  svg.addEventListener('touchcancel', stopTouch);
  svg.addEventListener('contextmenu', (e) => { if (scrubbing) e.preventDefault(); });

  return { select };
}
