// 5. 圖表優先：最上面是 72 小時的氣溫折線和降雨長條（上下兩張圖，共用時間軸），數字放在圖下面。
// 灰底的時段是日落到日出。手指或滑鼠移到圖上，會顯示那個小時的數字。
(function () {
  const { icon, deg, pct, ui, md, hh, obsNote } = window.P;
  const STEP = 16, PAD = 14;
  const T_TOP = 34, T_H = 128, R_TOP = 196, R_H = 52, AXIS_Y = 268, H = 280;
  const START = Date.UTC(2026, 10, 23, 17);
  const xAt = (hoursFromStart) => PAD + hoursFromStart * STEP + STEP / 2;
  const hoursOf = (iso) => (Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10), +iso.slice(11, 13), +iso.slice(14, 16)) - START) / 3600000;
  const WEEKDAY = '日一二三四五六';

  function chart(w) {
    const hs = w.hourly;
    const W = PAD * 2 + hs.length * STEP;
    const temps = hs.map((h) => h.temp);
    const tMax = Math.max(...temps) + 2, tMin = Math.min(...temps) - 1;
    const yT = (t) => T_TOP + ((tMax - t) / (tMax - tMin)) * T_H;
    const yR = (p) => R_TOP + R_H - (p / 100) * R_H;
    const x = (i) => xAt(i);

    // 日落到日出的灰底
    const nights = ['2026-11-23', '2026-11-24', '2026-11-25'].map((d, i) => {
      const next = `2026-11-${24 + i}`;
      const a = Math.max(PAD, xAt(hoursOf(`${d}T${w.sun.set}`)) - STEP / 2);
      const b = Math.min(W - PAD, xAt(hoursOf(`${next}T${w.sun.rise}`)) - STEP / 2);
      return `<rect class="night" x="${a.toFixed(1)}" y="${T_TOP - 10}" width="${(b - a).toFixed(1)}" height="${R_TOP + R_H - T_TOP + 10}"/>`;
    }).join('');

    // 午夜的分隔線和日期
    const days = hs.map((h, i) => [h, i]).filter(([h]) => h.time.endsWith('T00:00')).map(([h, i]) => {
      const d = new Date(`${h.time.slice(0, 10)}T00:00Z`);
      const xx = x(i) - STEP / 2;
      return `<line class="midnight" x1="${xx}" x2="${xx}" y1="10" y2="${R_TOP + R_H}"/><text class="day" x="${xx + 6}" y="18">${md(h.time)} 週${WEEKDAY[d.getUTCDay()]}</text>`;
    }).join('');

    const line = hs.map((h, i) => `${i ? 'L' : 'M'}${x(i)} ${yT(h.temp).toFixed(1)}`).join('');
    const area = `${line}L${x(hs.length - 1)} ${T_TOP + T_H}L${x(0)} ${T_TOP + T_H}Z`;

    // 每 24 小時標一次最高、最低點。用日曆日分組的話，午夜前後的兩個點會擠在一起。
    const groups = [0, 24, 48].map((s) => hs.slice(s, s + 24).map((_, k) => s + k));
    const marks = groups.flatMap((g) => {
      const hi = g.reduce((a, b) => (hs[b].temp > hs[a].temp ? b : a));
      const lo = g.reduce((a, b) => (hs[b].temp < hs[a].temp ? b : a));
      return [[hi, 'hi'], [lo, 'lo']];
    }).map(([i, k]) => `<circle class="pt ${k}" cx="${x(i)}" cy="${yT(hs[i].temp).toFixed(1)}" r="4"/>
      <text class="val" x="${x(i)}" y="${(yT(hs[i].temp) + (k === 'hi' ? -10 : 20)).toFixed(1)}">${deg(hs[i].temp)}</text>`).join('');

    const bars = hs.map((h, i) => {
      const top = yR(h.pop), hgt = R_TOP + R_H - top;
      return hgt > 0 ? `<path class="bar" d="M${x(i) - 6} ${R_TOP + R_H}V${(top + 2).toFixed(1)}q0-2 2-2h8q2 0 2 2V${R_TOP + R_H}Z"/>` : '';
    }).join('');
    // 降雨機率改變的地方才標數字
    const popLabels = hs.map((h, i) => (i === 0 || h.pop !== hs[i - 1].pop
      ? `<text class="val small" x="${x(i) - 6}" y="${(yR(h.pop) - 5).toFixed(1)}" text-anchor="start">${pct(h.pop)}</text>` : '')).join('');

    const ticks = hs.map((h, i) => (i % 3 === 0 ? `<text class="tick" x="${x(i)}" y="${AXIS_Y}">${hh(h.time)}</text>` : '')).join('');

    return `<svg class="plot" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="72 小時氣溫和降雨機率圖，氣溫 ${Math.min(...temps)} 到 ${Math.max(...temps)} 度。每小時的數字在圖下方的逐時表格。">
      ${nights}${days}
      <line class="base" x1="${PAD}" x2="${W - PAD}" y1="${T_TOP + T_H}" y2="${T_TOP + T_H}"/>
      <line class="base" x1="${PAD}" x2="${W - PAD}" y1="${R_TOP + R_H}" y2="${R_TOP + R_H}"/>
      <path class="area" d="${area}"/><path class="temp-line" d="${line}"/>${marks}
      ${bars}${popLabels}${ticks}
      <line class="cross" y1="${T_TOP - 10}" y2="${R_TOP + R_H}" x1="-10" x2="-10"/>
      <circle class="cross-pt" r="5" cx="-10" cy="-10"/>
    </svg>`;
  }

  function render(w) {
    const lo = Math.min(...w.week.map((d) => d.min)), hi = Math.max(...w.week.map((d) => d.max));
    const at = (v) => ((v - lo) / (hi - lo)) * 100;
    const byDay = {};
    w.hourly.forEach((h) => (byDay[h.time.slice(0, 10)] ||= []).push(h));

    return `<header class="head">
        <div><h1>${w.town}<span>${w.county}</span></h1><p>${obsNote(w)}</p></div>
        <p class="now">${icon(w.now.icon, '')}<strong>${deg(w.obs.temp)}</strong><span>${w.now.weather}</span></p>
      </header>
      <section class="card">
        <h2>未來 72 小時</h2>
        <p class="hint">灰底是日落到日出。左右滑動看後面的時間，點圖上任一處看那個小時的數字。</p>
        <div class="scroll hscroll" tabindex="0" role="region" aria-label="72 小時圖表，可以左右捲動" data-own-keys>
          <div class="labels" aria-hidden="true"><span class="lt">氣溫</span><span class="lr">降雨機率</span></div>
          ${chart(w)}
          <div class="tip" hidden></div>
        </div>
      </section>
      <dl class="stats">
        <div><dt>未來 24 小時</dt><dd>${deg(w.next24h.min)}–${deg(w.next24h.max)}</dd></div>
        <div><dt>降雨機率</dt><dd>${pct(w.now.pop)}</dd></div>
        <div><dt>體感溫度</dt><dd>${deg(w.now.feels)}</dd></div>
        <div><dt>紫外線</dt><dd>${w.now.uv.value}<small>${w.now.uv.level}</small></dd></div>
      </dl>
      <details class="table">
        <summary>逐時數字（72 小時）</summary>
        ${Object.entries(byDay).map(([date, list]) => `<table><caption>${md(date)}</caption>
          <thead><tr><th scope="col">時間</th><th scope="col">天氣</th><th scope="col">氣溫</th><th scope="col">降雨機率</th></tr></thead>
          <tbody>${list.map((h) => `<tr><th scope="row">${hh(h.time)}</th><td>${h.weather}</td><td>${deg(h.temp)}</td><td>${pct(h.pop)}</td></tr>`).join('')}</tbody></table>`).join('')}
      </details>
      <section class="block"><h2>7 日預報<span>最低溫到最高溫</span></h2>
        <ul class="range">${w.week.map((d) => `<li><span class="rd">${d.label}</span>${icon(d.icon, d.weather)}<span class="rp">${pct(d.pop)}</span>
          <span class="rt"><i style="left:${at(d.min)}%;right:${100 - at(d.max)}%"><b>${deg(d.min)}</b><b>${deg(d.max)}</b></i></span></li>`).join('')}</ul>
      </section>
      <section class="block"><h2>生活建議</h2>
        ${w.advice.map((a) => `<div class="adv"><p><strong>${a.label}</strong>${a.from}–${a.to}</p>
          <p>${a.weather}　${deg(a.min)}–${deg(a.max)}　降雨 ${pct(a.pop)}　${a.comfort}</p>
          <ul>${a.items.map((it) => `<li>${ui(it.key)}${it.label}</li>`).join('')}</ul></div>`).join('')}
      </section>
      <section class="block obs"><h2>${obsNote(w)}</h2>
        <dl><div><dt>風</dt><dd>${w.obs.windDir} ${w.obs.windSpeed} m/s</dd></div><div><dt>濕度</dt><dd>${w.obs.humidity}%</dd></div>
          <div><dt>氣壓</dt><dd>${w.obs.pressure} hPa</dd></div><div><dt>今日累積雨量</dt><dd>${w.obs.rainToday} mm</dd></div>
          <div><dt>日出</dt><dd>${w.sun.rise}</dd></div><div><dt>日落</dt><dd>${w.sun.set}</dd></div></dl>
      </section>`;
  }

  function mount(root, w) {
    const scroll = root.querySelector('.scroll');
    const svg = scroll.querySelector('svg');
    const tip = scroll.querySelector('.tip');
    const cross = svg.querySelector('.cross');
    const dot = svg.querySelector('.cross-pt');
    const temps = w.hourly.map((h) => h.temp);
    const tMax = Math.max(...temps) + 2, tMin = Math.min(...temps) - 1;
    const show = (clientX) => {
      const box = svg.getBoundingClientRect();
      const i = Math.max(0, Math.min(w.hourly.length - 1, Math.floor((clientX - box.left - PAD) / STEP)));
      const h = w.hourly[i];
      const xx = xAt(i);
      cross.setAttribute('x1', xx);
      cross.setAttribute('x2', xx);
      dot.setAttribute('cx', xx);
      dot.setAttribute('cy', (T_TOP + ((tMax - h.temp) / (tMax - tMin)) * T_H).toFixed(1));
      tip.hidden = false;
      tip.innerHTML = `<b>${md(h.time)} ${hh(h.time)}</b>${h.weather}<br>氣溫 ${deg(h.temp)}　降雨 ${pct(h.pop)}`;
      const left = Math.min(Math.max(xx, scroll.scrollLeft + 80), scroll.scrollLeft + scroll.clientWidth - 80);
      tip.style.left = `${left}px`;
    };
    svg.addEventListener('pointermove', (e) => show(e.clientX));
    svg.addEventListener('pointerdown', (e) => show(e.clientX));
    svg.addEventListener('pointerleave', (e) => {
      if (e.pointerType !== 'mouse') return;
      tip.hidden = true;
      cross.setAttribute('x1', -10);
      cross.setAttribute('x2', -10);
      dot.setAttribute('cx', -10);
    });
  }

  window.LAYOUTS.push({ key: 'chart', name: '圖表優先', render, mount });
})();
