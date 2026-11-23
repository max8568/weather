// 1. 方塊拼貼：兩欄、大小不一的方塊。預報的方塊是灰底，實測的方塊是白底加淺藍框。
(function () {
  const { icon, deg, pct, ui, hh, md, obsNote } = window.P;

  const tile = (area, body, cls = '') => `<section class="t ${cls}" style="grid-area:${area}">${body}</section>`;
  const head = (label) => `<h2 class="t-label">${label}</h2>`;

  // 太陽在日出到日落之間走了幾成，用來畫弧線上的點
  const minutes = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
  function sunArc(w) {
    const f = Math.min(1, Math.max(0, (minutes(w.obs.time) - minutes(w.sun.rise)) / (minutes(w.sun.set) - minutes(w.sun.rise))));
    const a = Math.PI * (1 - f);
    const x = (100 + 84 * Math.cos(a)).toFixed(1), y = (92 - 84 * Math.sin(a)).toFixed(1);
    return `<svg class="arc" viewBox="0 0 200 100" aria-hidden="true">
      <path d="M16 92 A84 84 0 0 1 184 92" class="arc-path"/>
      <path d="M16 92 A84 84 0 0 1 ${x} ${y}" class="arc-done"/>
      <line x1="4" y1="92" x2="196" y2="92" class="arc-horizon"/>
      <circle cx="${x}" cy="${y}" r="7" class="arc-sun"/></svg>`;
  }

  function render(w) {
    const next12 = w.hourly.slice(0, 12);
    const wet = w.hourly.find((h) => h.pop >= 50);
    const lo = Math.min(...w.week.map((d) => d.min)), hi = Math.max(...w.week.map((d) => d.max));
    const span = (v) => ((v - lo) / (hi - lo)) * 100;

    const hero = tile('hero', `
      <div class="hero-text">
        <h1 class="place">${w.town}<span>${w.county}</span></h1>
        <p class="temp">${deg(w.obs.temp)}</p>
        <p class="note">${obsNote(w)}</p>
        <p class="cond">${w.now.weather}</p>
        <p class="range">未來 24 小時 ${deg(w.next24h.min)} 到 ${deg(w.next24h.max)}</p>
      </div>${icon(w.now.icon, w.now.weather, 'hero-icon')}`, 'hero');

    const rain = tile('rain', `${head('降雨機率')}<p class="big">${pct(w.now.pop)}</p>
      <p class="hint">${wet ? `${hh(wet.time)} 起升到 ${pct(wet.pop)}` : '接下來 12 小時都不高'}</p>
      <div class="bars" role="img" aria-label="接下來 12 小時的降雨機率">${next12.map((h) =>
        `<i style="--v:${h.pop}"></i>`).join('')}</div>
      <div class="bars-axis"><span>${hh(next12[0].time)}</span><span>${hh(next12[11].time)}</span></div>`, 'tall');

    const feels = tile('feels', `${head('體感溫度')}<p class="big">${deg(w.now.feels)}</p>`);
    const uv = tile('uv', `${head('紫外線')}<p class="big">${w.now.uv.value}<small>${w.now.uv.level}</small></p>
      <div class="uv-scale" aria-hidden="true"><i style="left:${(w.now.uv.value / 11) * 100}%"></i></div>`);

    const hours = tile('hours', `${head('逐小時預報')}
      <div class="hscroll strip" tabindex="0" role="region" aria-label="逐小時預報，可以左右捲動" data-own-keys>${w.hourly.slice(0, 24).map((h, i) => {
        const midnight = h.time.endsWith('T00:00');
        return `<div class="hour${i && midnight ? ' day-start' : ''}"><span class="h-time">${midnight ? md(h.time) : hh(h.time)}</span>${icon(h.icon, h.weather)}
          <span class="h-temp">${deg(h.temp)}</span><span class="h-pop">${pct(h.pop)}</span></div>`;
      }).join('')}</div>`, 'wide');

    const advice = tile('advice', `${head('生活建議')}<ul class="advice">${w.advice.map((a) => `<li>
        <div class="a-when"><strong>${a.label}</strong><span>${a.from}–${a.to}</span></div>
        <div class="a-wx">${icon(a.icon, a.weather)}<span>${deg(a.min)}–${deg(a.max)}</span><span class="a-pop">${pct(a.pop)}</span></div>
        <p class="a-comfort">${a.comfort}</p>
        <ul class="a-items">${a.items.map((it) => `<li>${ui(it.key)}<span>${it.label}</span></li>`).join('')}</ul>
      </li>`).join('')}</ul>`, 'wide');

    const week = tile('week', `${head('7 日預報')}<ul class="week">${w.week.map((d) => `<li>
        <span class="d-label">${d.label}</span>${icon(d.icon, d.weather)}
        <span class="d-pop">${d.pop >= 30 ? pct(d.pop) : ''}</span>
        <span class="d-min">${deg(d.min)}</span>
        <span class="d-bar"><i style="left:${span(d.min)}%;right:${100 - span(d.max)}%"></i></span>
        <span class="d-max">${deg(d.max)}</span></li>`).join('')}</ul>`, 'wide');

    const obsCap = `<p class="obs-cap" style="grid-area:cap">${obsNote(w)}</p>`;
    const wind = tile('wind', `${head('風')}<p class="big">${w.obs.windSpeed}<small>m/s</small></p><p class="hint wind">${ui('wind')}${w.obs.windDir}</p>`, 'obs');
    const hum = tile('hum', `${head('濕度')}<p class="big">${w.obs.humidity}<small>%</small></p>`, 'obs');
    const press = tile('press', `${head('氣壓')}<p class="big">${w.obs.pressure}<small>hPa</small></p>`, 'obs');
    const acc = tile('acc', `${head('今日累積雨量')}<p class="big">${w.obs.rainToday}<small>mm</small></p>`, 'obs');

    const sun = tile('sun', `${head('日出日落')}${sunArc(w)}
      <div class="sun-times"><p>${icon('sunrise')}<span>日出</span><strong>${w.sun.rise}</strong></p>
        <p>${icon('sunset')}<span>日落</span><strong>${w.sun.set}</strong></p></div>`, 'wide');

    return hero + rain + feels + uv + hours + advice + week + obsCap + wind + hum + press + acc + sun;
  }

  window.LAYOUTS.push({ key: 'bento', name: '方塊拼貼', render });
})();
