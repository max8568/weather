export const PROD_API_BASE = 'https://weather-api.max8568.workers.dev';
// 在本機開網頁時預設也連線上的 Worker；網址加 ?api=local 才改連本機的 wrangler dev
const useLocalWorker = location.origin === 'http://localhost:8000'
  && new URLSearchParams(location.search).get('api') === 'local';
export const API_BASE = useLocalWorker ? 'http://localhost:8787' : PROD_API_BASE;
