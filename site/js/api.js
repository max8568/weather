import { API_BASE } from './config.js';

export async function fetchForecast(county, town) {
  const url = `${API_BASE}/api/forecast?county=${encodeURIComponent(county)}&town=${encodeURIComponent(town)}`;
  const res = await fetch(url);
  let body = null;
  try { body = await res.json(); } catch { /* 回應不是 JSON */ }
  if (!res.ok) throw new Error(body?.error || `HTTP ${res.status}`);
  return body;
}
