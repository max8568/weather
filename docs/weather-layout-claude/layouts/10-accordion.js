// 10. 摺疊清單：每一類只顯示一行摘要，點一下才展開。預設只展開「現在」。
// 摘要那一行從資料算出來，例如「週二起有雨」「今晚明晨要帶傘」。
(function () {
  const { icon, deg, pct, ui, md, hh, obsNote } = window.P;

  function rows(w) {
    const wet = w.hourly.find((h) => h.pop >= 50);
    const umbrella = w.advice.find((a) => a.items.some((it) => it.key === 'umbrella'));
    const rainyDay = w.week.find((d, i) => i > 0 && d.pop >= 50);
    const lo = Math.min(...w.week.map((d) => d.min)), hi = Math.max(...w.week.map((d) => d.max));
    const at = (v) => ((v - lo) / (hi - lo)) * 100;

    return [
      { title: '現在', mark: icon(w.now.icon, ''), line: `${deg(w.obs.temp)}　${w.now.weather}`, open: true, body: `
        <div class="now">
          <p class="temp">${deg(w.obs.temp)}</p>
          <div><p class="cond">${w.now.weather}</p><p class="range">未來 24 小時 ${deg(w.next24h.min)}–${deg(w.next24h.max)}</p><p class="note">${obsNote(w)}</p></div>
        </div>
        <dl class="pairs"><div><dt>降雨機率</dt><dd>${pct(w.now.pop)}</dd></div><div><dt>體感溫度</dt><dd>${deg(w.now.feels)}</dd></div><div><dt>紫外線</dt><dd>${w.now.uv.value} ${w.now.uv.level}</dd></div></dl>` },
      { title: '逐小時預報', mark: icon(wet ? wet.icon : 'cloudy', ''), line: wet ? `${hh(wet.time)} 起降雨機率 ${pct(wet.pop)}` : '接下來 24 小時不太會下雨', body: `
        <ol class="hours">${w.hourly.slice(0, 24).map((h) => `<li${h.time.endsWith('T00:00') ? ' class="new-day"' : ''}>
          <time>${h.time.endsWith('T00:00') ? `${md(h.time)} ` : ''}${hh(h.time)}</time>${icon(h.icon, '')}<span>${h.weather}</span><b>${deg(h.temp)}</b><em>${pct(h.pop)}</em></li>`).join('')}</ol>` },
      { title: '生活建議', mark: `<span class="ui-mark">${ui(umbrella ? 'umbrella' : 'short-sleeve')}</span>`, line: umbrella ? `${umbrella.label}要帶傘` : `${w.advice[0].label}${w.advice[0].comfort}`, body: w.advice.map((a) => `
        <div class="adv"><p class="adv-h"><b>${a.label}</b>${a.from}–${a.to}</p>
          <p>${a.weather}，${deg(a.min)}–${deg(a.max)}，降雨 ${pct(a.pop)}，${a.comfort}</p>
          <p class="adv-i">${a.items.map((it) => `<span>${ui(it.key)}${it.label}</span>`).join('')}</p></div>`).join('') },
      { title: '7 日預報', mark: icon(rainyDay ? rainyDay.icon : w.week[1].icon, ''), line: `${rainyDay ? `${rainyDay.label}起有雨　` : ''}${deg(lo)}–${deg(hi)}`, body: `
        <ul class="week">${w.week.map((d) => `<li><b>${d.label}</b><small>${md(d.date)}</small>${icon(d.icon, d.weather)}<em>${pct(d.pop)}</em>
          <span>${deg(d.min)}</span><i><s style="left:${at(d.min)}%;right:${100 - at(d.max)}%"></s></i><span>${deg(d.max)}</span></li>`).join('')}</ul>` },
      { title: '實測', mark: '<span class="ui-mark obs-mark">測</span>', line: `${w.obs.station}測站 ${w.obs.time}　濕度 ${w.obs.humidity}%`, body: `
        <p class="note">${obsNote(w)}</p>
        <dl class="pairs"><div><dt>溫度</dt><dd>${deg(w.obs.temp)}</dd></div><div><dt>風</dt><dd>${w.obs.windDir} ${w.obs.windSpeed} m/s</dd></div>
          <div><dt>濕度</dt><dd>${w.obs.humidity}%</dd></div><div><dt>氣壓</dt><dd>${w.obs.pressure} hPa</dd></div><div><dt>今日累積雨量</dt><dd>${w.obs.rainToday} mm</dd></div></dl>` },
      { title: '日出日落', mark: icon('sunset', ''), line: `${w.sun.rise} 日出　${w.sun.set} 日落`, body: `
        <dl class="pairs"><div><dt>日出</dt><dd>${w.sun.rise}</dd></div><div><dt>日落</dt><dd>${w.sun.set}</dd></div></dl>` },
    ];
  }

  function render(w) {
    return `<header class="top"><h1>${w.town}</h1><p>${w.county}　${w.updated} 更新</p></header>
      <div class="list">${rows(w).map((r) => `<details${r.open ? ' open' : ''}>
          <summary><span class="mark">${r.mark}</span><span class="txt"><strong>${r.title}</strong><span class="line">${r.line}</span></span><span class="chev" aria-hidden="true"></span></summary>
          <div class="body">${r.body}</div>
        </details>`).join('')}</div>`;
  }

  window.LAYOUTS.push({ key: 'accordion', name: '摺疊清單', render });
})();
