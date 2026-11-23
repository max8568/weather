# 10 種手機排版原型 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `docs/weather-layout-claude/` 做出 10 種手機寬度的天氣頁排版，共用同一份固定資料，最上方切換列可以換排版。

**Architecture:** 一般 `<script>`（不用 ES module，`file://` 才打得開）。`data.js` 放固定資料到 `window.WEATHER`；`parts.js` 放少量共用小工具到 `window.P`；每一種排版是 `layouts/NN-key.js`，把 `{ key, name, render, mount }` 加進 `window.LAYOUTS`，樣式在同名 `.css`，全部選擇器以 `.v-<key>` 開頭；`app.js` 負責切換列、網址參數和鍵盤。

**Tech Stack:** 原生 HTML/CSS/JS、SVG、`node --test`（用 `node:vm` 載入一般 script 來測）。

**Spec:** `docs/superpowers/specs/2026-11-23-claude-layouts-design.md`

## Global Constraints

- 只做手機寬度：內容欄 `max-width: 480px` 置中，外側背景 `#eef0f3`。
- 配色只用網站 `:root` 的顏色：`--bg:#fff; --outside:#eef0f3; --card:#f5f5f7; --text:#1a1a1a; --text-2:#4a4a4f; --muted:#8a8a8e; --line:#e6e6ea; --pop:#1e6ccf; --sun:#f5a623; --max:#f08a3c; --min:#4a9ff5; --hero-panel:linear-gradient(180deg,#a8daf6,#d4ecfb)`。不加新的主色；可以用這些顏色的透明度變化。
- 字型：`-apple-system, "PingFang TC", "Microsoft JhengHei", "Noto Sans TC", sans-serif`。
- 天氣圖示用 `../../site/icons/weather/fill/<name>.svg`，不複製檔案。
- 實測值（觀測溫度、濕度、風向、風速、今日累積雨量、氣壓）和預報值（其他）在畫面上要分得出來：實測值旁邊或所在區塊標「臺北測站 16:00 觀測」或「實測」。
- 頁尾只寫「資料來源：中央氣象署」，不用氣象署標誌或 App 名稱。
- 不改 `site/`、`docs/weather-layout-prototype/`。不 push。
- 工作分支 `feat/claude-layouts`（從 `main` 開）。
- 畫面文字照 `~/.claude/CLAUDE.md` 的中文用語規則：白話、不用比喻詞。

## Review Focus

1. 320px 寬的手機出現橫向捲軸或文字被裁掉。→ 每個排版 task 的瀏覽器步驟量 `scrollWidth`。
2. 換排版後上一種留下東西：固定在底部的分頁列或面板、`document` 上的事件、捲動位置。→ Task 1 的 `mount` 回傳清理函式；Task 11 依序切 10 種檢查。
3. 鍵盤左右鍵在可橫向捲動的區域（第 4 種的左右滑動、橫向逐時列）裡被拿去換排版。→ Task 1 的 `app.js` 規則；Task 5 驗證。
4. 固定在底部的元素（第 2、9 種）在電腦上變成整個視窗寬，而不是 480px。→ Task 3、Task 10 的瀏覽器步驟在 1280px 寬檢查。
5. 用 `file://` 直接開，圖示路徑或 script 載入失敗。→ Task 11 用 `file://` 開。

---

### Task 1: 共用頁面、資料、測試，加上第 1 種「方塊拼貼」

**Files:**
- Create: `docs/weather-layout-claude/index.html`, `base.css`, `data.js`, `parts.js`, `app.js`, `layouts/01-bento.js`, `layouts/01-bento.css`
- Test: `test/weather-layout-claude/layouts.test.js`

**Interfaces:**
- Produces `window.WEATHER`（數值照下面，測試會用到）：
  ```
  { county:'臺北市', town:'中正區', updated:'16:10',
    obs: { station:'臺北', time:'16:00', temp:24, humidity:68, windDir:'東北風', windSpeed:2.5, rainToday:0.5, pressure:1016.2 },
    now: { weather:'多雲時晴', icon:'partly-cloudy-day', pop:20, uv:{ value:3, level:'中量級' }, feels:25 },
    next24h: { max:24, min:18 },
    hourly: [{ time:'2026-11-23T17:00', icon, weather, temp, pop }, …]   // 72 筆，到 11/26 16:00
    advice: [{ label, from, to, icon, weather, min, max, pop, comfort, items:[{ key, label }] }] × 3,
    week:   [{ date:'2026-11-23', label:'今天', icon, weather, max, min, pop }] × 7,
    sun: { rise:'06:16', set:'17:04' } }
  ```
  - `advice`：`今日白天 12:00–18:00 多雲時晴 22–24° 20% 舒適 [短袖, 適合曬衣]`；`今晚明晨 18:00–06:00 多雲短暫雨 19–22° 70% 稍有寒意至舒適 [短袖, 薄外套, 帶雨傘, 不適合曬衣]`；`明日白天 06:00–18:00 陰有雨 18–20° 90% 稍有寒意 [長袖, 帶雨傘, 不適合曬衣]`。item key 用 `short-sleeve`、`long-sleeve`、`light-jacket`、`umbrella`、`laundry`、`no-laundry`。
  - `week`：今天 11/23 多雲時晴 24/19 20%；週二 陰有雨 20/17 90%；週三 陰短暫雨 19/16 60%；週四 多雲 21/16 20%；週五 多雲時晴 23/17 10%；週六 晴 24/18 0%；週日 晴時多雲 24/18 10%。
  - `hourly`：可以在 `data.js` 用公式產生，但前 24 筆的最高、最低溫要剛好是 24 和 18；11/23 22:00 起轉雨（`rain`，降雨 70–90%），11/24 晚上起轉陰，11/25 下午起多雲。18:00–06:00 用 `-night` 圖示（`clear-night`、`partly-cloudy-night`）。
- Produces `window.P`：`icon(name, alt = '', cls = '') → '<img …>'`、`deg(v) → '24°'`、`pct(v) → '20%'`、`ui(key) → inline SVG 字串`（key 為上面 6 個 item key 加 `wind`，SVG 路徑從 `site/js/render/ui-icons.js` 複製）、`md('2026-11-24') → '11/24'`、`hh('2026-11-23T17:00') → '17:00'`。
- Produces `window.LAYOUTS: { key, name, render(w) → string, mount?(root, w) → (() => void) | void }[]`。`app.js` 把 `render` 的結果放進 `#app`、加上 class `v-<key>`，接著呼叫 `mount`；換排版前呼叫 `mount` 回傳的函式。
- `app.js` 規則：網址 `?v=<key>` 指定排版，找不到就開第一種；換排版時用 `history.replaceState` 更新網址並捲回頂端；左右鍵換排版，但焦點在 `input, select, textarea` 或任何帶 `data-own-keys` 的元素裡面時不換。

- [ ] **Step 1: 開分支** `git switch -c feat/claude-layouts`

- [ ] **Step 2: 寫失敗測試** `test/weather-layout-claude/layouts.test.js`

  用 `node:vm`：建立 `ctx = { window: {} }`，`ctx.window.window = ctx.window`，依序 `runInNewContext` 執行 `data.js`、`parts.js`、`layouts/*.js`（照檔名排序），`app.js` 不載入。

  ```js
  const EXPECTED = ['bento'];   // 之後每個 task 加一個 key
  test('layouts are registered in order', () => assert.deepEqual(W.LAYOUTS.map(l => l.key), EXPECTED));
  test('every layout shows all the data', () => {
    const MUST = ['中正區', '06:16', '17:04', '1016.2', '2.5', '68', '0.5', '中量級',
                  '今日白天', '今晚明晨', '明日白天', '週二', '週三', '週四', '週五', '週六', '週日', '實測'];
    for (const l of W.LAYOUTS) {
      const html = l.render(W.WEATHER);
      for (const s of MUST) assert.ok(html.includes(s), `${l.key} missing ${s}`);
    }
  });
  test('hourly has 72 entries and matches next24h', () => {
    const h = W.WEATHER.hourly; assert.equal(h.length, 72);
    const t = h.slice(0, 24).map(x => x.temp);
    assert.equal(Math.max(...t), 24); assert.equal(Math.min(...t), 18);
  });
  test('every icon file exists', () => { /* WEATHER 裡所有 icon 都在 site/icons/weather/fill/ */ });
  ```

- [ ] **Step 3: 跑測試確認失敗** `node --test test/weather-layout-claude/` → FAIL（檔案不存在）

- [ ] **Step 4: 寫 `index.html`、`base.css`、`data.js`、`parts.js`、`app.js`**

  `index.html`：`<header class="switcher">`（上一種、`<select>`、下一種）＋`<main id="app">`＋`<footer>資料來源：中央氣象署</footer>`，依序載入 `data.js`、`parts.js`、10 個 `layouts/*.js`（還沒有的先不放）、`app.js`，以及 `base.css` 和各排版的 CSS。`base.css` 放 Global Constraints 的顏色和字型、480px 內容欄、切換列（固定在頂端、寬度跟內容欄一樣）。

- [ ] **Step 5: 寫第 1 種 `layouts/01-bento.js`、`.css`**

  兩欄格線，方塊有大有小：大字溫度方塊佔兩欄；降雨、紫外線、體感、風、濕度、氣壓、累積雨量、日出日落各自一格；逐小時是佔兩欄的橫向捲動方塊；7 日和生活建議各佔兩欄。觀測值所在的方塊標「實測」。

- [ ] **Step 6: 跑測試確認通過** `node --test test/weather-layout-claude/` → PASS

- [ ] **Step 7: 瀏覽器檢查**

  在專案根目錄 `npx --yes http-server@14.1.1 . -p 8010 -c-1`，開 `http://localhost:8010/docs/weather-layout-claude/?v=bento`，視窗寬 390 和 320 各截圖一次。通過條件：圖示都有顯示、`document.documentElement.scrollWidth <= innerWidth`、console 沒有錯誤。

- [ ] **Step 8: Commit** `git add docs/weather-layout-claude test/weather-layout-claude docs/superpowers && git commit -m "feat(prototype): Claude layout shell, data snapshot, bento layout"`

---

### Task 2–10: 第 2 到第 10 種排版

每一種排版是一個 task，步驟都一樣：

- [ ] **Step 1:** 在測試的 `EXPECTED` 加上這個 key
- [ ] **Step 2:** `node --test test/weather-layout-claude/` → FAIL（`layouts are registered in order`）
- [ ] **Step 3:** 寫 `layouts/NN-key.js`、`.css`，在 `index.html` 加上兩個檔案
- [ ] **Step 4:** `node --test test/weather-layout-claude/` → PASS
- [ ] **Step 5:** 瀏覽器檢查，條件同 Task 1 Step 7，加上該 task 列出的檢查
- [ ] **Step 6:** Commit `feat(prototype): <name> layout`

| Task | 檔名 / key | 名稱 | 實作要點 | 額外檢查 |
|---|---|---|---|---|
| 2 | `02-tabbar` | 底部分頁 | 底部固定一排四個分頁：現在、逐時、7 日、生活。四個分頁的內容都在 `render` 的 HTML 裡，沒選中的加 `hidden`。觀測和日出日落放在「現在」。 | 1280px 寬時分頁列跟內容欄一樣寬；內容最後一行不被分頁列蓋住 |
| 3 | `03-timeline` | 時間軸 | 一條直線從現在往下：前 24 小時每 3 小時一個點，之後每天一個點。日出、日落、三個生活建議時段放在對應的時間位置。 | 日出日落出現在正確的位置（日落 17:04 在 17:00 之後） |
| 4 | `04-pages` | 左右滑動 | `scroll-snap-type: x mandatory`，一頁一類：現在、逐時、生活、7 日、觀測與日出日落。底下圓點標出目前頁數，點圓點可以換頁。滑動區加 `data-own-keys`，左右鍵在裡面換頁不換排版。 | 焦點在滑動區時按右鍵，換的是頁不是排版 |
| 5 | `05-chart` | 圖表優先 | 最上方 SVG：72 小時氣溫折線（`--max`）加降雨長條（`--pop`，透明度 .35），可橫向捲動，標出最高最低點。圖下方是數字列表。 | 320px 寬時座標文字不重疊 |
| 6 | `06-brief` | 白話摘要 | 開頭三到四句話，例如「今晚 10 點起會下雨，降雨機率 70%，出門帶傘」，句子裡的數字加粗。後面才是各區塊的數字。句子從 `WEATHER` 的數值組出來，不寫死。 | 句子照 CLAUDE.md 中文規則讀一遍 |
| 7 | `07-dial` | 24 小時圓盤 | SVG 圓盤，12 點鐘方向是 00:00，順時針走一圈 24 小時。外圈每小時一個點，用顏色深淺表示氣溫，有雨的時段在外圈畫藍色弧。日出到日落的白天用 `--hero-panel` 的淺藍扇形，指針指在 16:00。圓盤中間放觀測溫度。其他資料放在圓盤下面。 | 320px 寬時圓盤縮小但數字仍可讀 |
| 8 | `08-days` | 選日期 | 最上面一排 7 天按鈕（`aria-pressed`），點了下方換成那一天：今天、明天、後天顯示那天的逐小時；之後幾天只有那天的預報。觀測和生活建議固定放在最下方，不隨日期改變。 | 點週二後，畫面上的資料是 11/24 的 |
| 9 | `09-sheet` | 底部面板 | 整個畫面是 `--hero-panel` 背景加大字溫度和天氣圖示。底部面板預設只露出標題列（約 30% 高），點標題列或往上滑展開到 85%，再點收回。詳細資料都在面板裡。 | 1280px 寬時面板跟內容欄一樣寬；展開後面板內可捲動 |
| 10 | `10-accordion` | 摺疊清單 | 每一類一個 `<details>`，`<summary>` 是一行摘要（例如「7 日預報　週二起有雨　16°–24°」），預設全部收起，只有「現在」展開。 | 摘要那一行在 320px 寬時不換行或只換一次 |

---

### Task 11: 全部排版一起檢查

**Files:** 不新增檔案；只修這一步發現的問題。

- [ ] **Step 1:** 在 390px 寬，從第 1 種用「下一種」按到第 10 種再按回第 1 種。每換一次：畫面上只有這一種的東西（沒有上一種留下的底部分頁列或面板）、捲動位置在頂端、console 沒有錯誤。
- [ ] **Step 2:** 直接雙擊（`file://`）開 `docs/weather-layout-claude/index.html?v=dial` 和 `?v=sheet`，圖示都有顯示。
- [ ] **Step 3:** 10 張 390px 截圖並排看一次，確認 10 種的差別一眼看得出來；有兩種太像就回到那個 task 改。
- [ ] **Step 4:** 確認測試的 `EXPECTED` 是完整 10 個 key、順序跟上表一樣，`npm test` → 全部 PASS
- [ ] **Step 5:** Commit `fix(prototype): cross-layout check` （沒有修改就跳過）
