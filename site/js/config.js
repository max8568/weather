export const PROD_API_BASE = 'https://weather-api.max8568.workers.dev';
export const API_BASE = ['localhost', '127.0.0.1'].includes(location.hostname) ? 'http://localhost:8787' : PROD_API_BASE;
