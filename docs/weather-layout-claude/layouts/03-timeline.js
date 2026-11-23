// 3. 時間軸：從現在一路往下排到第 7 天。日出日落、生活建議放在它們發生的時間點上。
// 左邊那條線在會下雨的時段變成藍色；24 小時以後只剩每天一個點，線改成虛線。
(function () {
  const { icon, deg, pct, ui, md, hh, obsNote } = window.P;

  function render(w) {
    const nowT = `2026-11-23T${w.obs.time}`;
    const lastHour = w.hourly[23].time;
    const rainyAt = (t) => {
      const h = [...w.hourly].reverse().find((x) => x.time <= t);
      return h ? h.pop >= 50 : w.now.pop >= 50;
    };
    const ev = [];
    const add = (t, cls, wet, html) => ev.push({ t, cls, wet, html });

    w.week.forEach((d, i) => {
      const t = `${d.date}T00:00`;
      add(i === 0 ? '0' : t, 'day', d.pop >= 50 && t > lastHour, `
        <time>${md(d.date)}</time><div class="body"><h2>${d.label}</h2>${icon(d.icon, '')}
        <p>${d.weather}　<b>${deg(d.min)}–${deg(d.max)}</b>　<span class="pop">降雨 ${pct(d.pop)}</span></p></div>`);
    });

    add(nowT, 'now', false, `<time>${w.obs.time}</time><div class="body">
      <p class="tag">現在　${obsNote(w)}</p>
      <div class="now-main"><p class="temp">${deg(w.obs.temp)}</p>${icon(w.now.icon, '')}<p class="cond">${w.now.weather}<span>未來 24 小時 ${deg(w.next24h.min)}–${deg(w.next24h.max)}</span></p></div>
      <dl class="fc"><div><dt>降雨機率</dt><dd>${pct(w.now.pop)}</dd></div><div><dt>體感溫度</dt><dd>${deg(w.now.feels)}</dd></div><div><dt>紫外線</dt><dd>${w.now.uv.value} ${w.now.uv.level}</dd></div></dl>
      <dl class="ob"><div><dt>風</dt><dd>${w.obs.windDir} ${w.obs.windSpeed} m/s</dd></div><div><dt>濕度</dt><dd>${w.obs.humidity}%</dd></div>
        <div><dt>氣壓</dt><dd>${w.obs.pressure} hPa</dd></div><div><dt>今日累積雨量</dt><dd>${w.obs.rainToday} mm</dd></div></dl></div>`);

    for (let i = 0; i < 24; i += 3) {
      const h = w.hourly[i];
      add(h.time, 'hour', h.pop >= 50, `<time>${hh(h.time)}</time><div class="body">${icon(h.icon, '')}
        <strong>${deg(h.temp)}</strong><span>${h.weather}</span><span class="pop">${pct(h.pop)}</span></div>`);
    }

    // 日落是今天的，日出是明天早上的
    add(`2026-11-23T${w.sun.set}`, 'sun', rainyAt(`2026-11-23T${w.sun.set}`), `<time>${w.sun.set}</time><div class="body">${icon('sunset', '')}<p>日落</p></div>`);
    add(`2026-11-24T${w.sun.rise}`, 'sun', rainyAt(`2026-11-24T${w.sun.rise}`), `<time>${w.sun.rise}</time><div class="body">${icon('sunrise', '')}<p>日出</p></div>`);

    // 生活建議：已經開始的時段放在「現在」後面，其他放在開始的時間
    const starts = ['2026-11-23T12:00', '2026-11-23T18:00', '2026-11-24T06:00'];
    w.advice.forEach((a, i) => {
      const t = starts[i] < nowT ? `${nowT}+` : starts[i];
      add(t, 'advice', rainyAt(starts[i] < nowT ? nowT : starts[i]), `<time>${starts[i] < nowT ? '' : a.from}</time><div class="body">
        <h3>${a.label}<span>${a.from}–${a.to}${starts[i] < nowT ? '　進行中' : ''}</span></h3>
        <p>${a.weather}　<b>${deg(a.min)}–${deg(a.max)}</b>　<span class="pop">降雨 ${pct(a.pop)}</span></p><p>${a.comfort}</p>
        <ul>${a.items.map((it) => `<li>${ui(it.key)}${it.label}</li>`).join('')}</ul></div>`);
    });

    ev.sort((a, b) => (a.t < b.t ? -1 : a.t > b.t ? 1 : 0));
    const rows = ev.map((e) => `<li class="ev ${e.cls}${e.wet ? ' wet' : ''}${e.t > lastHour ? ' far' : ''}">${e.html}</li>`).join('');

    return `<header class="top"><h1>${w.town}<span>${w.county}</span></h1><p>從現在到 ${md(w.week[6].date)}，藍色的線是會下雨的時段</p></header>
      <ol class="line">${rows}</ol>`;
  }

  window.LAYOUTS.push({ key: 'timeline', name: '時間軸', render });
})();
