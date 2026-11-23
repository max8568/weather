import { createCwaClient, HttpError } from './cwa.js';
import { buildForecast } from './forecast.js';

export function corsHeaders(origin, allowedCsv) {
  const allowed = String(allowedCsv || '').split(',').map(s => s.trim()).filter(Boolean);
  const h = { Vary: 'Origin' };
  if (origin && allowed.includes(origin)) {
    h['Access-Control-Allow-Origin'] = origin;
    h['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
    h['Access-Control-Allow-Headers'] = 'Content-Type';
  }
  return h;
}

export async function handleRequest(request, env, deps = { buildForecast, createCwaClient }) {
  const cors = corsHeaders(request.headers.get('Origin'), env.ALLOWED_ORIGINS);
  const json = (status, body, extra = {}) => new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors, ...extra },
  });

  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  try {
    const url = new URL(request.url);
    if (request.method !== 'GET' || url.pathname !== '/api/forecast') return json(404, { error: '找不到' });
    const county = url.searchParams.get('county');
    const town = url.searchParams.get('town');
    if (!county || !town) return json(400, { error: '缺少 county 或 town' });

    const cwa = deps.createCwaClient({ apiKey: env.CWA_API_KEY });
    const body = await deps.buildForecast({ county, town, now: new Date(), cwa });
    return json(200, body, { 'Cache-Control': 'public, max-age=300' });
  } catch (err) {
    if (err instanceof HttpError) return json(err.status, { error: err.message });
    console.error('未預期錯誤', err?.name);
    return json(500, { error: '伺服器錯誤' });
  }
}

export default { fetch: (req, env) => handleRequest(req, env) };
