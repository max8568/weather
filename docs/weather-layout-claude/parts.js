// 10 種排版共用的小工具。刻意只放格式化和圖示，排法留給各排版自己決定。
(function () {
  const svg = (d) => `<svg class="ui" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
  // 路徑照 site/js/render/ui-icons.js
  const sleeves = 'M9 4L5.5 6l-3 11 2.5 1 2-6.5V20h10v-8.5l2 6.5 2.5-1-3-11L15 4';
  const clothesline = 'M3 7h18M8.5 5v4.5M15.5 5v4.5M6 17v-5a2.5 2.5 0 0 1 5 0v5zM13 17v-5a2.5 2.5 0 0 1 5 0v5z';
  const UI = {
    'short-sleeve': 'M8 4c1 1.5 2.3 2 4 2s3-.5 4-2l4 3-2 3-2-1v11H8V9l-2 1-2-3z',
    'long-sleeve': `${sleeves}M9 4c.7 1.3 1.7 2 3 2s2.3-.7 3-2M3 15.3l2.4 1.2M21 15.3l-2.4 1.2M7 18h10`,
    'light-jacket': `${sleeves}M9 4l3 6 3-6M12 10v10`,
    umbrella: 'M12 10V5a1.5 1.5 0 0 1 3 0v.5M8.5 10h7l-1.2 10.1a1 1 0 0 1-1 .9h-2.6a1 1 0 0 1-1-.9z',
    laundry: clothesline,
    'no-laundry': `${clothesline}M5 20L19 4`,
    wind: 'M3 9h10.5a2.5 2.5 0 1 0-2.5-2.5M3 13h15.5a2.5 2.5 0 1 1-2.5 2.5M3 17h8',
    'chevron-right': 'M9 6l6 6-6 6',
  };

  // 溫度的固定色階：18° 以下是藍色（越冷越深），18° 以上是紅色（越熱越深）。
  // 16° 到 20° 之間由淺藍漸變到淺紅，18° 剛好落在中間的淺灰紫色，藍紅之間沒有硬切的邊。
  // 顏色都偏淺（最深的兩端相對亮度也有 0.2 以上），溫度條不會太搶眼。
  const SCALE = [[0, '#5f84ba'], [16, '#8cc1f2'], [20, '#f3aa94'], [40, '#ca6360']];
  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const tempColor = (t) => {
    const v = Math.min(40, Math.max(0, t));
    const k = SCALE.findIndex(([at], i) => i && v <= at);
    const [a0, c0] = SCALE[k - 1], [a1, c1] = SCALE[k];
    const f = (v - a0) / (a1 - a0), x = rgb(c0), y = rgb(c1);
    return `#${x.map((n, i) => Math.round(n + (y[i] - n) * f).toString(16).padStart(2, '0')).join('')}`;
  };
  // 一天最低溫到最高溫那一段的漸層：兩端和中間經過的色階點都標上顏色
  const tempGradient = (min, max) => {
    const pts = [min, ...SCALE.map(([at]) => at).filter((at) => at > min && at < max), max];
    const at = (t) => (max === min ? 0 : ((t - min) / (max - min)) * 100);
    return `linear-gradient(90deg, ${pts.map((t, i) => `${tempColor(t)} ${i === pts.length - 1 ? 100 : +at(t).toFixed(2)}%`).join(', ')})`;
  };

  window.P = {
    icon: (name, alt = '', cls = '') =>
      `<img class="wx ${cls}" src="../../site/icons/weather/fill/${name}.svg" alt="${alt}" width="48" height="48">`,
    deg: (v) => `${Math.round(v)}°`,
    pct: (v) => `${v}%`,
    ui: (key) => svg(UI[key]),
    md: (date) => `${Number(date.slice(5, 7))}/${Number(date.slice(8, 10))}`,
    hh: (time) => time.slice(11, 16),
    // 實測值旁邊的說明，每一種排版都要放
    obsNote: (w) => `實測・${w.obs.station}測站 ${w.obs.time}`,
    tempColor,
    tempGradient,
  };
  window.LAYOUTS = [];
})();
