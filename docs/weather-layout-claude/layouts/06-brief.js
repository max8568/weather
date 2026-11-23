// 6. 白話摘要：開頭幾句話講今天和明天要注意什麼，句子裡的數字加粗。數字的細節放在後面。
// 句子全部從 WEATHER 的數值組出來，資料換了句子也會跟著換。
(function () {
  const { icon, deg, pct, ui, md, hh, obsNote } = window.P;
  const b = (s) => `<b>${s}</b>`;

  // '2026-11-24T18:00' → 「明天傍晚 6 點」。today 是 'YYYY-MM-DD'。
  function when(iso, today) {
    const dayDiff = Math.round((Date.parse(iso.slice(0, 10)) - Date.parse(today)) / 86400000);
    const h = Number(iso.slice(11, 13));
    const clock = `${h % 12 || 12} 點`;
    if (dayDiff === 0 && h >= 19) return `今晚 ${clock}`;
    const day = ['今天', '明天', '後天'][dayDiff] || md(iso);
    const part = h < 6 ? '凌晨' : h < 12 ? '早上' : h < 17 ? '下午' : h < 19 ? '傍晚' : '晚上';
    return `${day}${part} ${clock}`;
  }

  const DO = {
    'short-sleeve': '穿短袖', 'long-sleeve': '穿長袖', 'light-jacket': '加一件薄外套',
    umbrella: '帶雨傘', laundry: '適合曬衣服', 'no-laundry': '衣服不適合在外面曬',
  };
  const join = (list) => (list.length > 1 ? `${list.slice(0, -1).join('、')}，${list[list.length - 1]}` : list[0] || '');

  function sentences(w) {
    const today = w.week[0].date;
    const out = [];
    out.push({ icon: icon(w.now.icon, ''), html: `現在 ${b(deg(w.obs.temp))}，${w.now.weather}，體感 ${b(deg(w.now.feels))}。接下來 24 小時在 ${b(deg(w.next24h.min))} 到 ${b(deg(w.next24h.max))} 之間。` });

    const i0 = w.hourly.findIndex((h) => h.pop >= 50);
    if (i0 >= 0) {
      let i1 = i0;
      while (i1 + 1 < w.hourly.length && w.hourly[i1 + 1].pop >= 50) i1++;
      const peak = Math.max(...w.hourly.slice(i0, i1 + 1).map((h) => h.pop));
      const end = w.hourly[i1 + 1];
      out.push({ icon: ui('umbrella'), html: `${b(when(w.hourly[i0].time, today))}起會下雨，降雨機率 ${b(pct(w.hourly[i0].pop))}，最高到 ${b(pct(peak))}${end ? `，${b(when(end.time, today))}以後降到 ${b(pct(end.pop))}` : ''}。出門帶傘。` });
    } else {
      out.push({ icon: icon('clear-day', ''), html: `接下來 72 小時降雨機率都在 50% 以下。` });
    }

    const drop = w.week[0].max - w.week[1].max;
    const tomorrow = w.advice.find((a) => a.label === '明日白天');
    const todo = tomorrow ? join(tomorrow.items.map((it) => DO[it.key])) : '';
    out.push({ icon: ui(drop > 0 ? 'long-sleeve' : 'short-sleeve'), html: `明天最高 ${b(deg(w.week[1].max))}，${drop > 0 ? `比今天低 ${b(`${drop} 度`)}` : drop < 0 ? `比今天高 ${b(`${-drop} 度`)}` : '跟今天差不多'}。${todo ? `明天白天${todo}。` : ''}` });

    const k = w.week.findIndex((d, i) => i >= 2 && d.pop <= 20 && d.weather.includes('晴'));
    if (k > 0) {
      const rest = w.week.slice(k);
      out.push({ icon: icon('partly-cloudy-day', ''), html: `${b(w.week[k].label)}起轉晴，降雨機率降到 ${b(pct(w.week[k].pop))}，之後幾天最高 ${b(deg(Math.max(...rest.map((d) => d.max))))}。` });
    }
    return out;
  }

  function render(w) {
    const every3 = w.hourly.slice(0, 24).filter((_, i) => i % 3 === 0);
    return `<header class="top"><p>${w.county}</p><h1>${w.town}</h1><p class="stamp">${md(w.week[0].date)} ${w.updated} 更新</p></header>
      <ol class="brief">${sentences(w).map((s) => `<li><span class="mark">${s.icon}</span><p>${s.html}</p></li>`).join('')}</ol>
      <p class="brief-note">溫度、風、濕度、氣壓、雨量是${obsNote(w)}，其他是預報。</p>

      <h2 class="sheet-title">數字</h2>
      <section class="sheet">
        <h3>現在</h3>
        <dl><div><dt>降雨機率</dt><dd>${pct(w.now.pop)}</dd></div><div><dt>體感溫度</dt><dd>${deg(w.now.feels)}</dd></div>
          <div><dt>紫外線</dt><dd>${w.now.uv.value} ${w.now.uv.level}</dd></div><div><dt>未來 24 小時</dt><dd>${deg(w.next24h.min)}–${deg(w.next24h.max)}</dd></div></dl>
      </section>
      <section class="sheet obs">
        <h3>${obsNote(w)}</h3>
        <dl><div><dt>溫度</dt><dd>${deg(w.obs.temp)}</dd></div><div><dt>風</dt><dd>${w.obs.windDir} ${w.obs.windSpeed} m/s</dd></div>
          <div><dt>濕度</dt><dd>${w.obs.humidity}%</dd></div><div><dt>氣壓</dt><dd>${w.obs.pressure} hPa</dd></div>
          <div><dt>今日累積雨量</dt><dd>${w.obs.rainToday} mm</dd></div></dl>
      </section>
      <section class="sheet">
        <h3>接下來 24 小時，每 3 小時</h3>
        <ol class="every3">${every3.map((h) => `<li><time>${hh(h.time).slice(0, 2)}時</time>${icon(h.icon, h.weather)}<b>${deg(h.temp)}</b><span>${pct(h.pop)}</span></li>`).join('')}</ol>
      </section>
      <section class="sheet">
        <h3>生活建議</h3>
        ${w.advice.map((a) => `<div class="adv"><p class="adv-t"><b>${a.label}</b>${a.from}–${a.to}</p>
          <p>${a.weather}，${deg(a.min)}–${deg(a.max)}，降雨 ${pct(a.pop)}，${a.comfort}</p>
          <p class="adv-i">${a.items.map((it) => `<span>${ui(it.key)}${it.label}</span>`).join('')}</p></div>`).join('')}
      </section>
      <section class="sheet">
        <h3>7 日預報</h3>
        <table class="week"><tbody>${w.week.map((d) => `<tr><th scope="row">${d.label}<small>${md(d.date)}</small></th>
          <td>${icon(d.icon, '')}</td><td class="wx">${d.weather}</td><td class="t">${deg(d.min)}–${deg(d.max)}</td><td class="p">${pct(d.pop)}</td></tr>`).join('')}</tbody></table>
      </section>
      <section class="sheet">
        <h3>日出日落</h3>
        <dl><div><dt>日出</dt><dd>${w.sun.rise}</dd></div><div><dt>日落</dt><dd>${w.sun.set}</dd></div></dl>
      </section>`;
  }

  window.LAYOUTS.push({ key: 'brief', name: '白話摘要', render });
})();
