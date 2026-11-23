# 天氣預報網站 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 公開網站：選縣市和鄉鎮，看中央氣象署的預報和最近測站的實測值。網頁放 GitHub Pages，授權碼放 Cloudflare Worker。

**Architecture:** `site/` 是沒有編譯步驟的 HTML/CSS/ES modules，向 Worker 呼叫一個端點 `GET /api/forecast?county=&town=`。`worker/` 同時向氣象署要 5 份資料（36 小時、鄉鎮 3 天、鄉鎮 1 週、全測站觀測、日出日落），整理成一份 JSON 回傳。所有「整理」的邏輯是純函式，用 `node --test` 測。

**Tech Stack:** Node 24（內建 test runner）、Cloudflare Workers + wrangler `4.156.2`、Meteocons 圖示 `@bybas/weather-icons@2.0.0`（MIT）、GitHub Pages（GitHub Actions 部署）、圖表自己用 SVG 畫。

**Spec:** `docs/superpowers/specs/2026-11-23-weather-site-design.md`（每個 task 都要對照它）

## Global Constraints

- 授權碼不得出現在網頁、瀏覽器看得到的網路請求、或公開的程式碼裡。本機放 `worker/.dev.vars`（列入 `.gitignore`），正式環境用 `wrangler secret put CWA_API_KEY`。
- 不使用氣象署的標誌、App 名稱、App 裡的圖片。頁尾只寫「資料來源：中央氣象署」。`<title>` 是「天氣預報」。
- 預報值和實測值不能混用。實測值缺的時候顯示 `--`，不能拿預報值補。
- 縣市和鄉鎮的寫法跟氣象署一致（「臺北市」不是「台北市」）。
- 網頁沒有編譯步驟，放在 `site/`，不放在 `docs/`。
- 所有日期和時段判斷都用台北時間（UTC+8，沒有夏令時間）。Worker 跑在 UTC，不能用 `Date` 的本地時間 getter。
- 任何 `git push` 前先跑 `gh auth status`，確認帳號對目標 repo 有寫入權限；沒有就問使用者，不要自己切換。push 停住或 403 時回報錯誤，不要一直重試。
- 跟設計文件不同的地方：設計說「用 Cloudflare 的快取」，但 Cache API 在 `*.workers.dev` 網址上不會生效。這個計畫改用 Worker 模組層級的記憶體快取（每個執行個體各自一份，盡量減少請求）。時間：預報 30 分鐘、觀測 10 分鐘、日出日落 1 天。

## Review Focus

1. **台北凌晨的日期**：台北 00:00–08:00 時 UTC 還是前一天。`now = 2026-11-23T01:30+08:00`，時段開始 `2026-11-23 06:00` 要標「今日白天」，不能變成「明日白天」。→ Task 2 測試 `periodLabel uses Taipei date when UTC is still yesterday`。
2. **凌晨 0 點到 6 點打開**：36 小時預報第一段是 00:00–06:00，要標「今日凌晨」，不能出錯或標成「今晚明晨」。→ Task 2 測試 `periodLabel labels 00-06 period as 今日凌晨`。
3. **最近測站某一項是 -99**：溫度 -99、濕度正常時，溫度改用下一個最近的測站，濕度照用最近的；全部都沒有就是 `null`，網頁顯示 `--°`，不拿預報補。→ Task 4 測試 `picks nearest station per element, skipping -99`；Task 8 的 hero 驗證步驟。
4. **瀏覽器裡存了錯的地點**（例如舊的「台北市」或鄉鎮不屬於該縣市）：網頁要改用預設地點臺北市中正區，不能一直報錯。Worker 對未知縣市或鄉鎮回 400。→ Task 5 測試 `400 for unknown county`、`400 for unknown town`；Task 6 測試 `resolveLocation falls back to default for unknown names`。
5. **其中一份氣象署資料逾時或失敗**：其他區塊照常顯示，失敗的區塊顯示「暫時無法取得」；5 份全失敗才回 502。→ Task 5 測試 `one failing source yields null section and ok:false`、`all sources failing gives 502`。

---

## File Structure

```
.gitignore                      worker/.dev.vars、node_modules、.wrangler
package.json                    根目錄：{"type":"module"}，"test": "node --test"
README.md                       本機開發和部署步驟
.github/workflows/pages.yml     把 site/ 部署到 GitHub Pages
scripts/build-datasets.mjs      API 文件 → worker/src/datasets.js
scripts/capture-fixtures.mjs    用授權碼抓氣象署回應存成測試資料
scripts/build-towns.mjs         用授權碼產生 site/data/towns.json
worker/package.json             wrangler 4.156.2
worker/wrangler.toml
worker/src/index.js             路由、CORS、錯誤碼
worker/src/cwa.js               向氣象署取資料 + 記憶體快取
worker/src/datasets.js          （產生的）縣市 → 3 天 / 1 週資料集編號
worker/src/fields.js            氣象署欄位名稱，全部集中在這裡
worker/src/time.js              台北時間工具、時段名稱
worker/src/parse/series.js      氣象署「元素 → 時間序列」的通用解析
worker/src/parse/county36h.js
worker/src/parse/threeDay.js
worker/src/parse/weekly.js
worker/src/parse/observation.js
worker/src/parse/sun.js
worker/src/forecast.js          組合 5 份資料，處理部分失敗
worker/test/*.test.js
worker/test/fixtures/morning/   早上抓的真實回應
worker/test/fixtures/evening/   晚上抓的真實回應
site/index.html
site/css/style.css
site/js/config.js               Worker 網址
site/js/api.js
site/js/main.js                 啟動、狀態、地點記憶
site/js/logic/icons.js          天氣文字 → 圖示
site/js/logic/advice.js         生活建議規則
site/js/logic/format.js         溫度條、太陽位置、一週概況等
site/js/logic/location.js       地點驗證、預設值
site/js/chart.js                SVG 曲線、階梯圖
site/js/render/*.js             各區塊、面板、選單
site/icons/weather/{fill,line}/*.svg + LICENSE
site/data/towns.json
test/site/*.test.js             網頁純函式的測試
```

## Worker 回傳的 JSON（Task 5 產出，Task 6 以後使用）

```js
// 200
{
  county: "新北市", town: "五股區",
  generatedAt: "2026-11-23T09:27:00+08:00",
  sources: { county36h: {ok:true}, threeDay: {ok:true}, weekly: {ok:true}, observation: {ok:true}, sun: {ok:true} },
  county36h: null | Period36[3],
  threeDay:  null | { lat, lon, current: {weather, weatherCode, pop, apparentTemperature}, next24h: {max, min}, hourly: HourPoint[] },
  weekly:    null | { days: Day[], uv: {value, level, label} | null },
  observation: null | { time, temperature: Obs|null, humidity: Obs|null, windDirection: Obs|null, windSpeed: Obs|null, pressure: Obs|null, rainToday: Obs|null },
  sun:       null | { date: "2026-11-23", sunrise: "06:16", sunset: "17:04" }
}
// Period36  = { label, start, end, weather, weatherCode, pop, minT, maxT, comfort }
// HourPoint = { time, temperature, apparentTemperature, humidity, beaufort, windDirection, comfort, weather, weatherCode, pop }
// Day       = { date: "YYYY-MM-DD", label: "今天"|"週二"…, day: Half|null, night: Half|null }
// Half      = { start, end, weather, weatherCode, maxT, minT, maxAT, minAT, pop, humidity, beaufort, windDirection, uv, uvLevel }
// Obs       = { value, station, time }   windDirection 的 value 是文字（「東北風」）
// 所有時間是帶 +08:00 的 ISO 字串；數字缺值是 null。
// 錯誤：{ error: "訊息" }，400 / 404 / 502 / 500
```

---

### Task 1: 專案骨架、資料集對照表、真實測試資料

**Files:**
- Create: `.gitignore`, `package.json`, `worker/package.json`, `worker/wrangler.toml`
- Create: `scripts/build-datasets.mjs`, `worker/src/datasets.js`（產生）, `worker/test/datasets.test.js`
- Create: `scripts/capture-fixtures.mjs`, `worker/test/fixtures/morning/*.json`
- Create: `worker/src/fields.js`, `worker/test/fields.test.js`

**Interfaces:**
- Produces: `DATASETS: Record<county, {threeDay: string, weekly: string}>`（`worker/src/datasets.js`）
- Produces: `THREE_DAY`, `WEEKLY`, `OBS`, `SUN` 欄位常數（`worker/src/fields.js`），每個是 `[ElementName, valueKey]` 或路徑字串
- Produces: `worker/test/fixtures/<label>/` 內含 `F-C0032-001.json`、`threeDay.json`、`weekly.json`、`O-A0001-001.json`、`A-B0062-001.json`、`meta.json`（`{capturedAt, county:"新北市", town:"五股區"}`）

- [ ] **Step 1: 建 repo 和設定檔**

`git init -b main`。`.gitignore`：`node_modules/`、`.wrangler/`、`worker/.dev.vars`、`ref/`（參考圖是氣象署 App 的截圖，不放進公開的 repo）。根目錄 `package.json`：`{"private":true,"type":"module","scripts":{"test":"node --test"}}`。`worker/package.json`：`"type":"module"`，devDependency `"wrangler": "4.156.2"`，scripts `dev: wrangler dev`、`deploy: wrangler deploy`。`worker/wrangler.toml`：`name = "weather-api"`、`main = "src/index.js"`、`compatibility_date = "2026-11-01"`、`[vars] ALLOWED_ORIGINS = "http://localhost:8000"`。在 `worker/` 跑 `npm install`。

- [ ] **Step 2: 寫 datasets 的失敗測試** `worker/test/datasets.test.js`

```js
test('DATASETS covers 22 counties with paired ids', () => {
  assert.equal(Object.keys(DATASETS).length, 22);
  assert.deepEqual(DATASETS['宜蘭縣'], { threeDay: 'F-D0047-001', weekly: 'F-D0047-003' });
  assert.deepEqual(DATASETS['臺北市'], { threeDay: 'F-D0047-061', weekly: 'F-D0047-063' });
  assert.deepEqual(DATASETS['新北市'], { threeDay: 'F-D0047-069', weekly: 'F-D0047-071' });
  assert.ok(!('臺灣' in DATASETS));
});
```

- [ ] **Step 3: 跑 `npm test`，確認失敗**（模組不存在）

- [ ] **Step 4: 寫 `scripts/build-datasets.mjs`**

下載 `https://opendata.cwa.gov.tw/apidoc/v1`（YAML），逐行找 `/v1/rest/datastore/(F-D0047-\d{3}):` 後面的 `summary: 鄉鎮天氣預報-(.+?)未來(3天|1週)天氣預報`，排除縣市名為「臺灣」的。輸出 `worker/src/datasets.js`：`export const DATASETS = {...}`，檔頭註明「由 scripts/build-datasets.mjs 產生，不要手改」。執行它。

- [ ] **Step 5: 跑 `npm test`，確認 datasets 測試通過**

- [ ] **Step 6: 使用者放授權碼**

請使用者建立 `worker/.dev.vars`，內容一行 `CWA_API_KEY=<授權碼>`。不要把授權碼印到終端機或貼進對話。

- [ ] **Step 7: 寫 `scripts/capture-fixtures.mjs <morning|evening>`**

從 `worker/.dev.vars` 讀授權碼。台北時間不在對應時段時拒絕執行（morning：06:00–17:59；evening：18:00–23:59）。抓這 5 份存到 `worker/test/fixtures/<label>/`：`F-C0032-001`（`locationName=新北市`）、`F-D0047-069`（`LocationName=五股區`）存成 `threeDay.json`、`F-D0047-071`（`LocationName=五股區`）存成 `weekly.json`、`O-A0001-001`（只留 `GeoInfo.CountyName` 是新北市、臺北市、桃園市的測站，縮小檔案）、`A-B0062-001`（`CountyName=新北市&Date=<台北今天>`）。寫 `meta.json`。存檔前把 JSON 裡任何等於授權碼的字串換成 `REDACTED`。執行 `node scripts/capture-fixtures.mjs morning`。

- [ ] **Step 8: 對照真實資料寫 `worker/src/fields.js`**

下面是預期的欄位名稱，**以抓到的檔案為準**，不一樣就照檔案改：

```js
export const THREE_DAY = {
  temperature: ['溫度', 'Temperature'], apparent: ['體感溫度', 'ApparentTemperature'],
  humidity: ['相對濕度', 'RelativeHumidity'], comfort: ['舒適度指數', 'ComfortIndexDescription'],
  beaufort: ['風速', 'BeaufortScale'], windDirection: ['風向', 'WindDirection'],
  pop: ['3小時降雨機率', 'ProbabilityOfPrecipitation'],
  weather: ['天氣現象', 'Weather'], weatherCode: ['天氣現象', 'WeatherCode'],
};
export const WEEKLY = {
  maxT: ['最高溫度', 'MaxTemperature'], minT: ['最低溫度', 'MinTemperature'],
  maxAT: ['最高體感溫度', 'MaxApparentTemperature'], minAT: ['最低體感溫度', 'MinApparentTemperature'],
  pop: ['12小時降雨機率', 'ProbabilityOfPrecipitation'], humidity: ['平均相對濕度', 'RelativeHumidity'],
  beaufort: ['風速', 'BeaufortScale'], windDirection: ['風向', 'WindDirection'],
  uv: ['紫外線指數', 'UVIndex'], uvLevel: ['紫外線指數', 'UVExposureLevel'],
  weather: ['天氣現象', 'Weather'], weatherCode: ['天氣現象', 'WeatherCode'],
};
// OBS：O-A0001-001 每個測站的欄位路徑；SUN：A-B0062-001 的欄位
export const OBS = { name: 'StationName', time: 'ObsTime.DateTime', county: 'GeoInfo.CountyName', town: 'GeoInfo.TownName',
  coords: 'GeoInfo.Coordinates', temperature: 'WeatherElement.AirTemperature', humidity: 'WeatherElement.RelativeHumidity',
  windDirection: 'WeatherElement.WindDirection', windSpeed: 'WeatherElement.WindSpeed',
  pressure: 'WeatherElement.AirPressure', rainToday: 'WeatherElement.Now.Precipitation' };
export const SUN = { county: 'CountyName', date: 'Date', sunrise: 'SunRiseTime', sunset: 'SunSetTime' };
```

同時記下設計文件「要用真的授權碼確認的事」三項的答案，寫在 `fields.js` 檔頭註解：鄉鎮經緯度欄位名稱（預期 `Latitude`/`Longitude`）、3 天預報氣溫的間隔（1 或 3 小時）、今天累積雨量是不是 `Now.Precipitation`。

- [ ] **Step 9: 寫 `worker/test/fields.test.js`**

```js
test('every THREE_DAY field exists in the morning fixture', ...)  // 找到 ElementName，第一筆 ElementValue[0] 有該 key
test('every WEEKLY field exists in the morning fixture', ...)
test('every OBS path resolves on at least one station', ...)
test('SUN fields exist for 新北市', ...)
```

- [ ] **Step 10: 跑 `npm test`，全部通過**

- [ ] **Step 11: Commit**

```bash
git add .gitignore package.json worker/package.json worker/package-lock.json worker/wrangler.toml scripts worker/src worker/test docs
git commit -m "chore: scaffold repo, dataset map, real CWA fixtures"
```
先 `git status` 確認 `worker/.dev.vars` 和 `ref/` 都沒有被加進去。

---

### Task 2: 台北時間工具、通用解析、36 小時預報

**Files:**
- Create: `worker/src/time.js`, `worker/src/parse/series.js`, `worker/src/parse/county36h.js`
- Test: `worker/test/time.test.js`, `worker/test/series.test.js`, `worker/test/county36h.test.js`

**Interfaces:**
- Consumes: `THREE_DAY` 等欄位常數的形狀 `[ElementName, key]`
- Produces（`time.js`）：
  - `parseCwaTime(s: string): Date`：接受 `"2026-11-23 06:00:00"`（沒有時區就當台北時間）和 `"2026-11-23T06:00:00+08:00"`
  - `toTaipei(d: Date): {dateKey, y, m, d, hour, minute, weekday}`（weekday 0=日）
  - `isoTaipei(d: Date): string` → `"2026-11-23T06:00:00+08:00"`
  - `addDays(dateKey: string, n: number): string`
  - `periodLabel(start: Date, now: Date): string`
  - `dayLabel(dateKey: string, todayKey: string): string` → `"今天"` 或 `"週一"`…`"週日"`
- Produces（`series.js`）：
  - `num(v): number|null`：不是數字、或 ≤ -90 → `null`
  - `str(v): string|null`：`undefined`、`""`、`"-99"` → `null`
  - `findTown(json, town): Location|null`：`json.records.Locations[0].Location` 裡 `LocationName === town`
  - `pointSeries(loc, [el, key]): {time: Date, value}[]`（用 `DataTime`）
  - `intervalSeries(loc, [el, key]): {start: Date, end: Date, value}[]`（用 `StartTime`/`EndTime`）
  - `valueAt(intervals, t: Date): value|undefined`：`start <= t < end`
- Produces（`county36h.js`）：`parseCounty36h(json, county: string, now: Date): Period36[]`，找不到縣市就 throw

**時段名稱規則**（`periodLabel`）：取 `start` 的台北日期和小時。小時 < 6 是「凌晨」，6–17 是「白天」，18–23 是「晚上」。

| start 的台北日期 | 凌晨 | 白天 | 晚上 |
|---|---|---|---|
| 今天 | 今日凌晨 | 今日白天 | 今晚明晨 |
| 明天 | 明日凌晨 | 明日白天 | 明日晚上 |
| 其他 | `M/D 凌晨` | `M/D 白天` | `M/D 晚上` |

- [ ] **Step 1: 寫失敗測試**

```js
// time.test.js
const at = s => new Date(s);
test('periodLabel morning', () => {
  const now = at('2026-11-23T09:27:00+08:00');
  assert.equal(periodLabel(at('2026-11-23T06:00:00+08:00'), now), '今日白天');
  assert.equal(periodLabel(at('2026-11-23T18:00:00+08:00'), now), '今晚明晨');
  assert.equal(periodLabel(at('2026-11-24T06:00:00+08:00'), now), '明日白天');
});
test('periodLabel evening', () => {
  const now = at('2026-11-23T19:10:00+08:00');
  assert.equal(periodLabel(at('2026-11-23T18:00:00+08:00'), now), '今晚明晨');
  assert.equal(periodLabel(at('2026-11-24T06:00:00+08:00'), now), '明日白天');
  assert.equal(periodLabel(at('2026-11-24T18:00:00+08:00'), now), '明日晚上');
});
test('periodLabel labels 00-06 period as 今日凌晨', () => {
  const now = at('2026-11-24T02:00:00+08:00');
  assert.equal(periodLabel(at('2026-11-24T00:00:00+08:00'), now), '今日凌晨');
});
test('periodLabel uses Taipei date when UTC is still yesterday', () => {
  const now = at('2026-11-23T01:30:00+08:00');           // UTC 11/22 17:30
  assert.equal(periodLabel(at('2026-11-23T06:00:00+08:00'), now), '今日白天');
});
test('parseCwaTime treats offset-less strings as Taipei', () => {
  assert.equal(parseCwaTime('2026-11-23 06:00:00').toISOString(), '2026-11-22T22:00:00.000Z');
});
test('dayLabel', () => {
  assert.equal(dayLabel('2026-11-23', '2026-11-23'), '今天');
  assert.equal(dayLabel('2026-11-24', '2026-11-23'), '週二');
});
// series.test.js
test('num treats -99 and -998 as missing', () => { assert.equal(num('-99'), null); assert.equal(num('-998.0'), null); assert.equal(num('22.5'), 22.5); });
test('valueAt picks interval containing t, end exclusive', ...)
// county36h.test.js：用小的手寫 F-C0032-001 形狀資料（records.location[].weatherElement[] 的 Wx/PoP/MinT/MaxT/CI）
test('parseCounty36h returns 3 labelled periods with numbers', () => {
  // now 09:27，三段 06-18 / 18-06 / 06-18 → labels ['今日白天','今晚明晨','明日白天']，pop 是 number，weather 是 Wx 的 parameterName，weatherCode 是 parameterValue
});
test('parseCounty36h throws for missing county', ...)
```

- [ ] **Step 2: 跑 `npm test`，確認失敗**

- [ ] **Step 3: 實作 `time.js`、`series.js`、`county36h.js`**

台北時間的做法：`new Date(d.getTime() + 8*3600e3)` 後只用 `getUTC*()`。

- [ ] **Step 4: 跑 `npm test`，全部通過**

- [ ] **Step 5: Commit** `git commit -m "feat(worker): Taipei time helpers and 36h parser"`

---

### Task 3: 鄉鎮 3 天和 1 週預報

**Files:**
- Create: `worker/src/parse/threeDay.js`, `worker/src/parse/weekly.js`
- Test: `worker/test/threeDay.test.js`, `worker/test/weekly.test.js`

**Interfaces:**
- Consumes: Task 2 的 `series.js`、`time.js`；Task 1 的 `THREE_DAY`、`WEEKLY`
- Produces:
  - `parseThreeDay(json, town, now: Date): {lat, lon, current, next24h, hourly}`，鄉鎮不存在時 throw `TownNotFound`（`export class TownNotFound extends Error`）
  - `parseWeekly(json, town, now: Date): {days, uv}`
  - `uvLevelText(value: number): string`（0–2 低量級、3–5 中量級、6–7 高量級、8–10 過量級、11 以上危險級）

**規則：**
- `hourly`：以「氣溫」的 `DataTime` 為每一格。從「時間 ≤ now 的最後一格」開始往後全部保留（第一格就是「現在」）。區間型的值（降雨機率、天氣現象）用 `valueAt(…, 該格時間)` 取。
- `next24h`：`hourly` 中時間 < now + 24 小時的格子，氣溫的最大和最小。
- `current`：`weather`/`weatherCode`/`pop` 用 `valueAt(…, now)`，取不到就用第一段；`apparentTemperature` 用 `hourly[0]`。
- `weekly.days`：每個「天氣現象」區間是一個 Half，其他欄位用 `valueAt(…, half.start)` 取。用 start 的台北日期分組；start 小時在 6–17 是 `day`，其他是 `night`。最多 7 天，`label` 用 `dayLabel`。
- `weekly.uv`：時間順序中第一個 `uv` 不是 null 的 `day` Half。它的日期是今天，`label` 就是「紫外線」，否則是「明天紫外線」。`level` 用氣象署給的 `uvLevel`，沒有就用 `uvLevelText`。

- [ ] **Step 1: 寫失敗測試**（手寫最小的 F-D0047 形狀資料，`records.Locations[0].Location[]`）

```js
test('hourly starts at the slot containing now', ...)          // 格子 09:00,10:00,11:00；now 09:27 → hourly[0].time 是 09:00
test('next24h covers only the next 24 hours', ...)             // 30 小時資料，第 25 小時是最高溫，不能算進去
test('pop and weather come from the interval containing the hour', ...)
test('parseThreeDay throws TownNotFound for unknown town', ...)
test('weekly groups halves by Taipei date, morning', () => {
  // now 11/23 09:27，區間 11/23 06-18、11/23 18-11/24 06、11/24 06-18…
  // days[0] = {date:'2026-11-23', label:'今天', day: {...}, night: {...}}
});
test('weekly today row has only night in the evening', () => {
  // now 11/23 19:10，第一段 11/23 18-06 → days[0].day === null、days[0].night !== null、label '今天'
});
test('uv label is 紫外線 in the morning, 明天紫外線 in the evening', ...)
test('uvLevelText boundaries', () => { assert.equal(uvLevelText(2),'低量級'); assert.equal(uvLevelText(3),'中量級'); assert.equal(uvLevelText(11),'危險級'); });
test('real morning fixture parses', ...)                         // 讀 fixtures/morning，hourly.length >= 24、days.length 6 或 7、uv.label === '紫外線'
```

- [ ] **Step 2: 跑 `npm test`，確認失敗**
- [ ] **Step 3: 實作 `threeDay.js`、`weekly.js`**（`lat`/`lon` 讀 Task 1 記下的經緯度欄位，沒有就是 `null`）
- [ ] **Step 4: 跑 `npm test`，全部通過**
- [ ] **Step 5: Commit** `git commit -m "feat(worker): township 3-day and weekly parsers"`

---

### Task 4: 觀測站和日出日落

**Files:**
- Create: `worker/src/parse/observation.js`, `worker/src/parse/sun.js`
- Test: `worker/test/observation.test.js`, `worker/test/sun.test.js`

**Interfaces:**
- Consumes: `OBS`、`SUN`、`num`、`str`
- Produces:
  - `pickObservations(json, {lat, lon, county, town}): {time, temperature, humidity, windDirection, windSpeed, pressure, rainToday}`（每項是 `Obs|null`）
  - `degreesToText(deg: number): string`：8 個方位 `['北風','東北風','東風','東南風','南風','西南風','西風','西北風'][Math.round(deg/45) % 8]`
  - `parseSun(json, county): {date, sunrise: "HH:MM", sunset: "HH:MM"}`，找不到縣市就 throw

**選測站的規則：** 有 `lat`/`lon` 時，候選測站依距離排序（haversine，座標用 `Coordinates` 裡 `CoordinateName === 'WGS84'` 那筆）。沒有經緯度時，候選是同鄉鎮的測站，再來是同縣市的。每一項各自取「候選中第一個該項數值有效」的測站。`time` 用溫度那一項的觀測時間，溫度沒有就用第一個有值項目的時間。

- [ ] **Step 1: 寫失敗測試**

```js
test('picks nearest station per element, skipping -99', () => {
  // 測站 A（最近）：AirTemperature -99、RelativeHumidity 71
  // 測站 B（第二近）：AirTemperature 22.4、RelativeHumidity 65
  // → temperature {value:22.4, station:'B'}、humidity {value:71, station:'A'}
});
test('all stations missing an element gives null', ...)       // AirPressure 全 -99 → pressure === null
test('falls back to same town then same county without lat/lon', ...)
test('windDirection is converted to text', () => { assert.equal(degreesToText(45), '東北風'); assert.equal(degreesToText(350), '北風'); });
test('parseSun returns HH:MM for the county', ...)
test('real morning fixture: 五股區 gets a temperature', ...)   // fixtures/morning，用 threeDay 的經緯度
```

- [ ] **Step 2: 跑 `npm test`，確認失敗**
- [ ] **Step 3: 實作 `observation.js`、`sun.js`**
- [ ] **Step 4: 跑 `npm test`，全部通過**
- [ ] **Step 5: Commit** `git commit -m "feat(worker): nearest-station observations and sunrise"`

---

### Task 5: 組合端點、快取、CORS，本機跑起來

**Files:**
- Create: `worker/src/cwa.js`, `worker/src/forecast.js`, `worker/src/index.js`
- Test: `worker/test/cwa.test.js`, `worker/test/forecast.test.js`, `worker/test/index.test.js`

**Interfaces:**
- Consumes: Task 2–4 全部的 parse 函式、`DATASETS`、`TownNotFound`
- Produces:
  - `createCwaClient({apiKey, fetchImpl = fetch, cache = moduleCache, nowMs = Date.now}): { get(datasetId, params, ttlSeconds): Promise<object> }`
    - URL：`https://opendata.cwa.gov.tw/api/v1/rest/datastore/${id}?Authorization=…&${params}`
    - 快取 key 用 `datasetId` + 排序後的 params，**不含授權碼**
    - 非 200、或 `success !== "true"` 時 throw；錯誤訊息只寫資料集編號和 HTTP 狀態，**不含 URL**
    - 逾時 8 秒（`AbortSignal.timeout(8000)`）
  - `export class HttpError extends Error { constructor(status, message) }`
  - `buildForecast({county, town, now, cwa}): Promise<ForecastResponse>`（形狀見上方「Worker 回傳的 JSON」）
  - `handleRequest(request, env, deps = {buildForecast, createCwaClient}): Promise<Response>`；`export default { fetch: (req, env) => handleRequest(req, env) }`
  - `corsHeaders(origin: string|null, allowedCsv: string): Record<string,string>`

**`buildForecast` 的請求**（用 `Promise.allSettled` 同時發出）：

| 區塊 | 資料集 | params | 快取秒數 |
|---|---|---|---|
| county36h | `F-C0032-001` | `locationName=<縣市>` | 1800 |
| threeDay | `DATASETS[縣市].threeDay` | `LocationName=<鄉鎮>` | 1800 |
| weekly | `DATASETS[縣市].weekly` | `LocationName=<鄉鎮>` | 1800 |
| observation | `O-A0001-001` | 無 | 600 |
| sun | `A-B0062-001` | `CountyName=<縣市>&Date=<台北今天>` | 86400 |

縣市不在 `DATASETS` → `HttpError(400, '未知的縣市')`。`parseThreeDay` 丟 `TownNotFound` → `HttpError(400, '未知的鄉鎮')`。觀測用 threeDay 的經緯度（threeDay 失敗就傳 `null`）。每一區取得或解析失敗 → 該區 `null`、`sources[區].ok = false`，並 `console.error` 資料集編號。5 區全是 `null` → `HttpError(502, '氣象署資料暫時無法取得')`。

**`handleRequest`：** `OPTIONS` → 204 加 CORS 標頭。`GET /api/forecast` 缺 `county` 或 `town` → 400 `缺少 county 或 town`。其他路徑 → 404 `找不到`。未預期錯誤 → 500 `伺服器錯誤`。成功回應加 `Cache-Control: public, max-age=300`。CORS：`Origin` 在 `env.ALLOWED_ORIGINS`（逗號分隔）裡才回 `Access-Control-Allow-Origin: <origin>`，一律加 `Vary: Origin`。

- [ ] **Step 1: 寫失敗測試**

```js
// cwa.test.js
test('cache key excludes api key and second call within ttl does not fetch', ...)
test('refetches after ttl', ...)                              // nowMs 往前推 ttl+1 秒
test('error message never contains the api key', ...)         // fetchImpl 回 401，err.message 不含 'SECRET'
// forecast.test.js（cwa stub：依 datasetId 回 fixtures/morning 的檔案）
test('morning fixtures build a full response', ...)           // 5 區都不是 null、county36h[0].label === '今日白天'
test('400 for unknown county', ...)                           // county '台北市' → HttpError 400
test('400 for unknown town', ...)
test('one failing source yields null section and ok:false', ...)  // O-A0001-001 reject → observation null、其他 4 區正常
test('all sources failing gives 502', ...)
// index.test.js（deps.buildForecast 用 stub）
test('CORS header only for allowed origin', ...)
test('missing params gives 400 JSON', ...)
test('unknown path gives 404', ...)
test('response body never contains env.CWA_API_KEY', ...)     // stub 丟出含奇怪內容的錯誤 → 500 body 只有 '伺服器錯誤'
```

- [ ] **Step 2: 跑 `npm test`，確認失敗**
- [ ] **Step 3: 實作 `cwa.js`、`forecast.js`、`index.js`**
- [ ] **Step 4: 跑 `npm test`，全部通過**
- [ ] **Step 5: 本機實際跑一次**

在 `worker/` 背景執行 `npx wrangler dev --port 8787`，然後：
`curl -s "http://localhost:8787/api/forecast?county=%E6%96%B0%E5%8C%97%E5%B8%82&town=%E4%BA%94%E8%82%A1%E5%8D%80" | node -e "const j=JSON.parse(require('fs').readFileSync(0));console.log(Object.entries(j.sources))"`
預期：5 個 `ok: true`。再確認回應內容裡沒有授權碼：`curl … | grep -c "$(cut -d= -f2- worker/.dev.vars | tr -d '\r')"` 輸出 `0`（指令裡不要 echo 授權碼）。

- [ ] **Step 6: Commit** `git commit -m "feat(worker): /api/forecast with cache, CORS, partial failures"`

---

### Task 6: 縣市鄉鎮清單、網頁骨架、地點選單

**Files:**
- Create: `scripts/build-towns.mjs`, `site/data/towns.json`（產生）
- Create: `site/index.html`, `site/css/style.css`, `site/js/config.js`, `site/js/api.js`, `site/js/main.js`, `site/js/logic/location.js`, `site/js/render/sheet.js`, `site/js/render/picker.js`
- Test: `test/site/location.test.js`

**Interfaces:**
- Consumes: Worker 的 `GET /api/forecast`
- Produces:
  - `towns.json`：`[{ "county": "臺北市", "towns": ["中正區", …] }, …]`，縣市順序：基隆市、臺北市、新北市、桃園市、新竹市、新竹縣、苗栗縣、臺中市、彰化縣、南投縣、雲林縣、嘉義市、嘉義縣、臺南市、高雄市、屏東縣、宜蘭縣、花蓮縣、臺東縣、澎湖縣、金門縣、連江縣；鄉鎮依 `Geocode` 排序
  - `DEFAULT_LOCATION = {county: '臺北市', town: '中正區'}`；`resolveLocation(saved: unknown, towns): {county, town}`（`logic/location.js`）
  - `API_BASE`（`config.js`）：`location.hostname` 是 `localhost` 或 `127.0.0.1` 時用 `http://localhost:8787`，否則用 `PROD_API_BASE`（Task 10 填入）
  - `fetchForecast(county, town): Promise<ForecastResponse>`，非 200 時 throw `Error(body.error)`
  - `openSheet({title, content: HTMLElement, onClose?}): {close()}`（`render/sheet.js`）：從下方滑出、左上關閉按鈕、點背景或按 Esc 關閉
  - `openPicker(towns, current, onPick({county, town}))`（`render/picker.js`）：標題「選擇地點」，先列縣市，點了列該縣市鄉鎮，上方有「縣市」返回
  - `main.js` 的 `render(data)`：本 task 先只把 `county town` 和 `observation.temperature.value` 放進 `#hero`，Task 8 再補完

- [ ] **Step 1: 寫 `scripts/build-towns.mjs` 並執行**

對 `DATASETS` 每個縣市呼叫 3 天資料集（`ElementName=溫度`，減少資料量），收集 `LocationName` 和 `Geocode`。授權碼從 `worker/.dev.vars` 讀。

- [ ] **Step 2: 寫失敗測試** `test/site/location.test.js`

```js
const towns = [{ county: '臺北市', towns: ['中正區', '大安區'] }, { county: '新北市', towns: ['五股區'] }];
test('resolveLocation keeps a valid saved location', () => assert.deepEqual(resolveLocation({county:'新北市',town:'五股區'}, towns), {county:'新北市',town:'五股區'}));
test('resolveLocation falls back to default for unknown names', () => {
  assert.deepEqual(resolveLocation({county:'台北市',town:'中正區'}, towns), DEFAULT_LOCATION);
  assert.deepEqual(resolveLocation({county:'臺北市',town:'五股區'}, towns), DEFAULT_LOCATION);
  assert.deepEqual(resolveLocation(null, towns), DEFAULT_LOCATION);
  assert.deepEqual(resolveLocation('garbage', towns), DEFAULT_LOCATION);
});
```

- [ ] **Step 3: 跑 `npm test`，確認失敗**
- [ ] **Step 4: 實作上面列的檔案**

`main.js`：讀 `localStorage['weather.location']`（讀寫都包 try/catch）→ `resolveLocation` → `fetchForecast` → `render`。選新地點時存起來再重新載入資料。整頁載入失敗時顯示「無法取得天氣資料：<訊息>」和「重試」按鈕。`style.css` 先放設計 token（Task 8 用）：

```css
:root { --bg:#fff; --outside:#eef0f3; --card:#f5f5f7; --text:#1a1a1a; --muted:#8a8a8e;
  --pop:#3d8bef; --sun:#f5a623; --max:#f08a3c; --min:#4a9ff5; --hero-panel:linear-gradient(180deg,#a8daf6,#d4ecfb);
  --radius:20px; --col:480px;
  font-family: -apple-system, "PingFang TC", "Microsoft JhengHei", "Noto Sans TC", sans-serif; }
```
內容欄寬 `max-width: var(--col)` 置中，欄外背景 `--outside`。

- [ ] **Step 5: 跑 `npm test`，全部通過**
- [ ] **Step 6: 瀏覽器確認**

Worker 的 `wrangler dev` 開著；另開 `npx --yes http-server@14.1.1 site -p 8000 -c-1`。打開 `http://localhost:8000`：顯示「臺北市 中正區」和一個溫度；打開選單選新北市五股區，畫面更新；重新整理後還是五股區。在 DevTools 的 localStorage 把值改成 `{"county":"台北市","town":"中正區"}` 再重新整理，畫面顯示臺北市中正區，沒有錯誤訊息。

- [ ] **Step 7: Commit** `git commit -m "feat(site): skeleton, town list, location picker"`

---

### Task 7: 網頁的純邏輯和圖示檔

**Files:**
- Create: `site/js/logic/icons.js`, `site/js/logic/advice.js`, `site/js/logic/format.js`
- Create: `site/icons/weather/fill/*.svg`, `site/icons/weather/line/*.svg`, `site/icons/weather/LICENSE`
- Test: `test/site/icons.test.js`, `test/site/advice.test.js`, `test/site/format.test.js`

**Interfaces:**
- Produces（`icons.js`）：
  - `iconKey(weather: string|null): 'clear'|'partly-cloudy'|'cloudy'|'overcast'|'rain'|'thunderstorm'|'snow'|'fog'`
  - `isNight(iso: string): boolean`：`Number(iso.slice(11,13))` < 6 或 ≥ 18
  - `iconUrl(key, {night = false, style = 'fill'}): string` → `icons/weather/<style>/<file>.svg`；檔名：clear → `clear-day`/`clear-night`、partly-cloudy → `partly-cloudy-day`/`partly-cloudy-night`、cloudy → `cloudy`、overcast → `overcast`、rain → `rain`、thunderstorm → `thunderstorms-rain`、snow → `snow`、fog → `fog`
- Produces（`advice.js`）：`adviceItems({maxT, pop, weather}): {key, label}[]`
- Produces（`format.js`）：
  - `tempBar(min, max, weekMin, weekMax): {left, width}`（百分比；`weekMax === weekMin` → `{left:0, width:100}`）
  - `daylightFraction(now: "HH:MM", sunrise: "HH:MM", sunset: "HH:MM"): number`（0 到 1，日出前 0、日落後 1）
  - `weekSummary(days): {maxAT, minAT, maxUV, avgHumidity}`（所有 Half 一起算，略過 null，平均四捨五入）
  - `dayRow(day: Day): {min, max, pop, uv, minAT, maxAT, weather, night: boolean}`（溫度取兩個 Half 的最小和最大；pop 取較大的；uv 取 day Half；weather 用 day Half，沒有就用 night 並 `night: true`）
  - `hourLabel(iso, index): string`：index 0 → `"現在"`，其他 → `"15時"`
  - `hhmm(iso): string` → `"09:27"`
  - `SHOW_WEEK_POP_AT = 30`：7 日預報列表的降雨機率 ≥ 30% 才顯示

**`iconKey` 規則**，依序比對，先符合的先用：含「雷」→ thunderstorm；含「雪」「冰」「霰」→ snow；含「雨」→ rain；含「霧」→ fog；以「晴」開頭 → 含「雲」或「陰」就 partly-cloudy，否則 clear；含「晴」→ partly-cloudy；以「陰」開頭 → overcast；含「多雲」→ cloudy；其他 → cloudy。

**`adviceItems` 規則**（設計文件）：`maxT` ≥ 26 `short-sleeve`「短袖」；20–25 `light-long-sleeve`「薄長袖」；15–19 `jacket`「外套」；< 15 `heavy-coat`「厚外套」；`maxT` 是 null 就不給穿著。`pop` ≥ 50 加 `umbrella`「帶傘」。`pop` ≤ 20 而且 `weather` 不含「雨」加 `laundry`「適合曬衣」。`pop` 是 null 時兩者都不加。

- [ ] **Step 1: 寫失敗測試**

```js
// icons.test.js
const cases = { '晴':'clear', '晴時多雲':'partly-cloudy', '多雲時晴':'partly-cloudy', '多雲':'cloudy', '多雲時陰':'cloudy',
  '陰時多雲':'overcast', '陰':'overcast', '多雲短暫陣雨':'rain', '晴午後短暫雷陣雨':'thunderstorm', '晴有霧':'fog', '有雨或雪':'snow' };
test('iconKey', () => { for (const [w, k] of Object.entries(cases)) assert.equal(iconKey(w), k, w); assert.equal(iconKey(null), 'cloudy'); });
test('iconUrl night variant', () => assert.equal(iconUrl('clear', {night:true}), 'icons/weather/fill/clear-night.svg'));
// advice.test.js
test('clothing boundaries', () => {
  const k = t => adviceItems({maxT:t, pop:30, weather:'多雲'}).map(i => i.label);
  assert.deepEqual(k(26), ['短袖']); assert.deepEqual(k(25), ['薄長袖']); assert.deepEqual(k(20), ['薄長袖']);
  assert.deepEqual(k(19), ['外套']); assert.deepEqual(k(15), ['外套']); assert.deepEqual(k(14), ['厚外套']);
});
test('umbrella at 50%', () => { /* pop 50 含 帶傘；49 不含 */ });
test('laundry only when pop <= 20 and no rain', () => { /* 20+多雲 含；20+多雲短暫雨 不含；21 不含 */ });
test('null pop gives neither umbrella nor laundry', ...)
// format.test.js
test('tempBar', () => { const b = tempBar(17, 20, 14, 28); assert.equal(b.left.toFixed(2), '21.43'); assert.equal(b.width.toFixed(2), '21.43'); });
test('daylightFraction clamps', () => { assert.equal(daylightFraction('05:00','06:16','17:04'), 0); assert.equal(daylightFraction('18:00','06:16','17:04'), 1); });
test('weekSummary ignores nulls', ...)
test('dayRow uses night half when day is missing', ...)
test('hourLabel', () => { assert.equal(hourLabel('2026-11-23T09:00:00+08:00', 0), '現在'); assert.equal(hourLabel('2026-11-23T15:00:00+08:00', 3), '15時'); });
```

- [ ] **Step 2: 跑 `npm test`，確認失敗**
- [ ] **Step 3: 實作三個 logic 檔**
- [ ] **Step 4: 放圖示檔**

在 scratchpad 的空資料夾下載 `@bybas/weather-icons@2.0.0` 的 tarball（`npm view @bybas/weather-icons@2.0.0 dist.tarball`），解開後從 `package/production/fill/all/` 和 `package/production/line/all/` 各複製這 10 個檔：`clear-day`、`clear-night`、`partly-cloudy-day`、`partly-cloudy-night`、`cloudy`、`overcast`、`rain`、`thunderstorms-rain`、`snow`、`fog`；另從 fill 複製 `sunrise`、`sunset`。`package/LICENSE` 複製成 `site/icons/weather/LICENSE`。

- [ ] **Step 5: 跑 `npm test`，全部通過**
- [ ] **Step 6: Commit** `git commit -m "feat(site): icon, advice and formatting logic; Meteocons icons"`

---

### Task 8: 主頁 9 個區塊

**Files:**
- Create: `site/js/render/hero.js`, `site/js/render/sections.js`, `site/js/render/ui-icons.js`
- Modify: `site/index.html`, `site/css/style.css`, `site/js/main.js`

**Interfaces:**
- Consumes: Task 6 的 `render(data)` 進入點、`openPicker`；Task 7 全部 logic
- Produces:
  - `renderHero(el, data, {onOpenPicker})`、`setupCompactHeader(heroEl, compactEl, data)`
  - `renderDataTime(el, data)`、`renderNowTiles(el, data)`、`renderHourly(el, data, {onDetail})`、`renderAdvice(el, data)`、`renderWeekly(el, data, {onDetail})`、`renderObsTiles(el, data)`、`renderSun(el, data)`
  - `renderUnavailable(el, title)`：區塊標題加「暫時無法取得」
  - `ui-icons.js`：`menu`、`chevronRight`、`close`、`shortSleeve`、`lightLongSleeve`、`jacket`、`heavyCoat`、`umbrella`、`laundry` 的 inline SVG 字串（線條風格，`stroke="currentColor"`，自己畫）
  - `onDetail` 先接空函式，Task 9 接上面板

**每個區塊的內容和文字**（照設計文件「主頁」1–9，參考 `ref/0001.png`–`0004.png`）：

| 區塊 | 用的資料 | 文字 |
|---|---|---|
| hero | `observation.temperature`、`threeDay.next24h`、`threeDay.current.weather`、`observation.windDirection`/`humidity` | 大字 `22°`（沒有實測就 `--°`）；`未來 24 小時 最高 26°・最低 17°`；天氣現象；`東北風・濕度 71%`（缺的項目顯示 `--`）；右側淺藍區塊放 `iconUrl(iconKey(weather), {night: isNight(data.generatedAt)})` 放大 |
| 精簡頂部 | 同上 | `新北市 五股區`、`22°`、天氣現象；hero 離開畫面時固定在頂端（IntersectionObserver） |
| 資料時間 | `observation.time`、`generatedAt` | `觀測時間 09:00・上次更新 09:27`；沒有觀測就只顯示 `上次更新 09:27` |
| 現在小卡 | `threeDay.current.pop`、`weekly.uv`、`threeDay.current.apparentTemperature` | `降雨機率` `20%`；`weekly.uv.label` `5 中量級`；`體感溫度` `23°` |
| 逐小時預報 | `threeDay.hourly` | 標題「逐小時預報」、右上「詳細預報」+ chevron；每格 `hourLabel`、line 風格圖示、藍色 `20%`、`22°`；橫向捲動 |
| 生活建議 | `county36h` | 標題「生活建議」；每張卡：`label`、`minT - maxT°`、`降雨 20%`、`comfort`、fill 圖示、`adviceItems` 的圖示和文字；橫向捲動 |
| 7 日預報 | `weekly.days` | 標題「7 日預報」、右上「詳細預報」；每列：`label`、`11月23日`、圖示、降雨機率（≥ `SHOW_WEEK_POP_AT` 才顯示）、`17°` 溫度條 `26°`、`紫外線 5  體感 17°/28°` |
| 實測小卡 | `observation.rainToday`/`windSpeed`/`pressure` | `今天累積雨量` `0` `mm`；`風速` `1.1` `m/s`；`氣壓` `1002.5` `hPa`；每格下方小字 `新莊測站`（該項的 `station` + 「測站」） |
| 日出日落 | `sun`、`generatedAt` | 左 sunrise 圖示 + `06:16`、右 sunset 圖示 + `17:04`，中間弧線，太陽圓點位置用 `daylightFraction(hhmm(data.generatedAt), …)` |

「現在幾點」一律用 `data.generatedAt`（台北時間），不用瀏覽器的本地時間，因為使用者可能不在台灣時區。
| 頁尾 | — | `資料來源：中央氣象署` |

區塊資料是 `null` 時呼叫 `renderUnavailable`。

- [ ] **Step 1: 實作上面的 render 檔，接到 `main.js` 的 `render(data)`**
- [ ] **Step 2: 跑 `npm test`，確認既有測試仍全部通過**
- [ ] **Step 3: 瀏覽器確認（手機尺寸）**

`wrangler dev` 和 `http-server` 都開著，用 playwright-cli（或 DevTools 裝置模式）開 `http://localhost:8000`，視窗 390×844，截整頁圖。逐項對照上表和 `ref/0001.png`–`0004.png`：9 個區塊都有真實資料、往下捲時精簡頂部出現。再把視窗改成 1280×800：內容在中間一欄、欄外淺灰。

- [ ] **Step 4: 驗證「暫時無法取得」和實測缺值**

暫時在 `worker/src/forecast.js` 把 `O-A0001-001` 的資料集編號改成不存在的 `O-XXXX`，重新整理：hero 大字是 `--°`、風向濕度是 `--`、實測小卡區塊顯示「暫時無法取得」、其他區塊正常。改回來（`git diff worker/` 應該是空的）。

- [ ] **Step 5: Commit** `git commit -m "feat(site): main page sections"`

---

### Task 9: 圖表、72 小時面板、7 日面板

**Files:**
- Create: `site/js/chart.js`, `site/js/render/panel72h.js`, `site/js/render/panel7d.js`
- Modify: `site/js/main.js`（接上 `onDetail`）、`site/css/style.css`
- Test: `test/site/chart.test.js`

**Interfaces:**
- Consumes: `openSheet`、Task 7 logic、`ForecastResponse`
- Produces:
  - `scalePoints(values: (number|null)[], {width, height, min, max, padTop = 8, padBottom = 8}): [x, y][]`（略過 null 的點）
  - `smoothPath(points: [x,y][]): string`：Fritsch–Carlson 單調三次插值轉成三次貝茲曲線。格式：`M${x0} ${y0}`，每段接 ` C${c1x} ${c1y} ${c2x} ${c2y} ${x} ${y}`；數字用 `Number(v.toFixed(2))`
  - `stepPath(points: [x,y][], endX: number): string` → `M${x0} ${y0} H${x1} V${y1} H${x2} V${y2} … H${endX}`
  - `renderChart(container, {values, xLabels, min, max, yTicks, kind: 'line'|'step', color, fill, onSelect(index)}): {select(index)}`：SVG，線下方漸層填色；點選或拖動時呼叫 `onSelect`，選中的點畫圓點
  - `open72hPanel(data)`、`open7dPanel(data)`

**72 小時面板**（`ref/0005.png`、`0006.png`）：標題「72 小時預報」。日期列由 `hourly` 的日期產生（星期字「一」…「日」+ 日），點了圖表捲到那天第一格。分頁「氣溫／體感溫度／蒲福風級／濕度」對應 `temperature`/`apparentTemperature`/`beaufort`/`humidity`，單位 `°`/`°`/` 級`/`%`。上方顯示選中時刻的值 + `最高 26° 最低 17°`（選中時刻那一天的最高最低）。下面「降雨機率」階梯圖，右上藍字顯示選中時刻的值。最下面「風向」`windDirection`、「舒適度」`comfort`。兩張圖共用同一個橫向捲動容器和 x 座標，每小時寬 16px（3 小時間隔的資料就是每格 48px）。

**7 日面板**（`ref/0007.png`、`0008.png`）：標題「7日預報」，分頁「每日預報／一週概況」。每日預報：日期列（今天 + 星期字），選一天顯示「白天」「晚上」兩段（沒有的那段不顯示）：`17 - 26°`、`降雨 20%・濕度 71%`、`蒲福風級 2`、天氣文字和圖示；下面三格「體感最高」「體感最低」「紫外線」（`5 中量級`）。一週概況：「本週氣溫」+ 圖例「最高溫」「最低溫」，兩條 `smoothPath`（橘、藍）；下面四格「體感最高」「體感最低」「紫外線」「濕度」用 `weekSummary`。

- [ ] **Step 1: 寫失敗測試** `test/site/chart.test.js`

```js
test('stepPath', () => assert.equal(stepPath([[0,10],[10,20]], 20), 'M0 10 H10 V20 H20'));
test('smoothPath passes through every point', () => {
  const pts = [[0,50],[10,20],[20,20],[30,40]];
  const d = smoothPath(pts);
  assert.ok(d.startsWith('M0 50'));
  for (const [x, y] of pts.slice(1)) assert.ok(d.includes(`${x} ${y}`), `${x} ${y}`);
});
test('smoothPath does not overshoot on a flat segment', () => {
  // 解析 d 的每段 C 控制點：[10,20]→[20,20] 那段兩個控制點的 y 都是 20
});
test('scalePoints maps min to bottom and max to top', ...)
test('scalePoints skips nulls', ...)
```

- [ ] **Step 2: 跑 `npm test`，確認失敗**
- [ ] **Step 3: 實作 `chart.js`**
- [ ] **Step 4: 跑 `npm test`，全部通過**
- [ ] **Step 5: 實作兩個面板，接上主頁的「詳細預報」**
- [ ] **Step 6: 瀏覽器確認**

390×844 視窗：點逐小時預報的「詳細預報」，面板從下方滑出；切換 4 個分頁圖表都會變；在圖上拖動，上方數值、降雨機率、風向、舒適度跟著變；點第二天的日期，圖表捲過去；按關閉、點背景、按 Esc 都能關。點 7 日預報的「詳細預報」，兩個分頁都有資料。和 `ref/0005.png`–`0008.png` 比對截圖。

- [ ] **Step 7: Commit** `git commit -m "feat(site): 72h and 7-day panels with SVG charts"`

---

### Task 10: 部署和驗收

**Files:**
- Create: `.github/workflows/pages.yml`, `README.md`
- Modify: `site/js/config.js`（`PROD_API_BASE`）、`worker/wrangler.toml`（`ALLOWED_ORIGINS`）
- Create: `worker/test/fixtures/evening/*.json`、`worker/test/evening.test.js`

**Interfaces:**
- Consumes: 全部

- [ ] **Step 1: 問使用者 GitHub 帳號和 repo 名稱**（設計文件「需要使用者自己做的」第 3 項）。跑 `gh auth status`，確認作用中帳號就是使用者指定的帳號；不是就停下來問，不要自己切換。

- [ ] **Step 2: 使用者登入 Cloudflare**

請使用者在對話框輸入 `! cd worker && npx wrangler login`（會打開瀏覽器）。

- [ ] **Step 3: 部署 Worker**

在 `worker/`：`grep '^CWA_API_KEY=' .dev.vars | cut -d= -f2- | npx wrangler secret put CWA_API_KEY`（授權碼不會顯示在畫面上），然後把 `wrangler.toml` 的 `ALLOWED_ORIGINS` 改成 `"https://<帳號>.github.io,http://localhost:8000"`，`npx wrangler deploy`。記下輸出的 `https://weather-api.<子網域>.workers.dev`。
驗證：`curl -s -H "Origin: https://<帳號>.github.io" -D - "<worker網址>/api/forecast?county=…&town=…" -o /dev/null` 回應標頭有 `access-control-allow-origin: https://<帳號>.github.io`。

- [ ] **Step 4: 網頁設定和 Pages workflow**

`config.js` 的 `PROD_API_BASE` 填 Worker 網址。`.github/workflows/pages.yml`：push 到 `main` 時執行，`permissions: pages: write, id-token: write, contents: read`，步驟 `actions/checkout@v4` → `actions/configure-pages@v5` → `actions/upload-pages-artifact@v3`（`path: site`）→ `actions/deploy-pages@v4`。`README.md` 寫：本機開發（`.dev.vars`、`wrangler dev`、`http-server`）、`npm test`、部署 Worker、重新產生 `datasets.js` 和 `towns.json` 的指令。

- [ ] **Step 5: 確認 repo 裡沒有授權碼**

`git grep -c "$(cut -d= -f2- worker/.dev.vars | tr -d '\r')"` 沒有任何輸出；`git status` 沒有 `.dev.vars`。

- [ ] **Step 6: 建 repo、push、開 Pages**

`gh repo create <帳號>/<repo> --public --source . --push`（push 卡住或 403 就回報，不要重試）。`gh api -X POST repos/<帳號>/<repo>/pages -f build_type=workflow`。等 workflow 跑完：`gh run watch`。

- [ ] **Step 7: 白天驗收**

打開 `https://<帳號>.github.io/<repo>/`：9 個區塊和兩個面板都有真實資料；DevTools Network 裡只有對 `workers.dev` 的請求，網址和回應都沒有授權碼。請使用者用手機、在公司網路外（例如關掉 Wi-Fi 用行動網路）打開確認。`npm test` 全部通過。

- [ ] **Step 8: 晚上（台北 18:00 以後）抓第二組資料並寫測試**

`node scripts/capture-fixtures.mjs evening`。`worker/test/evening.test.js`：

```js
test('evening fixtures: labels and today row', () => {
  // buildForecast（cwa stub 讀 fixtures/evening，now = meta.capturedAt）
  // county36h.map(p => p.label) 等於 ['今晚明晨','明日白天','明日晚上']
  // weekly.days[0].label === '今天'、days[0].day === null、days[0].night !== null
  // weekly.uv.label === '明天紫外線'
});
```
跑 `npm test` 全部通過。

- [ ] **Step 9: 晚上驗收**

打開 GitHub Pages 網址：生活建議卡片是「今晚明晨、明日白天、明日晚上」；7 日預報「今天」只有晚上；紫外線小卡寫「明天紫外線」；hero 的「未來 24 小時 最高・最低」有數字。

- [ ] **Step 10: Commit 並 push**

```bash
git add .github README.md site/js/config.js worker/wrangler.toml worker/test
git commit -m "chore: deploy to GitHub Pages and Cloudflare; evening fixtures"
git push
```
（push 前再跑一次 `gh auth status`。）
