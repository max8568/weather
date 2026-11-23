const BASE = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore/';
const moduleCache = new Map();

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function createCwaClient({ apiKey, fetchImpl = fetch, cache = moduleCache, nowMs = Date.now }) {
  return {
    async get(datasetId, params, ttlSeconds) {
      const sorted = String(params || '').split('&').filter(Boolean).sort().join('&');
      const key = `${datasetId}?${sorted}`;
      const hit = cache.get(key);
      if (hit && hit.expiresAt > nowMs()) return hit.data;

      const url = `${BASE}${datasetId}?Authorization=${encodeURIComponent(apiKey)}${sorted ? `&${sorted}` : ''}`;
      let res;
      try {
        res = await fetchImpl(url, { signal: AbortSignal.timeout(8000) });
      } catch {
        // 不轉傳原始錯誤，避免訊息帶出網址
        throw new Error(`${datasetId} 連線失敗或逾時`);
      }
      if (res.status !== 200) throw new Error(`${datasetId} HTTP ${res.status}`);
      const data = await res.json();
      if (data?.success !== 'true') throw new Error(`${datasetId} 回應 success 不是 true`);
      cache.set(key, { data, expiresAt: nowMs() + ttlSeconds * 1000 });
      return data;
    },
  };
}
