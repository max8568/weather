// 8. 選日期：最上面一排 7 天，點哪一天，中間就換成那一天的預報。
// 有逐時資料的日子（今天到 11/26）會多一排逐時；之後的日子只有那天的預報。實測和生活建議固定在下面，不跟著換。
(function () {
  const { icon, deg, pct, ui, md, hh, obsNote } = window.P;
  const WEEKDAY = '日一二三四五六';
  const weekday = (date) => `週${WEEKDAY[new Date(`${date}T00:00Z`).getUTCDay()]}`;

  function detail(w, i) {
    const d = w.week[i];
    const hours = w.hourly.filter((h) => h.time.startsWith(d.date));
    const lo = Math.min(...w.hourly.map((h) => h.temp)), hi = Math.max(...w.hourly.map((h) => h.temp));
    const head = `<div class="d-head">
        <div><p class="d-date">${md(d.date)}<span>${i === 0 ? '今天' : weekday(d.date)}</span></p>
          <p class="d-wx">${d.weather}</p>
          <p class="d-t"><span>最高<b class="max">${deg(d.max)}</b></span><span>最低<b class="min">${deg(d.min)}</b></span><span>降雨 ${pct(d.pop)}</span></p></div>
        ${icon(d.icon, d.weather)}
      </div>`;
    // 每一項各自不斷行，窄螢幕只在項目之間換行
    const now = i === 0 ? `<p class="d-now">${[`現在 <b>${deg(w.obs.temp)}</b>（${obsNote(w)}）`, `未來 24 小時 ${deg(w.next24h.min)}–${deg(w.next24h.max)}`,
      `體感 ${deg(w.now.feels)}`, `降雨機率 ${pct(w.now.pop)}`, `紫外線 ${w.now.uv.value} ${w.now.uv.level}`].map((s) => `<span>${s}</span>`).join('')}</p>` : '';
    const strip = hours.length
      ? `<h3 class="d-sub">${i === 0 ? '接下來' : '這一天'}每小時<span>${hh(hours[0].time)}–${hh(hours[hours.length - 1].time)}</span></h3>
        <div class="cols hscroll" tabindex="0" role="region" aria-label="${md(d.date)} 每小時預報，可以左右捲動" data-own-keys>${hours.map((h) => `<div class="col-h">
          <span class="v">${deg(h.temp)}</span><i style="height:${(18 + ((h.temp - lo) / (hi - lo)) * 46).toFixed(0)}px"></i>
          ${icon(h.icon, h.weather)}<span class="p">${pct(h.pop)}</span><time>${hh(h.time)}</time></div>`).join('')}</div>`
      : `<p class="d-none">${md(d.date)} 只有整天的預報，沒有每小時的資料。</p>`;
    return head + now + strip;
  }

  function render(w) {
    return `<header class="top"><h1>${w.town}</h1><p>${w.county}　選一天看那天的天氣</p></header>
      <div class="days" role="group" aria-label="選擇日期">${w.week.map((d, i) => `<button type="button" aria-pressed="${i === 0}" data-day="${i}">
          <span class="wk">${d.label}</span><span class="num">${Number(d.date.slice(8, 10))}</span>${icon(d.icon, '')}<span class="hl">${deg(d.max)}<small>${deg(d.min)}</small></span>
        </button>`).join('')}</div>
      <section class="detail" aria-live="polite">${detail(w, 0)}</section>

      <section class="fixed obs"><h2>${obsNote(w)}</h2>
        <dl><div><dt>風</dt><dd>${w.obs.windDir} ${w.obs.windSpeed} m/s</dd></div><div><dt>濕度</dt><dd>${w.obs.humidity}%</dd></div>
          <div><dt>氣壓</dt><dd>${w.obs.pressure} hPa</dd></div><div><dt>今日累積雨量</dt><dd>${w.obs.rainToday} mm</dd></div></dl>
      </section>
      <section class="fixed"><h2>生活建議</h2>
        <div class="advs">${w.advice.map((a) => `<article><h3>${a.label}</h3><p class="t">${a.from}–${a.to}</p>${icon(a.icon, a.weather)}
          <p class="n">${deg(a.min)}–${deg(a.max)}</p><p class="t">降雨 ${pct(a.pop)}<br>${a.comfort}</p>
          <ul>${a.items.map((it) => `<li title="${it.label}">${ui(it.key)}<span>${it.label}</span></li>`).join('')}</ul></article>`).join('')}</div>
      </section>
      <section class="fixed sun"><h2>日出日落</h2><p>${icon('sunrise')}日出 <b>${w.sun.rise}</b></p><p>${icon('sunset')}日落 <b>${w.sun.set}</b></p></section>`;
  }

  function mount(root, w) {
    const pane = root.querySelector('.detail');
    const buttons = [...root.querySelectorAll('.days button')];
    buttons.forEach((b, i) => b.addEventListener('click', () => {
      buttons.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      pane.innerHTML = detail(w, i);
    }));
  }

  window.LAYOUTS.push({ key: 'days', name: '選日期', render, mount });
})();
