// 「詳細預報」按鈕打開的面板。面板本身就是網站的 72 小時、7 日面板（site-panels.js，從 site/js 產生），
// 這裡只把原型的資料換成網站的欄位名稱。
(function () {
  const siteData = (w) => ({
    generatedAt: `${w.week[0].date}T${w.updated}`,
    threeDay: {
      hourly: w.hourly.map((x) => ({
        time: x.time, temperature: x.temp, apparentTemperature: x.feels, beaufort: x.beaufort, humidity: x.humidity,
        pop: x.pop, weather: x.weather, windDirection: x.windDir, comfort: x.comfort,
      })),
    },
    weekly: { days: w.week.map((d) => ({ label: d.label, date: d.date, day: d.day, night: d.night })) },
  });

  // 面板打開後，左右鍵留給面板裡的圖表選時刻，不拿來換排版（app.js 會略過 data-own-keys 裡的按鍵）
  const open = (name) => (w) => {
    window.SITE_PANELS[name](siteData(w));
    const sheets = document.querySelectorAll('.sheet-backdrop');
    if (sheets.length) sheets[sheets.length - 1].setAttribute('data-own-keys', '');
  };

  window.DETAIL = { siteData, hourly: open('open72hPanel'), weekly: open('open7dPanel') };
})();
