// 4. 左右滑動：一類資料一頁，左右滑換頁，底下圓點標出第幾頁。下一頁的邊緣會露出來，看得出還可以滑。
(function () {
  const { icon, deg, pct, ui, md, hh, obsNote } = window.P;

  function pages(w) {
    const lo = Math.min(...w.week.map((d) => d.min)), hi = Math.max(...w.week.map((d) => d.max));
    const at = (v) => ((v - lo) / (hi - lo)) * 100;
    const next24 = w.hourly.slice(0, 24);
    return [
      { title: '現在', cls: 'p-now', html: `
        <p class="where">${w.county}</p><h2 class="town">${w.town}</h2>
        ${icon(w.now.icon, '', 'now-icon')}
        <p class="temp">${deg(w.obs.temp)}</p>
        <p class="cond">${w.now.weather}</p>
        <p class="range">未來 24 小時 ${deg(w.next24h.min)}–${deg(w.next24h.max)}</p>
        <dl class="trio"><div><dt>降雨機率</dt><dd>${pct(w.now.pop)}</dd></div><div><dt>體感溫度</dt><dd>${deg(w.now.feels)}</dd></div><div><dt>紫外線</dt><dd>${w.now.uv.value}<small>${w.now.uv.level}</small></dd></div></dl>
        <p class="foot">溫度為${obsNote(w)}</p>` },
      { title: '逐時', cls: 'p-hours', html: `<h2>接下來 24 小時</h2>
        <ol class="hours">${next24.map((h) => `<li${h.time.endsWith('T00:00') ? ' class="midnight"' : ''}>
          <time>${h.time.endsWith('T00:00') ? md(h.time) : hh(h.time)}</time>${icon(h.icon, '')}<strong>${deg(h.temp)}</strong><span>${pct(h.pop)}</span></li>`).join('')}</ol>` },
      { title: '生活', cls: 'p-life', html: `<h2>生活建議</h2>${w.advice.map((a) => `<section class="adv">
          <div class="adv-head">${icon(a.icon, '')}<div><h3>${a.label}</h3><p>${a.from}–${a.to}　${a.weather}</p></div></div>
          <p class="adv-nums"><strong>${deg(a.min)}–${deg(a.max)}</strong>降雨 ${pct(a.pop)}<span>${a.comfort}</span></p>
          <ul>${a.items.map((it) => `<li>${ui(it.key)}${it.label}</li>`).join('')}</ul></section>`).join('')}` },
      { title: '7 日', cls: 'p-week', html: `<h2>7 日預報</h2><ul class="week">${w.week.map((d) => `<li>
          <span class="wd"><b>${d.label}</b>${md(d.date)}</span>${icon(d.icon, d.weather)}
          <span class="wp">${pct(d.pop)}</span>
          <span class="wt"><span>${deg(d.min)}</span><i><b style="left:${at(d.min)}%;right:${100 - at(d.max)}%"></b></i><span>${deg(d.max)}</span></span></li>`).join('')}</ul>` },
      { title: '實測與日出日落', cls: 'p-obs', html: `<h2>${obsNote(w)}</h2>
        <dl class="obs"><div><dt>溫度</dt><dd>${deg(w.obs.temp)}</dd></div><div><dt>風</dt><dd>${w.obs.windSpeed}<small>m/s ${w.obs.windDir}</small></dd></div>
          <div><dt>濕度</dt><dd>${w.obs.humidity}<small>%</small></dd></div><div><dt>氣壓</dt><dd>${w.obs.pressure}<small>hPa</small></dd></div>
          <div><dt>今日累積雨量</dt><dd>${w.obs.rainToday}<small>mm</small></dd></div></dl>
        <h2 class="sun-title">日出日落</h2>
        <div class="sun"><p>${icon('sunrise')}<span>日出</span><strong>${w.sun.rise}</strong></p><p>${icon('sunset')}<span>日落</span><strong>${w.sun.set}</strong></p></div>` },
    ];
  }

  function render(w) {
    const list = pages(w);
    return `<div class="track hscroll" tabindex="0" role="region" aria-roledescription="輪播" aria-label="天氣資訊，可以左右滑動換頁" data-own-keys>
        ${list.map((p, i) => `<section class="page ${p.cls}" aria-label="第 ${i + 1} 頁，共 ${list.length} 頁：${p.title}">${p.html}</section>`).join('')}
      </div>
      <nav class="dots" aria-label="換頁">${list.map((p, i) => `<button type="button" aria-label="${p.title}"${i ? '' : ' aria-current="true"'}><span>${p.title}</span></button>`).join('')}</nav>`;
  }

  function mount(root) {
    const track = root.querySelector('.track');
    const pagesEls = [...track.children];
    const dots = [...root.querySelectorAll('.dots button')];
    const current = () => {
      const mid = track.scrollLeft + track.clientWidth / 2;
      const i = pagesEls.findIndex((p) => p.offsetLeft + p.offsetWidth > mid);
      return i < 0 ? pagesEls.length - 1 : i;
    };
    const go = (i) => pagesEls[Math.max(0, Math.min(pagesEls.length - 1, i))].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    const mark = () => dots.forEach((d, j) => (j === current() ? d.setAttribute('aria-current', 'true') : d.removeAttribute('aria-current')));
    track.addEventListener('scroll', mark, { passive: true });
    dots.forEach((d, i) => d.addEventListener('click', () => go(i)));
    // 焦點在滑動區時，左右鍵換頁（不換排版）
    track.addEventListener('keydown', (e) => {
      const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
      if (!step) return;
      e.preventDefault();
      go(current() + step);
    });
  }

  window.LAYOUTS.push({ key: 'pages', name: '左右滑動', render, mount });
})();
