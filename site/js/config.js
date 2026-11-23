export const PROD_API_BASE = ''; // Task 10 填入
export const API_BASE = ['localhost', '127.0.0.1'].includes(location.hostname) ? 'http://localhost:8787' : PROD_API_BASE;
