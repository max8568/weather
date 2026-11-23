// 9. 底部面板：整個畫面是天空，上面只有大字溫度和太陽走到哪裡。
// 詳細資料收在底部的面板裡，預設只露出一部分；點標題列或往上滑就展開，再點或往下滑就收回。
(function () {
  const { icon, deg, pct, ui, md, hh, obsNote } = window.P;
  const minutes = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));

  // 天空上的大弧線：日出在左、日落在右，太陽畫在現在的位置
  function sky(w) {
    const f = Math.min(1, Math.max(0, (minutes(w.obs.time) - minutes(w.sun.rise)) / (minutes(w.sun.set) - minutes(w.sun.rise))));
    const a = Math.PI * (1 - f);
    const x = (200 + 170 * Math.cos(a)).toFixed(1), y = (190 - 150 * Math.sin(a)).toFixed(1);
    return `<svg class="arc" viewBox="0 0 400 210" aria-hidden="true">
      <path class="arc-all" d="M30 190 A170 150 0 0 1 370 190"/>
      <path class="arc-done" d="M30 190 A170 150 0 0 1 ${x} ${y}"/>
      <circle class="arc-sun" cx="${x}" cy="${y}" r="11"/>
      <text x="30" y="206">日出 ${w.sun.rise}</text><text x="370" y="206" text-anchor="end">日落 ${w.sun.set}</text></svg>`;
  }

  function render(w) {
    const lo = Math.min(...w.week.map((d) => d.min)), hi = Math.max(...w.week.map((d) => d.max));
    const at = (v) => ((v - lo) / (hi - lo)) * 100;
    return `<div class="scene">
        <div class="hero">
          <p class="place">${w.county}<strong>${w.town}</strong></p>
          <p class="temp">${deg(w.obs.temp)}</p>
          <p class="cond">${icon(w.now.icon, '')}${w.now.weather}</p>
          <p class="range">最高 ${deg(w.next24h.max)}　最低 ${deg(w.next24h.min)}</p>
          <p class="note">${obsNote(w)}</p>
        </div>
        ${sky(w)}
      </div>
      <section class="sheet" aria-label="詳細資料">
        <button type="button" class="grip" aria-expanded="false" aria-controls="sheet-body"><i></i><span class="g-t">詳細資料</span><span class="g-h">點這裡或往上滑展開</span></button>
        <div class="body" id="sheet-body">
          <dl class="quick"><div><dt>降雨機率</dt><dd>${pct(w.now.pop)}</dd></div><div><dt>體感溫度</dt><dd>${deg(w.now.feels)}</dd></div><div><dt>紫外線</dt><dd>${w.now.uv.value}<small>${w.now.uv.level}</small></dd></div></dl>
          <h2>逐小時預報</h2>
          <div class="hrs hscroll" tabindex="0" role="region" aria-label="逐小時預報，可以左右捲動" data-own-keys>${w.hourly.slice(0, 24).map((h) => `<div>
            <time>${h.time.endsWith('T00:00') ? md(h.time) : hh(h.time)}</time>${icon(h.icon, h.weather)}<b>${deg(h.temp)}</b><span>${pct(h.pop)}</span></div>`).join('')}</div>
          <h2>生活建議</h2>
          <div class="advs hscroll" tabindex="0" role="region" aria-label="生活建議，可以左右捲動" data-own-keys>${w.advice.map((a) => `<article>
            <header><div><h3>${a.label}</h3><p>${a.from}–${a.to}</p></div>${icon(a.icon, a.weather)}</header>
            <p class="n"><b>${deg(a.min)}–${deg(a.max)}</b>降雨 ${pct(a.pop)}</p><p class="c">${a.comfort}</p>
            <ul>${a.items.map((it) => `<li>${ui(it.key)}<span>${it.label}</span></li>`).join('')}</ul></article>`).join('')}</div>
          <h2>7 日預報</h2>
          <ul class="wk">${w.week.map((d) => `<li><b>${d.label}</b>${icon(d.icon, d.weather)}<span class="p">${d.pop >= 30 ? pct(d.pop) : ''}</span>
            <span class="t">${deg(d.min)}</span><i><s style="left:${at(d.min)}%;right:${100 - at(d.max)}%"></s></i><span class="t">${deg(d.max)}</span></li>`).join('')}</ul>
          <h2>${obsNote(w)}</h2>
          <dl class="ob"><div><dt>風</dt><dd>${w.obs.windDir} ${w.obs.windSpeed} m/s</dd></div><div><dt>濕度</dt><dd>${w.obs.humidity}%</dd></div>
            <div><dt>氣壓</dt><dd>${w.obs.pressure} hPa</dd></div><div><dt>今日累積雨量</dt><dd>${w.obs.rainToday} mm</dd></div></dl>
          <h2>日出日落</h2>
          <p class="sun">${icon('sunrise')}日出 <b>${w.sun.rise}</b>${icon('sunset')}日落 <b>${w.sun.set}</b></p>
        </div>
      </section>`;
  }

  function mount(root) {
    const sheet = root.querySelector('.sheet');
    const grip = sheet.querySelector('.grip');
    const body = sheet.querySelector('.body');
    const set = (open) => {
      sheet.classList.toggle('open', open);
      grip.setAttribute('aria-expanded', String(open));
      grip.querySelector('.g-h').textContent = open ? '點這裡或往下滑收回' : '點這裡或往上滑展開';
      if (!open) body.scrollTop = 0;
    };
    let startY = null, moved = false;
    grip.addEventListener('pointerdown', (e) => { startY = e.clientY; moved = false; grip.setPointerCapture(e.pointerId); });
    grip.addEventListener('pointermove', (e) => {
      if (startY === null) return;
      const dy = e.clientY - startY;
      if (Math.abs(dy) > 30) { moved = true; set(dy < 0); startY = null; }
    });
    grip.addEventListener('pointerup', () => { startY = null; });
    grip.addEventListener('click', () => { if (!moved) set(!sheet.classList.contains('open')); moved = false; });
    // 收起來的時候，在面板的內容上往上滑也能展開
    body.addEventListener('wheel', (e) => { if (!sheet.classList.contains('open') && e.deltaY > 0) set(true); }, { passive: true });
    let touchY = null;
    body.addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
    body.addEventListener('touchmove', (e) => {
      if (touchY === null) return;
      const dy = e.touches[0].clientY - touchY;
      if (!sheet.classList.contains('open') && dy < -30) { set(true); touchY = null; }
      else if (sheet.classList.contains('open') && body.scrollTop <= 0 && dy > 40) { set(false); touchY = null; }
    }, { passive: true });
    sheet.addEventListener('keydown', (e) => { if (e.key === 'Escape' && sheet.classList.contains('open')) { set(false); grip.focus(); } });
  }

  window.LAYOUTS.push({ key: 'sheet', name: '底部面板', render, mount });
})();
