// 原型用的固定天氣資料：臺北市中正區，2026-11-23 16:10 的快照。數值是自己編的，欄位跟網站一樣。
// obs 是臺北測站實際量到的數字，其他都是預報。
(function () {
  // 逐時氣溫，從 11/23 17:00 到 11/26 16:00，共 72 小時
  const TEMPS = [
    24, 23, 22, 22, 21, 21, 20,
    20, 20, 19, 19, 19, 18, 18, 18, 19, 19, 20, 20, 20, 20, 20, 19, 19, 19, 18, 18, 18, 17, 17, 17,
    17, 17, 16, 16, 16, 16, 16, 17, 17, 18, 18, 19, 19, 19, 19, 18, 18, 18, 17, 17, 17, 17, 16, 16,
    16, 16, 16, 16, 16, 16, 16, 17, 18, 19, 20, 21, 21, 21, 21, 20, 20,
  ];

  // 每個時間落在哪一段天氣：[到這個時間之前（不含）, 天氣, 白天圖示, 晚上圖示, 降雨機率]
  const SPELLS = [
    ['2026-11-23T18:00', '多雲時晴', 'partly-cloudy-day', 'partly-cloudy-night', 20],
    ['2026-11-23T22:00', '多雲', 'cloudy', 'cloudy', 20],
    ['2026-11-24T06:00', '短暫雨', 'rain', 'rain', 70],
    ['2026-11-24T18:00', '陰有雨', 'rain', 'rain', 90],
    ['2026-11-25T06:00', '陰', 'overcast', 'overcast', 30],
    ['2026-11-25T15:00', '陰短暫雨', 'rain', 'rain', 60],
    ['2026-11-26T08:00', '多雲', 'cloudy', 'cloudy', 20],
    ['2026-11-27T00:00', '多雲時晴', 'partly-cloudy-day', 'partly-cloudy-night', 10],
  ];

  const pad = (n) => String(n).padStart(2, '0');
  const hourly = TEMPS.map((temp, i) => {
    const t = new Date(Date.UTC(2026, 10, 23, 17 + i));
    const time = `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}T${pad(t.getUTCHours())}:00`;
    const [, weather, dayIcon, nightIcon, pop] = SPELLS.find(([until]) => time < until);
    const hour = t.getUTCHours();
    return { time, weather, icon: hour < 6 || hour >= 18 ? nightIcon : dayIcon, temp, pop };
  });

  window.WEATHER = {
    county: '臺北市',
    town: '中正區',
    updated: '16:10',
    obs: { station: '臺北', time: '16:00', temp: 24, humidity: 68, windDir: '東北風', windSpeed: 2.5, rainToday: 0.5, pressure: 1016.2 },
    now: { weather: '多雲時晴', icon: 'partly-cloudy-day', pop: 20, uv: { value: 3, level: '中量級' }, feels: 25 },
    next24h: { max: 24, min: 18 },
    hourly,
    advice: [
      { label: '今日白天', from: '12:00', to: '18:00', icon: 'partly-cloudy-day', weather: '多雲時晴', min: 22, max: 24, pop: 20, comfort: '舒適',
        items: [{ key: 'short-sleeve', label: '短袖' }, { key: 'laundry', label: '適合曬衣' }] },
      { label: '今晚明晨', from: '18:00', to: '06:00', icon: 'rain', weather: '多雲短暫雨', min: 19, max: 22, pop: 70, comfort: '稍有寒意至舒適',
        items: [{ key: 'short-sleeve', label: '短袖' }, { key: 'light-jacket', label: '薄外套' }, { key: 'umbrella', label: '帶雨傘' }, { key: 'no-laundry', label: '不適合曬衣' }] },
      { label: '明日白天', from: '06:00', to: '18:00', icon: 'rain', weather: '陰有雨', min: 18, max: 20, pop: 90, comfort: '稍有寒意',
        items: [{ key: 'long-sleeve', label: '長袖' }, { key: 'umbrella', label: '帶雨傘' }, { key: 'no-laundry', label: '不適合曬衣' }] },
    ],
    week: [
      { date: '2026-11-23', label: '今天', icon: 'partly-cloudy-day', weather: '多雲時晴', max: 24, min: 19, pop: 20 },
      { date: '2026-11-24', label: '週二', icon: 'rain', weather: '陰有雨', max: 20, min: 17, pop: 90 },
      { date: '2026-11-25', label: '週三', icon: 'rain', weather: '陰短暫雨', max: 19, min: 16, pop: 60 },
      { date: '2026-11-26', label: '週四', icon: 'cloudy', weather: '多雲', max: 21, min: 16, pop: 20 },
      { date: '2026-11-27', label: '週五', icon: 'partly-cloudy-day', weather: '多雲時晴', max: 23, min: 17, pop: 10 },
      { date: '2026-11-28', label: '週六', icon: 'clear-day', weather: '晴', max: 24, min: 18, pop: 0 },
      { date: '2026-11-29', label: '週日', icon: 'partly-cloudy-day', weather: '晴時多雲', max: 24, min: 18, pop: 10 },
    ],
    sun: { rise: '06:16', set: '17:04' },
  };
})();
