// Three shortlisted weather layouts that use the same public forecast snapshot.
(function weatherPrototype() {
  const weather = document.querySelector('#weather');
  const variantSelect = document.querySelector('#variant');
  const place = '臺北市 中正區';
  const dayIcon = 'clear-day';
  const hours = [
    ['16:00', dayIcon, 24, 20], ['17:00', dayIcon, 23, 20],
    ['18:00', 'clear-night', 23, 20], ['19:00', 'clear-night', 22, 20],
    ['20:00', 'clear-night', 22, 20], ['21:00', 'clear-night', 22, 20],
    ['22:00', 'clear-night', 21, 20], ['23:00', 'clear-night', 21, 20],
    ['00:00', 'rain', 21, 70], ['01:00', 'rain', 21, 70],
    ['02:00', 'rain', 21, 70], ['03:00', 'rain', 21, 70],
  ];
  const days = [
    ['今天', '11/23', 'partly-cloudy-day', '晴時多雲', 20, 26, 70],
    ['週二', '11/24', 'rain', '陰有雨', 17, 20, 100],
    ['週三', '11/25', 'rain', '陰短暫雨', 17, 19, 30],
    ['週四', '11/26', 'rain', '陰短暫雨', 18, 22, 0],
    ['週五', '11/27', 'cloudy', '多雲時陰', 18, 24, 0],
    ['週六', '11/28', 'overcast', '陰時多雲', 18, 24, 0],
    ['週日', '11/29', 'partly-cloudy-day', '晴時多雲', 18, 24, 0],
  ];
  const observations = [
    ['濕度', '53', '%'], ['風速', '2.5', 'm/s'], ['風向', '南風'],
    ['氣壓', '1014.9', 'hPa'], ['累積雨量', '0', 'mm'],
  ];
  const currentMetrics = [
    ['降雨機率', '20', '%'], ['體感溫度', '26', '°C'], ['紫外線', '6', '高量級'],
  ];
  const periods = [
    ['今日白天', '12:00–18:00', 'partly-cloudy-day', 22, 26, 20, '舒適', '可穿短袖，安排戶外活動。'],
    ['今晚明晨', '18:00–06:00', 'rain', 20, 22, 70, '稍有寒意至舒適', '晚間外出帶傘，備一件薄外套。'],
    ['明日白天', '06:00–18:00', 'rain', 18, 20, 90, '稍有寒意', '準備雨具，曬衣可改在室內。'],
  ];

  const degree = (value) => `${value}°`;
  const range = (low, high) => `${degree(low)}–${degree(high)}`;
  const condition = (key) => key === 'rain' ? '有雨' : '晴';
  const icon = (key, className = '', alt = '') =>
    `<img class="weather-icon ${className}" src="../../site/icons/weather/fill/${key}.svg" alt="${alt}" width="48" height="48">`;
  const panel = (title, body, className = '', extra = '') =>
    `<section class="panel ${className}"><div class="panel-heading"><h2>${title}</h2>${extra}</div>${body}</section>`;
  const location = (extra = '') => `<div class="location ${extra}"><h1>${place}</h1><p>11 月 23 日・星期一</p></div>`;
  const reading = () => '<strong class="temperature">26<span>°C</span></strong>';
  const shortStatus = () => '<p class="weather-status">晴 <span>未來 24 小時 19°–24°</span></p>';
  const mast = () => `<div class="mast">${location()}<div class="mast-reading">${icon(dayIcon)}${reading()}<span>晴</span></div></div>`;
  const hero = () => `<section class="hero">
    <div class="hero-copy">${location()}${reading()}${shortStatus()}</div>
    <div class="hero-art">${icon(dayIcon)}</div>
  </section>`;
  const metrics = (items, className = '') => `<dl class="metrics ${className}">${items.map(([label, value, unit]) =>
    `<div><dt>${label}</dt><dd>${value}${unit ? `<small>${unit}</small>` : ''}</dd></div>`).join('')}</dl>`;
  const actual = () => panel('目前觀測', metrics(observations, 'observation-metrics'), 'observation-panel');
  const daylightReadings = () => `<div class="daylight">
    <div>${icon('sunrise')}<span>日出</span><strong>06:16</strong></div>
    <div>${icon('sunset')}<span>日落</span><strong>17:04</strong></div>
  </div>`;
  const daylight = () => panel('日出日落', daylightReadings(), 'daylight-panel');

  function hourlyStrip() {
    return `<div class="hour-strip" tabindex="0" role="region" aria-label="逐小時預報，可橫向捲動">${hours.map(([time, look, temp, rain], i) =>
      `<div class="hour-cell${i === 8 ? ' new-day' : ''}"><time>${time}</time>${icon(look, '', condition(look))}
       <strong>${degree(temp)}</strong><small>${rain}%</small></div>`).join('')}</div>`;
  }

  function weekRows() {
    return `<ul class="week-rows">${days.map(([label, date, look, text, low, high, rain]) =>
      `<li><div class="week-date"><strong>${label}</strong><span>${date}</span></div>
       ${icon(look, '', text)}<span class="week-rain">${rain}%</span>
       <div class="range" aria-label="最低 ${low} 度，最高 ${high} 度">
         <span>${degree(low)}</span><i aria-hidden="true"><b style="--start:${(low - 17) * 11.11}%;--length:${(high - low) * 11.11}%"></b></i><strong>${degree(high)}</strong>
       </div></li>`).join('')}</ul>`;
  }

  function hourlyTable() {
    return `<table class="forecast-table">
      <thead><tr><th scope="col">時間</th><th scope="col">天氣</th><th scope="col">氣溫</th><th scope="col">降雨</th></tr></thead>
      <tbody>${hours.map(([time, look, temp, rain]) => `<tr><th scope="row">${time}</th>
        <td><span class="table-weather">${icon(look)}${condition(look)}</span></td><td>${degree(temp)}</td><td>${rain}%</td></tr>`).join('')}</tbody>
    </table>`;
  }

  function advice() {
    return `<div class="advice-row" tabindex="0" role="region" aria-label="生活建議，可橫向捲動">${periods.map(([label, time, look, low, high, rain, comfort, note]) =>
      `<article class="advice-card">
        <div class="advice-heading"><div><h3>${label}</h3><span>${time}</span></div>${icon(look)}</div>
        <p>${note}</p><div class="advice-facts"><strong>${range(low, high)}</strong><span>降雨 ${rain}%</span><span>${comfort}</span></div>
      </article>`).join('')}</div>`;
  }

  const hourlyPanel = () => panel('逐小時預報', hourlyStrip(), 'hourly-panel', '<span>氣溫 · 降雨機率</span>');
  const weeklyPanel = () => panel('7 日預報', weekRows(), 'weekly-panel', '<span>降雨 · 低溫 / 高溫</span>');
  const advicePanel = () => panel('生活建議', advice(), 'advice-panel');

  function overview() {
    return `<div class="dashboard">
      <div class="dashboard-primary">
        <div class="dashboard-lead">${hero()}${metrics(currentMetrics, 'metric-band')}</div>
        <div class="dashboard-hourly">${hourlyPanel()}</div>
        <div class="dashboard-advice">${advicePanel()}</div>
      </div>
      <div class="dashboard-secondary">
        <div class="dashboard-weekly">${weeklyPanel()}</div>
        <div class="dashboard-observation">${actual()}${daylight()}</div>
      </div>
    </div>`;
  }

  function dayDetail(index) {
    const [label, date, look, text, low, high, rain] = days[index];
    return `<div class="calendar-condition">${icon(look)}<div><h3>${label}・${date}</h3><p>${text}</p></div></div>
      ${metrics([['最低溫', low, '°C'], ['最高溫', high, '°C'], ['降雨機率', rain, '%']])}`;
  }

  function calendar() {
    return `${mast()}<section class="calendar"><div class="panel-heading"><h2>7 日預報</h2><span>選擇日期查看詳情</span></div>
      <div class="calendar-grid" role="group" aria-label="預報日期">${days.map(([label, date, look, text, low, high, rain], i) =>
        `<button type="button" data-day="${i}" aria-label="${label} ${date}，${text}，${low} 至 ${high} 度，降雨 ${rain}%" aria-pressed="${i === 0}">
          <strong>${label}</strong><span>${date}</span>${icon(look)}<b>${degree(high)}</b><small>${degree(low)}</small>
        </button>`).join('')}</div>
      <div class="calendar-detail" id="calendar-detail" aria-live="polite">${dayDetail(0)}</div>
    </section>${hourlyPanel()}${advicePanel()}<div class="two-columns">${actual()}${daylight()}</div>`;
  }

  function trends() {
    return `${mast()}<section class="trends"><div class="panel-heading"><h2>氣溫與降雨趨勢</h2><span>未來 12 小時</span></div>
      <div class="chart-block"><h3>氣溫 <small>°C</small></h3><canvas class="temperature-chart"
        aria-label="16:00 到 03:00，氣溫從 24 降至 21 度" role="img"></canvas></div>
      <div class="chart-block"><h3>降雨機率 <small>%</small></h3><canvas class="rain-chart"
        aria-label="前 8 小時降雨機率為 20%，午夜起為 70%" role="img"></canvas></div>
      <details class="chart-values"><summary>查看逐時數值</summary>${hourlyTable()}</details>
      </section><div class="trend-bottom">${weeklyPanel()}${advicePanel()}</div>
      <div class="two-columns">${actual()}${daylight()}</div>`;
  }

  const variants = [
    ['overview', '01　即時總覽', overview],
    ['calendar', '03　七日行事曆', calendar],
    ['trends', '06　趨勢圖表', trends],
  ];

  let current = 0;
  let chartObserver;

  function drawChart(canvas, isRain) {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const ratio = window.devicePixelRatio || 1;
    canvas.width = width * ratio;
    canvas.height = height * ratio;

    const context = canvas.getContext('2d');
    context.scale(ratio, ratio);
    const css = getComputedStyle(canvas);
    const labels = isRain ? [100, 50, 0] : [26, 23, 20];
    const left = 34;
    const right = 16;
    const top = 12;
    const floor = height - 30;
    const step = (width - left - right) / hours.length;
    const x = (i) => left + step * (i + 0.5);
    const y = (value) => floor - (value - labels[2]) / (labels[0] - labels[2]) * (floor - top);
    context.font = '12px system-ui, sans-serif';
    context.fillStyle = css.getPropertyValue('--muted');
    context.strokeStyle = css.getPropertyValue('--border');
    context.textAlign = 'right';
    context.textBaseline = 'middle';

    for (const value of labels) {
      context.fillText(value, left - 7, y(value));
      context.beginPath();
      context.moveTo(left, y(value));
      context.lineTo(width - right, y(value));
      context.stroke();
    }

    context.textAlign = 'center';
    const labelStep = width < 510 ? 3 : 1;
    for (let i = 0; i < hours.length; i += labelStep) context.fillText(hours[i][0], x(i), height - 12);

    if (isRain) {
      context.fillStyle = css.getPropertyValue('--faint');
      const barWidth = Math.min(step * 0.56, 40);
      hours.forEach((hour, i) => context.fillRect(x(i) - barWidth / 2, y(hour[3]), barWidth, floor - y(hour[3])));
      return;
    }

    context.strokeStyle = css.getPropertyValue('--ink');
    context.lineWidth = 2;
    context.beginPath();
    hours.forEach((hour, i) => context.lineTo(x(i), y(hour[2])));
    context.stroke();
    context.fillStyle = css.getPropertyValue('--ink');
    hours.forEach((hour, i) => {
      context.beginPath();
      context.arc(x(i), y(hour[2]), 3, 0, Math.PI * 2);
      context.fill();
    });
  }

  function render(index, changeUrl = false) {
    chartObserver?.disconnect();
    current = (index + variants.length) % variants.length;
    const [key, , view] = variants[current];
    weather.className = `layout layout-${key}`;
    weather.innerHTML = view();
    variantSelect.value = key;
    if (changeUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set('variant', key);
      url.hash = '';
      history.replaceState(null, '', url);
      window.scrollTo(0, 0);
    }
    if (key === 'trends') {
      chartObserver = new ResizeObserver((entries) => {
        for (const { target } of entries) drawChart(target, target.classList.contains('rain-chart'));
      });
      weather.querySelectorAll('canvas').forEach((canvas) => chartObserver.observe(canvas));
    }
  }

  weather.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-day]');
    if (!button) return;
    weather.querySelectorAll('[data-day]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    document.querySelector('#calendar-detail').innerHTML = dayDetail(Number(button.dataset.day));
  });

  variantSelect.innerHTML = variants.map(([key, label]) =>
    `<option value="${key}">${label}</option>`).join('');
  variantSelect.addEventListener('change', () => render(variantSelect.selectedIndex, true));
  document.querySelector('#previous').addEventListener('click', () => render(current - 1, true));
  document.querySelector('#next').addEventListener('click', () => render(current + 1, true));
  document.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey
      || event.target.closest('input, textarea, select, [contenteditable], .hour-strip, .advice-row')) return;
    const offset = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
    if (!offset) return;
    event.preventDefault();
    render(current + offset, true);
  });

  const requested = new URL(window.location.href).searchParams.get('variant');
  render(Math.max(0, variants.findIndex(([key]) => key === requested)));
})();
