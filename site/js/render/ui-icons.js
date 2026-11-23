// 介面用的線條圖示，24×24，顏色跟著文字顏色（currentColor）。
const svg = (d) => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;

const longSleeve = 'M8 4c1 1.5 2.3 2 4 2s3-.5 4-2l3 2 2 12-2.5.6L16 11v9H8v-9l-2.5 7.6L3 18 5 6z';

export const menu = svg('M5 9h14M5 15h14');
export const chevronRight = svg('M9 6l6 6-6 6');
export const close = svg('M6 6l12 12M18 6L6 18');
export const shortSleeve = svg('M8 4c1 1.5 2.3 2 4 2s3-.5 4-2l4 3-2 3-2-1v11H8V9l-2 1-2-3z');
export const lightLongSleeve = svg(longSleeve);
export const jacket = svg(`${longSleeve}M12 6v14M9.5 14h1M13.5 14h1`);
export const heavyCoat = svg(`${longSleeve}M12 6v14M8 11.5h8M8 15.5h8`);
export const umbrella = svg('M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9zM12 12v6a2 2 0 0 1-4 0');
export const laundry = svg('M3 5h18M5.5 5v11h5V5M13.5 5v8h5V5M8 3.5v3M16 3.5v3');
