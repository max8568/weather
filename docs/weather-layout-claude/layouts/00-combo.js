// 0. 組合版：使用者從各排版挑出來拼成的一頁，統一成同一套樣式。
// 上面是溫度卡片（左邊地點、日期、溫度、未來 24 小時，右邊天氣圖示和天氣）和下面一排三個數字，接著是逐小時、7 日溫度範圍、
// 可以左右滑的生活建議卡片、目前觀測、日出日落。每張卡片都照「即時總覽」原型的卡片樣式。
(function () {
  const { icon, deg, pct, ui, md, hh, obsNote, tempGradient } = window.P;

  // 日出日落的弧線照網站（site/js/render/sections.js 的 renderSun）：一段餘弦曲線，
  // 兩端在地平線下，t = 0.25 和 0.75 跟地平線相交，中間是白天。
  const ARC = { x0: 40, width: 240, base: 62, amp: 30 };
  const arcPoint = (t) => [ARC.x0 + t * ARC.width, ARC.base - ARC.amp * Math.cos(Math.PI * (2 * t - 1))];
  const minutes = (s) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
  const daylight = (now, rise, set) => Math.min(1, Math.max(0, (minutes(now) - minutes(rise)) / (minutes(set) - minutes(rise))));

  // 標題放在卡片外面、卡片上方；卡片裡只放內容
  const card = (cls, title, sub, body) =>
    `<section class="sec ${cls}"><h2>${title}${sub ? `<span>${sub}</span>` : ''}</h2><div class="card">${body}</div></section>`;

  function render(w) {
    const lo = Math.min(...w.week.map((d) => d.min)), hi = Math.max(...w.week.map((d) => d.max));
    const at = (v) => ((v - lo) / (hi - lo)) * 100;

    // 日期用 UTC 算星期幾，不受瀏覽器時區影響
    const today = w.week[0].date;
    const date = `${Number(today.slice(5, 7))} 月 ${Number(today.slice(8, 10))} 日・星期${'日一二三四五六'[new Date(`${today}T00:00Z`).getUTCDay()]}`;
    const hero = `<div class="lead"><section class="now">
        <div class="now-text">
          <h1 class="place">${w.county} ${w.town}</h1>
          <p class="date">${date}</p>
          <p class="temp">${w.obs.temp}<span class="unit">°C</span></p>
          <p class="range">未來 24 小時 ${deg(w.next24h.min)}–${deg(w.next24h.max)}</p>
        </div>
        <div class="now-icon">${icon(w.now.icon, w.now.weather)}<p class="cond">${w.now.weather}</p></div>
      </section>
      <dl class="stats">
        <div><dt>降雨機率</dt><dd>${w.now.pop}<small>%</small></dd></div>
        <div><dt>體感溫度</dt><dd>${w.now.feels}<small>°C</small></dd></div>
        <div><dt>紫外線</dt><dd>${w.now.uv.value}<small>${w.now.uv.level}</small></dd></div>
      </dl></div>`;

    const hours = card('hours', '逐小時預報', '', `<div class="strip hscroll" tabindex="0" role="region" aria-label="逐小時預報，可以左右捲動" data-own-keys>${
      w.hourly.slice(0, 24).map((h, i) => {
        const midnight = h.time.endsWith('T00:00');
        return `<div class="hour${i && midnight ? ' day-start' : ''}"><time>${midnight ? md(h.time) : hh(h.time)}</time>${icon(h.icon, h.weather)}<b>${deg(h.temp)}</b><span>${pct(h.pop)}</span></div>`;
      }).join('')}</div>`);

    const week = card('week', '7 日預報', '最低溫到最高溫', `<ul>${w.week.map((d) => `<li>
        <b class="w-day">${d.label}</b>${icon(d.icon, d.weather)}<span class="w-pop">${pct(d.pop)}</span>
        <span class="w-range"><i style="left:${at(d.min)}%;right:${100 - at(d.max)}%;background:${tempGradient(d.min, d.max)}"><b>${deg(d.min)}</b><b>${deg(d.max)}</b></i></span></li>`).join('')}</ul>`);

    // 生活建議照網站現在的排版：上半時段、溫度、降雨，右邊圖示和舒適度；下半一排建議圖示。
    // 外面沒有卡片，標題下面直接是一排可以左右滑的卡片
    const advice = `<section class="sec advice"><h2>生活建議</h2><div class="advs hscroll" tabindex="0" role="region" aria-label="生活建議，可以左右捲動" data-own-keys>${
      w.advice.map((a) => `<article>
        <div class="a-top"><p class="a-label">${a.label}</p><p class="a-temp">${a.min} - ${a.max}°</p><p class="a-pop">降雨 ${pct(a.pop)}</p>
          ${icon(a.icon, a.weather)}<p class="a-comfort">${a.comfort}</p></div>
        <ul class="a-items">${a.items.map((it) => `<li>${ui(it.key)}<span>${it.label}</span></li>`).join('')}</ul>
      </article>`).join('')}</div></section>`;

    const obs = card('obs', '目前觀測', obsNote(w), `<dl>
        <div><dt>濕度</dt><dd>${w.obs.humidity}<small>%</small></dd></div>
        <div><dt>風速</dt><dd>${w.obs.windSpeed}<small>m/s</small></dd></div>
        <div><dt>風向</dt><dd>${w.obs.windDir}</dd></div>
        <div><dt>氣壓</dt><dd>${w.obs.pressure}<small>hPa</small></dd></div>
        <div><dt>今日累積雨量</dt><dd>${w.obs.rainToday}<small>mm</small></dd></div>
      </dl>`);

    // 日出日落照網站：兩端是圖示和時間，下面一條弧線，太陽停在資料時間的位置
    const path = Array.from({ length: 49 }, (_, i) => arcPoint(i / 48))
      .map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
    const [sx, sy] = arcPoint(0.25 + 0.5 * daylight(w.updated, w.sun.rise, w.sun.set));
    const { x0, width, base } = ARC;
    const sun = card('sun', '日出日落', '', `<div class="sun-times">
        <div class="sun-end">${icon('sunrise', '日出')}<div class="sun-time">${w.sun.rise}</div></div>
        <div class="sun-end right">${icon('sunset', '日落')}<div class="sun-time">${w.sun.set}</div></div>
      </div>
      <svg class="sun-arc" viewBox="0 20 320 80" aria-hidden="true">
        <defs><linearGradient id="sun-arc-fade" gradientUnits="userSpaceOnUse" x1="${x0}" x2="${x0 + width}">
          <stop offset="0" stop-color="currentColor" stop-opacity="0"/><stop offset=".25" stop-color="currentColor"/>
          <stop offset=".75" stop-color="currentColor"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/>
        </linearGradient></defs>
        <line class="horizon" x1="16" x2="304" y1="${base}" y2="${base}"/>
        <path d="${path}" fill="none" stroke="url(#sun-arc-fade)" stroke-width="2"/>
        <circle class="sun-dot" cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="7"/>
      </svg>`);

    return hero + hours + week + advice + obs + sun;
  }

  window.LAYOUTS.push({ key: 'combo', name: '組合版', render });
})();
