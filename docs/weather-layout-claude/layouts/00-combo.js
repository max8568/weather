// 0. 組合版：使用者從各排版挑出來拼成的一頁，統一成同一套樣式。
// 上面是溫度卡片（左邊地點、日期、溫度、天氣，右邊天氣圖示）和下面一排三個數字，接著是逐小時、7 日溫度範圍、
// 可以左右滑的生活建議卡片、目前觀測、日出日落。預報的區塊是灰底；放實測溫度的溫度卡片和「目前觀測」是白底加淺藍框。
(function () {
  const { icon, deg, pct, md, hh, obsNote } = window.P;

  // 生活建議的句子從建議項目組出來
  const DO = {
    'short-sleeve': '穿短袖', 'long-sleeve': '穿長袖', 'light-jacket': '加一件薄外套',
    umbrella: '帶傘', laundry: '適合曬衣服', 'no-laundry': '衣服不適合在外面曬',
  };
  const advise = (a) => `${a.items.map((it) => DO[it.key]).join('，')}。`;

  const card = (cls, title, sub, body) =>
    `<section class="card ${cls}"><h2>${title}${sub ? `<span>${sub}</span>` : ''}</h2>${body}</section>`;

  function render(w) {
    const lo = Math.min(...w.week.map((d) => d.min)), hi = Math.max(...w.week.map((d) => d.max));
    const at = (v) => ((v - lo) / (hi - lo)) * 100;

    // 日期用 UTC 算星期幾，不受瀏覽器時區影響
    const today = w.week[0].date;
    const date = `${Number(today.slice(5, 7))} 月 ${Number(today.slice(8, 10))} 日・星期${'日一二三四五六'[new Date(`${today}T00:00Z`).getUTCDay()]}`;
    const hero = `<section class="now">
        <div class="now-text">
          <h1 class="place">${w.county} ${w.town}</h1>
          <p class="date">${date}</p>
          <p class="temp">${w.obs.temp}<span class="unit">°C</span><span class="note">實測 ${w.obs.time}</span></p>
          <p class="cond">${w.now.weather}<span>未來 24 小時 ${deg(w.next24h.min)}–${deg(w.next24h.max)}</span></p>
        </div>
        <div class="now-icon">${icon(w.now.icon, w.now.weather)}</div>
      </section>
      <dl class="stats">
        <div><dt>降雨機率</dt><dd>${w.now.pop}<small>%</small></dd></div>
        <div><dt>體感溫度</dt><dd>${w.now.feels}<small>°C</small></dd></div>
        <div><dt>紫外線</dt><dd>${w.now.uv.value}<small>${w.now.uv.level}</small></dd></div>
      </dl>`;

    const hours = card('hours', '逐小時預報', '', `<div class="strip hscroll" tabindex="0" role="region" aria-label="逐小時預報，可以左右捲動" data-own-keys>${
      w.hourly.slice(0, 24).map((h, i) => {
        const midnight = h.time.endsWith('T00:00');
        return `<div class="hour${i && midnight ? ' day-start' : ''}"><time>${midnight ? md(h.time) : hh(h.time)}</time>${icon(h.icon, h.weather)}<b>${deg(h.temp)}</b><span>${pct(h.pop)}</span></div>`;
      }).join('')}</div>`);

    const week = card('week', '7 日預報', '最低溫到最高溫', `<ul>${w.week.map((d) => `<li>
        <b class="w-day">${d.label}</b>${icon(d.icon, d.weather)}<span class="w-pop">${pct(d.pop)}</span>
        <span class="w-range"><i style="left:${at(d.min)}%;right:${100 - at(d.max)}%"><b>${deg(d.min)}</b><b>${deg(d.max)}</b></i></span></li>`).join('')}</ul>`);

    const advice = card('advice', '生活建議', '', `<div class="advs hscroll" tabindex="0" role="region" aria-label="生活建議，可以左右捲動" data-own-keys>${
      w.advice.map((a) => `<article>
        <header><div><h3>${a.label}</h3><p>${a.from}–${a.to}</p></div>${icon(a.icon, a.weather)}</header>
        <p class="say">${advise(a)}</p>
        <p class="nums"><b>${deg(a.min)}–${deg(a.max)}</b><span>降雨 ${pct(a.pop)}</span><span>${a.comfort}</span></p>
      </article>`).join('')}</div>`);

    const obs = card('obs', '目前觀測', obsNote(w), `<dl>
        <div><dt>濕度</dt><dd>${w.obs.humidity}<small>%</small></dd></div>
        <div><dt>風速</dt><dd>${w.obs.windSpeed}<small>m/s</small></dd></div>
        <div><dt>風向</dt><dd>${w.obs.windDir}</dd></div>
        <div><dt>氣壓</dt><dd>${w.obs.pressure}<small>hPa</small></dd></div>
        <div><dt>今日累積雨量</dt><dd>${w.obs.rainToday}<small>mm</small></dd></div>
      </dl>`);

    const sun = card('sun', '日出日落', '', `<div class="sun-row">
        <p>${icon('sunrise')}<span>日出</span><b>${w.sun.rise}</b></p>
        <p>${icon('sunset')}<span>日落</span><b>${w.sun.set}</b></p>
      </div>`);

    return hero + hours + week + advice + obs + sun;
  }

  window.LAYOUTS.push({ key: 'combo', name: '組合版', render });
})();
