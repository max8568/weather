// 7. 24 小時圓盤：一圈是一天，12 點鐘方向是 00:00，順時針走。
// 外圈的點是每小時氣溫（越熱顏色越深），內圈的藍色弧是降雨機率（越可能下雨越深），淺藍扇形是日出到日落。
// 指針指在現在；從指針順時針走一圈，就是接下來 24 小時。
(function () {
  const { icon, deg, pct, ui, md, hh, obsNote } = window.P;
  const C = 170, R_LBL = 154, R_DOT = 136, R_RAIN = 117, R_DAY = 104, R_NUM = 88;
  const hoursOfDay = (hhmm) => Number(hhmm.slice(0, 2)) + Number(hhmm.slice(3, 5)) / 60;
  const pt = (h, r) => {
    const a = ((h / 24) * 360 - 90) * (Math.PI / 180);
    return [(C + r * Math.cos(a)).toFixed(1), (C + r * Math.sin(a)).toFixed(1)];
  };

  function dial(w) {
    const hs = w.hourly.slice(0, 24);
    const temps = hs.map((h) => h.temp);
    const lo = Math.min(...temps), hi = Math.max(...temps);
    const hourOf = (h) => Number(h.time.slice(11, 13));

    const rise = hoursOfDay(w.sun.rise), set = hoursOfDay(w.sun.set);
    const [rx, ry] = pt(rise, R_DAY), [sx, sy] = pt(set, R_DAY);
    const dayWedge = `<path class="day" d="M${C} ${C}L${rx} ${ry}A${R_DAY} ${R_DAY} 0 ${set - rise > 12 ? 1 : 0} 1 ${sx} ${sy}Z"/>`;

    const rain = hs.map((h) => {
      const s = hourOf(h);
      const [x1, y1] = pt(s + 0.04, R_RAIN), [x2, y2] = pt(s + 0.96, R_RAIN);
      return `<path class="rain" style="stroke-opacity:${(0.12 + (h.pop / 100) * 0.88).toFixed(2)}" d="M${x1} ${y1}A${R_RAIN} ${R_RAIN} 0 0 1 ${x2} ${y2}"/>`;
    }).join('');

    const dots = hs.map((h, i) => {
      const [x, y] = pt(hourOf(h) + 0.5, R_DOT);
      const k = (h.temp - lo) / (hi - lo || 1);
      return `<circle class="dot" data-i="${i}" cx="${x}" cy="${y}" r="6" style="fill-opacity:${(0.25 + k * 0.75).toFixed(2)}"/>`;
    }).join('');

    const labels = hs.filter((_, i) => i % 3 === 0).map((h) => {
      const [x, y] = pt(hourOf(h) + 0.5, R_LBL);
      return `<text class="t" x="${x}" y="${y}">${deg(h.temp)}</text>`;
    }).join('');

    const nums = [0, 6, 12, 18].map((n) => {
      const [x, y] = pt(n, R_NUM);
      return `<text class="n" x="${x}" y="${y}">${n} 時</text>`;
    }).join('');

    const nowH = hoursOfDay(w.obs.time);
    // 指針從中間文字的外圍開始畫，才不會穿過溫度
    const [h0x, h0y] = pt(nowH, 62);
    const [hx, hy] = pt(nowH, R_RAIN + 12);
    const [tx, ty] = pt(nowH, R_DAY - 2);
    const sunTicks = [rise, set].map((h) => { const [a, b] = pt(h, R_DAY), [c, d] = pt(h, R_DAY - 10); return `<line class="sun-tick" x1="${a}" y1="${b}" x2="${c}" y2="${d}"/>`; }).join('');

    return `<svg class="face" viewBox="0 0 340 340" role="img" aria-label="24 小時圓盤：日出 ${w.sun.rise}、日落 ${w.sun.set}；每小時的氣溫和降雨機率在下方表格。">
      <circle class="disk" cx="${C}" cy="${C}" r="${R_DAY}"/>${dayWedge}${sunTicks}${nums}
      ${rain}${dots}${labels}
      <line class="hand" x1="${h0x}" y1="${h0y}" x2="${hx}" y2="${hy}"/>
      <circle class="sun" cx="${tx}" cy="${ty}" r="7"/>
    </svg>`;
  }

  function center(w) {
    return `<p class="c-temp">${deg(w.obs.temp)}</p><p class="c-wx">${w.now.weather}</p><p class="c-note">實測 ${w.obs.time}</p>`;
  }

  function render(w) {
    const hs = w.hourly.slice(0, 24);
    return `<header class="top"><h1>${w.town}<span>${w.county}</span></h1><p>從指針（現在 ${w.obs.time}）順時針走一圈，是接下來 24 小時</p></header>
      <figure class="clock">
        ${dial(w)}
        <div class="center" aria-live="polite">${center(w)}</div>
      </figure>
      <ul class="legend">
        <li><i class="lg-dot"></i>外圈：每小時氣溫，顏色越深越熱</li>
        <li><i class="lg-rain"></i>內圈：降雨機率，藍色越深越可能下雨</li>
        <li><i class="lg-day"></i>淺藍：日出 ${w.sun.rise} 到日落 ${w.sun.set}</li>
      </ul>
      <details class="nums"><summary>每小時數字</summary>
        <ol>${hs.map((h) => `<li><time>${hh(h.time)}</time>${h.weather}<b>${deg(h.temp)}</b><span>${pct(h.pop)}</span></li>`).join('')}</ol>
      </details>

      <section class="cards">
        <div class="card"><h2>降雨機率</h2><p>${pct(w.now.pop)}</p></div>
        <div class="card"><h2>體感溫度</h2><p>${deg(w.now.feels)}</p></div>
        <div class="card"><h2>紫外線</h2><p>${w.now.uv.value}<small>${w.now.uv.level}</small></p></div>
        <div class="card"><h2>未來 24 小時</h2><p>${deg(w.next24h.min)}–${deg(w.next24h.max)}</p></div>
      </section>
      <section class="obs"><h2>${obsNote(w)}</h2>
        <dl><div><dt>風</dt><dd>${w.obs.windDir}<br>${w.obs.windSpeed} m/s</dd></div><div><dt>濕度</dt><dd>${w.obs.humidity}%</dd></div>
          <div><dt>氣壓</dt><dd>${w.obs.pressure}<br><small>hPa</small></dd></div><div><dt>今日累積雨量</dt><dd>${w.obs.rainToday} mm</dd></div></dl>
      </section>
      <section class="adv"><h2>生活建議</h2>${w.advice.map((a) => `<div class="a">
          <p class="a-h"><b>${a.label}</b><span>${a.from}–${a.to}</span>${icon(a.icon, '')}</p>
          <p>${deg(a.min)}–${deg(a.max)}　降雨 ${pct(a.pop)}　${a.comfort}</p>
          <p class="a-i">${a.items.map((it) => `<span>${ui(it.key)}${it.label}</span>`).join('')}</p></div>`).join('')}
      </section>
      <section class="week"><h2>7 日預報</h2>
        <ol>${w.week.map((d) => `<li><b>${d.label}</b><small>${md(d.date)}</small>${icon(d.icon, d.weather)}<span class="hi">${deg(d.max)}</span><span class="lo">${deg(d.min)}</span><span class="p">${pct(d.pop)}</span></li>`).join('')}</ol>
      </section>`;
  }

  // 手指或滑鼠移到外圈的點上，圓盤中間換成那個小時的數字
  function mount(root, w) {
    const box = root.querySelector('.center');
    const svg = root.querySelector('.face');
    const reset = () => { box.innerHTML = center(w); svg.querySelectorAll('.dot.on').forEach((d) => d.classList.remove('on')); };
    const pick = (e) => {
      const d = e.target.closest('.dot');
      if (!d) return;
      const h = w.hourly[Number(d.dataset.i)];
      svg.querySelectorAll('.dot.on').forEach((x) => x.classList.remove('on'));
      d.classList.add('on');
      box.innerHTML = `<p class="c-time">${md(h.time)} ${hh(h.time)}</p><p class="c-temp">${deg(h.temp)}</p><p class="c-wx">${h.weather}　降雨 ${pct(h.pop)}</p>`;
    };
    svg.addEventListener('pointerover', pick);
    svg.addEventListener('pointerdown', pick);
    svg.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') reset(); });
  }

  window.LAYOUTS.push({ key: 'dial', name: '24 小時圓盤', render, mount });
})();
