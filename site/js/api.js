import { API_BASE } from './config.js';

export async function fetchForecast(county, town) {
  const url = `${API_BASE}/api/forecast?county=${encodeURIComponent(county)}&town=${encodeURIComponent(town)}`;
  const res = await fetch(url);
  let body = null;
  try { body = await res.json(); } catch { /* 回應不是 JSON */ }
  if (res.status !== 200) throw new Error(body?.error || `伺服器回應 ${res.status}`);
  if (body === null || typeof body !== 'object' || Array.isArray(body)) throw new Error('伺服器回應格式不正確');
  return body;
}
