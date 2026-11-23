# 首頁改成組合版排法 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把網站首頁（`site/`）的排法和樣式換成原型的「組合版」，資料照舊用 Worker API。

**Architecture:** 直接改網站現有的畫面程式（`site/js/render/hero.js`、`sections.js`）和 `site/css/style.css`、`site/index.html`。能寫成純函式的部分（溫度色階、日期文字、觀測項目清單）放進 `site/js/logic/format.js` 並寫測試；畫面用 `h()` 建元素，在瀏覽器用真的 API 資料量過。

**Tech Stack:** 原生 ES module、`node --test`、不加套件。

**Spec:** `docs/superpowers/specs/2026-11-23-homepage-combo-design.md`

## Global Constraints

- 樣式數值以 `docs/weather-layout-claude/layouts/00-combo.css` 為準；下面每個任務寫出網站的選擇器對應原型的哪條規則。
- 卡片：底色 `#f6f7f9`、1px 框 `#e2e5ea`、6px 圓角、內距 15px 12px；`:root` 的 `--card`、`--line` 換成這兩個值。
- 首頁左右內距 13px，各區相隔 20px，溫度卡片和三格相隔 8px。
- 區塊標題在卡片外、卡片上方 8px，18px 粗體；副標題 13px `--text-2`；逐小時、7 日的標題右邊有「詳細預報 >」。
- 缺值一律顯示 `--`，不拿別的數字補；氣象署來的文字一律用 `textContent`，不用字串拼 HTML。
- 實測（觀測溫度、濕度、風、累積雨量、氣壓）和預報不能標錯；實測值的測站名稱要出現在畫面上。
- 320px 到 480px 寬都不能有橫向捲軸。
- 不改 Worker、API 格式、72 小時面板、7 日面板、地點選單、精簡列（`#compact`）的外觀。

## Review Focus

1. 某一份資料抓不到（`threeDay`、`weekly`、`observation`、`sun` 是 `null`）：那一區顯示「暫時無法取得」，其他區照常顯示；溫度卡片的溫度顯示「--°C」。
2. 實測項目來自不同測站、或某一項缺值：「目前觀測」每格寫自己的測站，缺值那格顯示 `--` 而且不寫測站；頁尾列出溫度、風向、濕度的測站。
3. 晚上打開：7 日的「今天」只有晚上的預報，三格的紫外線名稱是「明天紫外線」，溫度卡片的圖示用晚上的。
4. 很長的天氣現象（例如「多雲時陰短暫陣雨或雷雨」）在 320px 寬：在溫度卡片右欄裡換行，不超出卡片。
5. 換地點之後：鍵盤焦點回到選單圖示按鈕，不會掉到頁面最上面。

第 2 項由 Task 1 的 `obsItems` 測試涵蓋；第 1、3、4、5 項在 Task 5 的瀏覽器檢查逐項確認。

---

### Task 1: 溫度色階、日期文字、觀測項目清單

**Files:**
- Modify: `site/js/logic/format.js`
- Test: `test/site/format.test.js`

**Interfaces:**
- Produces:
  - `tempColor(t: number) => string`：`#rrggbb`，色階點 `[[0,'#5f84ba'],[16,'#8cc1f2'],[20,'#f3aa94'],[40,'#ca6360']]`，0 以下、40 以上取端點，中間照比例混色（演算法照 `docs/weather-layout-claude/parts.js`）。
  - `tempGradient(min: number, max: number) => string`：`linear-gradient(90deg, <色> 0%, …, <色> 100%)`，兩端加上 `min`、`max` 之間經過的色階點（照 `parts.js`）。
  - `dateLabel(iso: string) => string`：`'2026-11-23T16:10:00+08:00'` → `'11 月 23 日・星期一'`，星期用現有的 `weekdayChar`。
  - `obsItems(obs) => Array<{ label, value, unit, station }>`：固定 5 項、固定順序 濕度（`humidity`，`%`）、風速（`windSpeed`，`m/s`）、風向（`windDirection`，無單位）、氣壓（`pressure`，`hPa`）、今天累積雨量（`rainToday`，`mm`）。`value` 是字串；數值缺（不是 number，風向不是非空字串）時 `value` 是 `'--'`、`unit` 和 `station` 是 `''`；`obs` 是 `null` 時 5 項都是缺值。

- [ ] **Step 1: 寫失敗的測試**（加在 `test/site/format.test.js`，import 加上四個新名字）

```js
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const lum = (hex) => { const [r, g, b] = rgb(hex).map((c) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };

test('tempColor: blue up to 15°, red from 21°, light everywhere', () => {
  for (const t of [0, 8, 15]) { const [r, , b] = rgb(tempColor(t)); assert.ok(b > r, `${t}`); }
  for (const t of [21, 30, 40]) { const [r, , b] = rgb(tempColor(t)); assert.ok(r > b, `${t}`); }
  for (let t = 0; t <= 40; t++) assert.ok(lum(tempColor(t)) >= 0.2, `${t} ${tempColor(t)}`);
  assert.equal(tempColor(-5), tempColor(0)); assert.equal(tempColor(45), tempColor(40));
});
test('tempGradient: every stop is that temperature on the scale', () => {
  for (const [min, max] of [[19, 24], [17, 20], [16, 21], [10, 30]]) {
    const stops = tempGradient(min, max).match(/linear-gradient\(90deg, (.*)\)/)[1].split(', ').map((x) => x.split(' '));
    assert.equal(stops[0][1], '0%'); assert.equal(stops.at(-1)[1], '100%');
    for (const [color, at] of stops) {
      const want = rgb(tempColor(min + (parseFloat(at) / 100) * (max - min)));
      rgb(color).forEach((c, k) => assert.ok(Math.abs(c - want[k]) <= 1, `${min}-${max} ${at}`));
    }
  }
  assert.match(tempGradient(16, 21), /#f3aa94 80%/);
});
test('dateLabel', () => {
  assert.equal(dateLabel('2026-11-23T16:10:00+08:00'), '11 月 23 日・星期一');
  assert.equal(dateLabel('2026-12-01T06:00:00+08:00'), '12 月 1 日・星期二');
  assert.equal(dateLabel('2027-01-01T00:30:00+08:00'), '1 月 1 日・星期五');
});
test('obsItems: each item keeps its own station; missing values show -- with no station', () => {
  const o = (value, station) => ({ value, station, time: '2026-11-23T16:00:00+08:00' });
  const items = obsItems({ time: '2026-11-23T16:00:00+08:00', humidity: o(68, '臺北'), windSpeed: o(2.5, '五股'),
    windDirection: o('東北風', '五股'), pressure: o(null, '臺北'), rainToday: null });
  assert.deepEqual(items.map((x) => x.label), ['濕度', '風速', '風向', '氣壓', '今天累積雨量']);
  assert.deepEqual(items[0], { label: '濕度', value: '68', unit: '%', station: '臺北' });
  assert.deepEqual(items[1], { label: '風速', value: '2.5', unit: 'm/s', station: '五股' });
  assert.deepEqual(items[2], { label: '風向', value: '東北風', unit: '', station: '五股' });
  assert.deepEqual(items[3], { label: '氣壓', value: '--', unit: '', station: '' });
  assert.deepEqual(items[4], { label: '今天累積雨量', value: '--', unit: '', station: '' });
  assert.ok(obsItems(null).every((x) => x.value === '--' && x.station === ''));
});
```

- [ ] **Step 2: 確認失敗**

Run: `node --test test/site/format.test.js`
Expected: FAIL（`tempColor` 等名字不存在，import 出錯）

- [ ] **Step 3: 在 `site/js/logic/format.js` 實作四個 export**（簽名照上面 Interfaces；`tempColor`、`tempGradient` 照原型 `parts.js` 的寫法）

- [ ] **Step 4: 確認通過**

Run: `node --test test/site/format.test.js`
Expected: PASS；再跑 `npm test`，全部通過

- [ ] **Step 5: Commit**

```bash
git add site/js/logic/format.js test/site/format.test.js
git commit -m "feat(site): temperature color scale, date label and observation items"
```

---

### Task 2: 頁面骨架、全站卡片樣式、溫度卡片、三格數字

**Files:**
- Modify: `site/index.html`、`site/js/render/hero.js`、`site/js/render/sections.js`（`renderNowTiles`）、`site/js/main.js`、`site/css/style.css`

**Interfaces:**
- Consumes: `dateLabel`（Task 1）
- Produces:
  - `index.html` 的 `<main class="col">` 裡依序：`#compact`、`<div class="lead">`（裡面 `#hero`、`#now`）、`#hourly`、`#weekly`、`#advice`、`#obs`、`#sun`、`<footer class="footer">`（裡面 `<p id="data-time" class="data-time">`、`<p>資料來源：中央氣象署</p>`）。id 都不變，`main.js` 的 `sections` 清單不用改。
  - 選單圖示按鈕 `id="menu"`；`main.js` 換完地點後 `document.getElementById('menu')?.focus()`。
  - `renderHero` 簽名不變。`#hero` 本身是卡片框（載入中、錯誤訊息也在這個框裡）；`renderHero` 在裡面放 `div.hero-card`（左右兩欄）。精簡列用的 `panel()` 保留。

- [ ] **Step 1: 改 `index.html` 的順序**（照上面 Produces）

- [ ] **Step 2: 改 `renderHero`**：`#hero` 裡放 `div.hero-card`：
  - 左欄 `div.hero-text`：`div.place`（`${county} ${town}`，一般文字，不是按鈕）、`div.hero-date`（`dateLabel(generatedAt)`）、`div.temp`（數字或 `--`，後面 `span.unit` 寫「°C」）、`div.hero-range`（「未來 24 小時 ${deg(min)}–${deg(max)}」）。
  - 右欄 `div.hero-look`：天氣圖示 `img.hero-look-icon`（`iconUrl(iconKey(weather), { night: isNight(generatedAt) })`，沒有天氣現象就不放）、`div.hero-weather`（天氣現象或 `--`）。
  - 卡片右上角 `button.menu-btn#menu`（`aria-label="選擇地點"`，內容是現有的 `menu` 圖示），點了 `onOpenPicker`。
  - 拿掉舊的風向濕度那一行（風向、濕度在「目前觀測」）。

- [ ] **Step 3: 改 `renderNowTiles`**：`dl.stats`，三個 `div`，每個 `dt` + `dd`；順序 降雨機率（`pct(current.pop)`）、體感溫度（數字 + `small` 「°C」）、紫外線（名稱用 `weekly.uv.label`，數值 + `small` 等級）。兩份資料都沒有時照舊 `renderUnavailable(el, '目前天氣')`。

- [ ] **Step 4: `main.js`** 的焦點改成 `#menu`。

- [ ] **Step 5: CSS**（數值照原型）

| 網站選擇器 | 原型規則 |
|---|---|
| `:root` 的 `--card`、`--line` | `.v-combo` 的 `--card`、`--line` |
| `.col` | 內距 13px；`display: grid; gap: 20px; align-content: start`（載入中時各列才不會被拉高） |
| `.lead` | `.v-combo .lead` |
| `#hero`（卡片框，`position: relative`） | `.v-combo .now` 的底色、框、圓角、最小高度 200px |
| `.hero-card` | `.v-combo .now` 的 `grid-template-columns` |
| `.hero-text`、`.place`、`.hero-date`、`.temp`、`.temp .unit`、`.hero-range` | `.now-text`、`.place`、`.date`、`.temp`、`.temp .unit`、`.range` |
| `.hero-look`、`.hero-look-icon`、`.hero-weather` | `.now-icon`、`.now-icon img`、`.cond` |
| `.menu-btn` | 絕對定位在 `#hero` 右上角（top 6px、right 6px），其他照網站現在 |
| `dl.stats` 系列 | `.v-combo .stats` 系列 |
| `@media (max-width: 359px)` 的 `.place`、`.stats small` | 原型同一個 media 裡的兩條 |

  舊的 `.hero`、`.hero-panel`、`.hero-icon`、`.hero-wind`、`.place`（按鈕樣式）規則：精簡列還在用的 `.hero-panel`、`.hero-icon` 改成只套用在 `.compact` 裡，其他刪掉。`.data-time` 改成置中、上下不留額外間距。

- [ ] **Step 6: 瀏覽器確認**

Run: `npx --yes http-server@14.1.1 site -a localhost -p 8000 -c-1`（背景執行），打開 `http://localhost:8000/`，在 480、390、360、320px 寬的 iframe 裡量：
Expected: 溫度卡片左右兩欄、右上角選單圖示能打開地點選單；三格順序是降雨機率、體感溫度、紫外線；沒有橫向捲軸。

- [ ] **Step 7: `npm test` 全部通過後 Commit**

```bash
git add site/index.html site/js/render/hero.js site/js/render/sections.js site/js/main.js site/css/style.css
git commit -m "feat(site): homepage frame, combo card style, temperature card and stats"
```

---

### Task 3: 區塊標題、逐小時預報

**Files:**
- Modify: `site/js/render/sections.js`（`sectionHead`、`renderHourly`）、`site/css/style.css`

**Interfaces:**
- Produces: `sectionHead(title, onDetail, sub)`（模組內部用）：`div.sec-head` 裡 `h2`（標題，有 `sub` 時後面接 `span` 副標題）和選擇性的 `button.more`。Task 4、5 會用 `sub`。

- [ ] **Step 1: `sectionHead` 加 `sub` 參數。**
- [ ] **Step 2: `renderHourly`**：每格元素順序改成 時間（`hourLabel` 不變）、圖示（`style` 改成 fill，也就是拿掉 `style: 'line'`）、氣溫、降雨機率；不是第一格而且時間是 `T00:00` 的格子加 class `day-start`。資料照舊用 `threeDay.hourly` 全部。
- [ ] **Step 3: CSS**：

| 網站選擇器 | 原型規則 |
|---|---|
| `.card` | `.v-combo .card`（框、6px 圓角、內距 15px 12px） |
| `.sec-head`、`.sec-head h2`、`.sec-head h2 span`、`.more` | `.v-combo .sec-head`、`.sec h2`、`.sec h2 span`、`.more`（`margin: 0 2px 8px`，不再用 24px 上緣） |
| `.unavailable` | 底色、框、圓角跟 `.card` 一樣 |
| `.hourly-strip`、`.hour`、`.hour.day-start`、`.hour-time`、`.hour-icon`、`.hour-temp`、`.hour-pop` | `.strip`、`.hour`、`.hour.day-start`、`.hour time`、`.hour img`、`.hour b`、`.hour span` |

  `.hour-icon` 的 `filter` 刪掉。
- [ ] **Step 4: 瀏覽器確認**（同 Task 2 Step 6 的做法）
Expected: 標題在卡片外；「詳細預報 >」打開 72 小時面板；第一格「現在」、其他「18時」；午夜那格有日期和左邊直線；圖示是彩色的 fill 樣式。
- [ ] **Step 5: `npm test` 全部通過後 Commit**

```bash
git add site/js/render/sections.js site/css/style.css
git commit -m "feat(site): section titles outside cards and combo hourly strip"
```

---

### Task 4: 7 日預報

**Files:**
- Modify: `site/js/render/sections.js`（`renderWeekly`）、`site/css/style.css`

**Interfaces:**
- Consumes: `tempGradient`（Task 1）、`tempBar`、`dayRow`、`SHOW_WEEK_POP_AT`（現有）

- [ ] **Step 1: `renderWeekly`**：每天一行 `div.week-row`：`div.week-label`（`d.label`）、天氣圖示、`div.week-pop`（`r.pop >= SHOW_WEEK_POP_AT` 時寫「N%」，否則空字串）、`div.week-temps`（`span` 最低溫、`div.week-bar`、`span` 最高溫）。`.week-bar` 裡的 `span` 用 `style.left = b.left%`、`style.width = b.width%`、`style.background = tempGradient(r.min, r.max)`（`b = tempBar(...)`，跟現在一樣用整週範圍）。拿掉日期、紫外線、體感那一行（`week-date`、`week-extra`）。
- [ ] **Step 2: CSS**：

| 網站選擇器 | 原型規則 |
|---|---|
| `.week-list`、`.week-row`、`.week-row + .week-row` | `.week li`、`.week li + li`（`32px 32px 30px 1fr`） |
| `.week-label`、`.week-row img`、`.week-pop` | `.w-day`、`.week img`、`.w-pop` |
| `.week-temps`、`.week-temps > span:last-child`、`.week-bar`、`.week-bar span` | `.w-temps`、`.w-temps b:last-child`、`.w-bar`、`.w-bar i`（6px 高、3px 圓角、左邊 16px） |

  舊的 `.week-day`、`.week-look`、`.week-right`、`.week-date`、`.week-extra` 規則和 `@media (max-width: 379px)` 裡的三條 week 規則刪掉（advice 那條留著）。
- [ ] **Step 3: 瀏覽器確認**
Expected: 七天的最低溫、最高溫上下對齊；低於 30% 的降雨機率不顯示；彩色段 18° 以下偏藍、以上偏紅；「詳細預報 >」打開 7 日面板；320px 寬時溫度條至少 40px。
- [ ] **Step 4: `npm test` 全部通過後 Commit**

```bash
git add site/js/render/sections.js site/css/style.css
git commit -m "feat(site): combo 7-day rows with fixed temperature columns and color scale"
```

---

### Task 5: 生活建議、目前觀測、日出日落、整頁檢查

**Files:**
- Modify: `site/js/render/sections.js`（`renderAdvice`、`renderObsTiles`、`renderSun`）、`site/css/style.css`

**Interfaces:**
- Consumes: `obsItems`（Task 1）、`sectionHead(title, onDetail, sub)`（Task 3）

- [ ] **Step 1: `renderAdvice`** 內容不變；CSS `.advice-row` 對應 `.advs`（左右 `-13px`、內距 13px、間距 12px），`.advice-card` 對應 `.advs article`（灰底、1px 框、6px 圓角、寬 86%、內距 18px 20px）。
- [ ] **Step 2: `renderObsTiles`**：`sectionHead('目前觀測', null, obs.time ? \`實測 ${hhmm(obs.time)}\` : '')` 加上 `div.card.obs-card`，裡面 `dl`，每個 `obsItems(obs)` 一個 `div`：`dt`（名稱）、`dd`（數值，有單位時後面接 `small`）、`div.obs-station`（`station` 不是空字串才寫「${station}測站」）。`observation` 是 `null` 時 `renderUnavailable(el, '目前觀測')`。CSS 照原型 `.obs dl`、`.obs dt`、`.obs dd`、`.obs small`；`.obs-station` 11px `--muted`、上緣 2px。
- [ ] **Step 3: `renderSun`**：前面加 `sectionHead('日出日落')`；`.sun-card` 的內距照 `.card`，底部 8px。
- [ ] **Step 4: 舊規則清理**：`.tiles`、`.tile*` 留著（7 日面板在用），`#obs, #sun { margin-top }` 刪掉。
- [ ] **Step 5: 整頁瀏覽器檢查**（480、390、360、320px 寬，用真的 API）
  - 順序：溫度卡片、三格、逐小時、7 日、生活建議、目前觀測、日出日落、頁尾（測站和時間那一行、資料來源）。
  - 四種寬度都沒有橫向捲軸，瀏覽器沒有錯誤訊息。
  - Review Focus 1：在頁面的 console 用 `import('/js/render/sections.js')` 和 `import('/js/render/hero.js')`，拿真的資料把 `threeDay`、`weekly`、`observation`、`sun` 各設成 `null` 重畫一次：那一區顯示「暫時無法取得」，其他區照常；溫度缺值時顯示「--°C」。
  - Review Focus 3：把 `weekly.days[0].day` 設成 `null`、`weekly.uv.label` 設成「明天紫外線」、`generatedAt` 改成晚上 20:00 重畫：7 日「今天」用晚上的資料、三格名稱是「明天紫外線」、溫度卡片圖示是晚上的。
  - Review Focus 4：把 `threeDay.current.weather` 設成「多雲時陰短暫陣雨或雷雨」，在 320px 寬重畫：天氣現象在右欄裡換行，不超出卡片。
  - Review Focus 5：用鍵盤打開地點選單、選一個鄉鎮：載入完成後焦點在選單圖示按鈕上。
- [ ] **Step 6: `npm test` 全部通過後 Commit**

```bash
git add site/js/render/sections.js site/css/style.css
git commit -m "feat(site): combo advice, observations with stations, sun title, footer data time"
```
