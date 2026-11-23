// 2. 底部分頁：畫面底部四個分頁，一次只看一類。四頁的內容都先放進 HTML，沒選中的加 hidden。
(function () {
  const { icon, deg, pct, ui, md, hh, obsNote } = window.P;

  const line = (d) => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;
  const TABS = [
    { id: 'now', label: '現在', svg: line('M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z') },
    { id: 'hours', label: '逐時', svg: line('M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2') },
    { id: 'week', label: '7 日', svg: line('M4 6h16v14H4zM4 10h16M8 3v4M16 3v4') },
    { id: 'life', label: '生活', svg: ui('short-sleeve') },
  ];

  // 逐時列表照日期分組，每天一個標題
  const DAY_NAMES = ['今天', '明天', '後天', '大後天'];
  function hourGroups(w) {
    const groups = [];
    for (const h of w.hourly) {
      const date = h.time.slice(0, 10);
      if (!groups.length || groups[groups.length - 1].date !== date) groups.push({ date, hours: [] });
      groups[groups.length - 1].hours.push(h);
    }
    return groups.map((g, i) => `<section class="day">
      <h3 class="day-head">${DAY_NAMES[i]}<span>${md(g.date)}</span></h3>
      <ol>${g.hours.map((h) => `<li>
        <time>${hh(h.time)}</time>${icon(h.icon, '')}<span class="h-wx">${h.weather}</span>
        <span class="h-pop"><i style="width:${h.pop}%"></i><b>${pct(h.pop)}</b></span>
        <strong>${deg(h.temp)}</strong></li>`).join('')}</ol></section>`).join('');
  }

  function render(w) {
    const lo = Math.min(...w.week.map((d) => d.min)), hi = Math.max(...w.week.map((d) => d.max));
    const at = (v) => ((v - lo) / (hi - lo)) * 100;

    const now = `
      <p class="place">${w.county} <strong>${w.town}</strong></p>
      <div class="split">
        <div class="sky">
          <p class="temp">${deg(w.obs.temp)}</p>
          <p class="cond">${icon(w.now.icon, '')}${w.now.weather}</p>
          <p class="range">最高 ${deg(w.next24h.max)}　最低 ${deg(w.next24h.min)}</p>
        </div>
        <dl class="stats">
          <div><dt>降雨機率</dt><dd>${pct(w.now.pop)}</dd></div>
          <div><dt>體感溫度</dt><dd>${deg(w.now.feels)}</dd></div>
          <div><dt>紫外線</dt><dd>${w.now.uv.value}<small>${w.now.uv.level}</small></dd></div>
        </dl>
      </div>
      <h2 class="sub">${obsNote(w)}</h2>
      <dl class="obs">
        <div><dt>溫度</dt><dd>${deg(w.obs.temp)}</dd></div>
        <div><dt>風</dt><dd>${w.obs.windDir} ${w.obs.windSpeed} m/s</dd></div>
        <div><dt>濕度</dt><dd>${w.obs.humidity}%</dd></div>
        <div><dt>氣壓</dt><dd>${w.obs.pressure} hPa</dd></div>
        <div><dt>今日累積雨量</dt><dd>${w.obs.rainToday} mm</dd></div>
      </dl>
      <h2 class="sub">日出日落</h2>
      <div class="sun"><p>${icon('sunrise')}<span>日出</span><strong>${w.sun.rise}</strong></p><p>${icon('sunset')}<span>日落</span><strong>${w.sun.set}</strong></p></div>`;

    const hours = `<h2 class="title">逐時預報<span>72 小時</span></h2>${hourGroups(w)}`;

    const week = `<h2 class="title">7 日預報</h2><ul class="week">${w.week.map((d) => `<li>
        <div class="w-day"><strong>${d.label}</strong><span>${md(d.date)}</span></div>
        ${icon(d.icon, '')}
        <div class="w-wx"><span>${d.weather}</span><small>降雨 ${pct(d.pop)}</small></div>
        <div class="w-temp"><b class="max">${deg(d.max)}</b><span class="w-bar"><i style="bottom:${at(d.min)}%;top:${100 - at(d.max)}%"></i></span><b class="min">${deg(d.min)}</b></div>
      </li>`).join('')}</ul>`;

    const life = `<h2 class="title">生活建議</h2>${w.advice.map((a) => `<article class="advice">
        <header><div><h3>${a.label}</h3><p>${a.from}–${a.to}　${a.weather}</p></div>${icon(a.icon, '')}</header>
        <p class="a-nums"><strong>${deg(a.min)}–${deg(a.max)}</strong><span>降雨 ${pct(a.pop)}</span><span>${a.comfort}</span></p>
        <ul>${a.items.map((it) => `<li>${ui(it.key)}<span>${it.label}</span></li>`).join('')}</ul>
      </article>`).join('')}`;

    const body = { now, hours, week, life };
    return `${TABS.map((t, i) => `<section class="panel panel-${t.id}" id="tab-${t.id}" role="tabpanel" aria-labelledby="tabbtn-${t.id}"${i ? ' hidden' : ''}>${body[t.id]}</section>`).join('')}
      <nav class="bar" role="tablist" aria-label="天氣資訊分類" data-own-keys>${TABS.map((t, i) =>
        `<button type="button" role="tab" id="tabbtn-${t.id}" aria-controls="tab-${t.id}" aria-selected="${i === 0}" tabindex="${i ? -1 : 0}">${t.svg}<span>${t.label}</span></button>`).join('')}</nav>`;
  }

  function mount(root) {
    const tabs = [...root.querySelectorAll('[role="tab"]')];
    const select = (i, focus) => {
      tabs.forEach((t, j) => {
        t.setAttribute('aria-selected', String(i === j));
        t.tabIndex = i === j ? 0 : -1;
        root.querySelector(`#${t.getAttribute('aria-controls')}`).hidden = i !== j;
      });
      if (focus) tabs[i].focus();
      window.scrollTo(0, 0);
    };
    tabs.forEach((t, i) => t.addEventListener('click', () => select(i, false)));
    // 分頁列裡左右鍵換分頁（不換排版）
    root.querySelector('.bar').addEventListener('keydown', (e) => {
      const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
      if (!step) return;
      e.preventDefault();
      const i = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
      select((i + step + tabs.length) % tabs.length, true);
    });
  }

  window.LAYOUTS.push({ key: 'tabbar', name: '底部分頁', render, mount });
})();
