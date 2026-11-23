# 天氣網站

查詢台灣各鄉鎮的天氣預報、目前觀測、日出日落與生活建議。網頁是純靜態檔案（放在 `site/`，用 GitHub Pages 發佈）；中央氣象署的授權碼只放在 Cloudflare Worker（`worker/`），網頁本身看不到授權碼。

資料來源：中央氣象署

## 本機開發

1. 安裝套件：在專案根目錄和 `worker/` 各執行一次 `npm ci`（根目錄的套件給測試和腳本用，`worker/` 的是 wrangler）。
2. 建立 `worker/.dev.vars`，內容一行：`CWA_API_KEY=你的授權碼`（這個檔案不會進 git）。
3. 在 `worker/` 啟動 Worker：`npx wrangler dev --port 8787`
4. 在專案根目錄啟動網頁：`npx --yes http-server@14.1.1 site -p 8000 -c-1`
5. 打開 http://localhost:8000 。在 localhost 開啟時，網頁會自動連 http://localhost:8787 。

## 測試

在專案根目錄執行 `npm test`。

## 部署 Worker

在 `worker/` 執行：

```
npx wrangler secret put CWA_API_KEY
npx wrangler deploy
```

`worker/wrangler.toml` 的 `ALLOWED_ORIGINS` 列出允許呼叫 Worker 的網站網址。網頁要連的 Worker 網址寫在 `site/js/config.js` 的 `PROD_API_BASE`。

## 部署網頁

第一次發佈前，到 GitHub 上這個 repo 的 **Settings → Pages → Build and deployment → Source** 選 **GitHub Actions**。沒有設定的話，workflow 會在發佈那一步失敗。

設定好之後，推送到 `main`，`.github/workflows/pages.yml` 就會把 `site/` 發佈到 GitHub Pages。

## 重新產生資料檔

- 縣市對應的預報資料集代碼（`worker/src/datasets.js`）：`node scripts/build-datasets.mjs`
- 鄉鎮清單（`site/data/towns.json`，需要 `worker/.dev.vars` 裡的授權碼）：`node scripts/build-towns.mjs`

## 抓測試資料

`node scripts/capture-fixtures.mjs morning` 或 `node scripts/capture-fixtures.mjs evening`。存檔前會把授權碼換成 `REDACTED`。
