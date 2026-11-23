# 生活建議圖示 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 生活建議卡片改用 ref/0010 的圖示組（多薄外套、不適合曬衣），規則照設計文件。

**Architecture:** 純函式 `adviceItems` 多吃 `minT` 和 `night`；圖示是 `ui-icons.js` 裡的 inline SVG；`sections.js` 把 key 對到圖示。

**Tech Stack:** 原生 ES modules、`node --test`。

**Spec:** `docs/superpowers/specs/2026-11-23-advice-icons-design.md`（上層：`docs/superpowers/specs/2026-11-23-weather-site-design.md`）

## Global Constraints

- 不使用氣象署 App 的圖片；圖示自己畫，`stroke="currentColor"`，跟既有 `ui-icons.js` 同風格。
- 「現在幾點」和日夜判斷只用 Worker 給的台北時間 ISO 字串（`isNight(iso)`），不用瀏覽器時鐘。
- 網頁沒有編譯步驟。

## Review Focus

1. 22 度和 16 度、20 度和 16 度的邊界（`>=` / `<=` 寫反）。→ Task 1 的邊界測試。
2. 晚上時段判斷用錯欄位（應該用該卡片的 `start`）。→ Task 1 渲染驗證步驟。
3. 降雨機率缺值時誤顯示「不適合曬衣」。→ Task 1 測試 `null pop gives no umbrella and no laundry item`。
4. 4 個圖示在 390px 和 320px 寬時擠成兩行或被裁掉。→ Task 1 瀏覽器驗證。
5. 舊的 key（`light-long-sleeve`、`jacket`）留在對應表或 CSS 裡變成孤兒。→ 審查 diff。

---

### Task 1: 新規則和新圖示

**Files:**
- Modify: `site/js/logic/advice.js`, `site/js/render/ui-icons.js`, `site/js/render/sections.js`（`ADVICE_ICONS` 和呼叫 `adviceItems` 的地方）
- Test: `test/site/advice.test.js`（改寫）

**Interfaces:**
- Produces: `adviceItems({ maxT, minT, pop, weather, night }): {key, label}[]`
  - keys / labels：`short-sleeve` 短袖、`long-sleeve` 長袖、`heavy-coat` 厚外套、`light-jacket` 薄外套、`umbrella` 帶雨傘、`laundry` 適合曬衣、`no-laundry` 不適合曬衣
  - 順序：穿著 → 薄外套 → 帶雨傘 → 曬衣
- Consumes: `isNight(iso)`（`site/js/logic/icons.js`）；`sections.js` 呼叫 `adviceItems({ ...p, night: isNight(p.start) })`

- [ ] **Step 1: 改寫失敗測試** `test/site/advice.test.js`

```js
const L = a => adviceItems(a).map(i => i.label);
test('ref 0002 daytime card', () => assert.deepEqual(L({maxT:26, minT:18, pop:20, weather:'多雲時晴', night:false}), ['短袖', '適合曬衣']));
test('ref 0010 evening card', () => assert.deepEqual(L({maxT:22, minT:20, pop:70, weather:'短暫陣雨', night:true}), ['短袖', '薄外套', '帶雨傘', '不適合曬衣']));
test('ref 0010 tomorrow card', () => assert.deepEqual(L({maxT:20, minT:18, pop:100, weather:'陣雨', night:false}), ['長袖', '帶雨傘', '不適合曬衣']));
test('clothing boundaries', () => {
  const c = t => L({maxT:t, minT:null, pop:null, weather:'多雲', night:false});
  assert.deepEqual(c(22), ['短袖']); assert.deepEqual(c(21), ['長袖']); assert.deepEqual(c(16), ['長袖']);
  assert.deepEqual(c(15), ['厚外套']); assert.deepEqual(c(null), []);
});
test('light jacket boundaries', () => {
  const j = (minT, night) => L({maxT:24, minT, pop:null, weather:'多雲', night}).includes('薄外套');
  assert.equal(j(20, true), true); assert.equal(j(21, true), false);
  assert.equal(j(16, false), true); assert.equal(j(17, false), false);
  assert.equal(j(null, true), false);
});
test('no light jacket with heavy coat', () => assert.deepEqual(L({maxT:12, minT:8, pop:null, weather:'陰', night:true}), ['厚外套']));
test('umbrella at 50%', () => { /* 50 含 帶雨傘、49 不含 */ });
test('laundry vs no-laundry', () => {
  const w = (pop, weather) => L({maxT:null, minT:null, pop, weather, night:false});
  assert.deepEqual(w(20, '多雲'), ['適合曬衣']); assert.deepEqual(w(21, '多雲'), ['不適合曬衣']);
  assert.deepEqual(w(20, '多雲短暫雨'), ['不適合曬衣']);
});
test('null pop gives no umbrella and no laundry item', () => assert.deepEqual(L({maxT:null, minT:null, pop:null, weather:'雨', night:false}), []));
test('keys', () => assert.deepEqual(adviceItems({maxT:22, minT:20, pop:70, weather:'雨', night:true}).map(i => i.key), ['short-sleeve', 'light-jacket', 'umbrella', 'no-laundry']));
```

- [ ] **Step 2: 跑 `node --test test/site/advice.test.js`，確認失敗**
- [ ] **Step 3: 改 `advice.js`**（規則見 spec 表格）
- [ ] **Step 4: 跑 `node --test test/site/advice.test.js`，全部通過**
- [ ] **Step 5: 圖示和對應表**

`ui-icons.js` 新增或改寫：`shortSleeve`（保留）、`longSleeve`（毛衣）、`lightJacket`（開襟外套）、`heavyCoat`、`umbrella`（收起來直立的傘，參考 0010）、`laundry`（曬衣繩上兩件衣服）、`noLaundry`（同上加斜線）。刪掉不再用的 `lightLongSleeve`、`jacket` 匯出。`sections.js` 的 `ADVICE_ICONS` 對到 7 個新 key，呼叫改成 `adviceItems({ ...p, night: isNight(p.start) })`。

- [ ] **Step 6: 全部測試** `npm test` 全部通過
- [ ] **Step 7: 瀏覽器確認**

`wrangler dev` + `http-server` 起來，390×844 和 320 寬截圖生活建議區塊，跟 `ref/0010.png` 比對：圖示風格、一行 4 個、文字。再用 DevTools 把某張卡片資料改成晚上 20 - 22°、降雨 70%（或在 console 呼叫 render 用假資料）確認出現 4 個圖示且沒有換行。結束後停掉所有伺服器（含 workerd.exe）。

- [ ] **Step 8: Commit** `git commit -m "feat(site): advice icons per ref 0010 (light jacket, no-laundry)"`（連同兩份 docs）

---

### Task 2: 雲的邊線調深（使用者選 D）

**Files:**
- Modify: `site/icons/weather/fill/{cloudy,fog,overcast,partly-cloudy-day,partly-cloudy-night,rain,snow,thunderstorms-rain}.svg`
- Test: `test/site/icon-files.test.js`

**Interfaces:** 無（只改 SVG 檔內的顏色）

- [ ] **Step 1: 寫失敗測試** `test/site/icon-files.test.js`

```js
const DIR = 'site/icons/weather/fill/';
const CLOUDY = ['cloudy','fog','overcast','partly-cloudy-day','partly-cloudy-night','rain','snow','thunderstorms-rain'];
test('cloud outlines are dark enough for grey cards', () => {
  for (const f of CLOUDY) {
    const s = readFileSync(DIR + f + '.svg', 'utf8');
    assert.ok(!s.includes('#e6effc') && !s.includes('#deeafb'), f);
    assert.ok(s.includes('stroke="#a3b1c6"') && s.includes('stop-color="#cfdbec"'), f);
  }
});
test('cloudless icons are untouched', () => { /* clear-day、clear-night、sunrise、sunset 不含 #a3b1c6 */ });
```

- [ ] **Step 2: 跑 `node --test test/site/icon-files.test.js`，確認失敗**
- [ ] **Step 3: 在 8 個檔做兩個顏色替換**（只換這兩個值）
- [ ] **Step 4: 跑測試通過，再跑 `npm test`**
- [ ] **Step 5: 瀏覽器確認** 390×844：生活建議卡片、7 日預報、7 日面板、72 小時面板、最上方大圖示的雲邊線都看得清楚，截圖存 `.superpowers/sdd/2026-11-23-advice-icons/shots/task2-*.png`；停掉所有伺服器。
- [ ] **Step 6: Commit** `git commit -m "fix(site): darken cloud outlines in fill icons for contrast on grey cards"`（連同 spec 和 plan 的補充）
