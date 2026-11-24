// 介面用的線條圖示，24×24，顏色跟著文字顏色（currentColor）。
const svg = (d) => `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${d}"/></svg>`;

// 長袖衣服的外形，從左邊領口畫到右邊領口，領口各自畫。
const sleeves = 'M9 4L5.5 6l-3 11 2.5 1 2-6.5V20h10v-8.5l2 6.5 2.5-1-3-11L15 4';
// 曬衣繩、兩個夾子、兩件衣服。
const clothesline = 'M3 7h18M8.5 5v4.5M15.5 5v4.5M6 17v-5a2.5 2.5 0 0 1 5 0v5zM13 17v-5a2.5 2.5 0 0 1 5 0v5z';

export const menu = svg('M5 9h14M5 15h14');
export const chevronRight = svg('M9 6l6 6-6 6');
export const close = svg('M6 6l12 12M18 6L6 18');
// 地圖上的定位針，中間一個圓。
export const pin = svg('M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11zM12 12.2a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4z');
export const shortSleeve = svg('M8 4c1 1.5 2.3 2 4 2s3-.5 4-2l4 3-2 3-2-1v11H8V9l-2 1-2-3z');
// 毛衣：圓領、袖口和下擺的羅紋。
export const longSleeve = svg(`${sleeves}M9 4c.7 1.3 1.7 2 3 2s2.3-.7 3-2M3 15.3l2.4 1.2M21 15.3l-2.4 1.2M7 18h10`);
// 開襟外套：V 領，前面開口。
export const lightJacket = svg(`${sleeves}M9 4l3 6 3-6M12 10v10`);
// 羽絨外套：立領、拉鍊、橫向車線。
export const heavyCoat = svg(`${sleeves}M9 4h6M12 4v16M7 12.5h10M7 16.5h10`);
// 收起來直立的傘，握把朝上。
export const umbrella = svg('M12 10V5a1.5 1.5 0 0 1 3 0v.5M8.5 10h7l-1.2 10.1a1 1 0 0 1-1 .9h-2.6a1 1 0 0 1-1-.9z');
export const laundry = svg(clothesline);
export const noLaundry = svg(`${clothesline}M5 20L19 4`);
export const wind = svg('M3 9h10.5a2.5 2.5 0 1 0-2.5-2.5M3 13h15.5a2.5 2.5 0 1 1-2.5 2.5M3 17h8');
export const heart = svg('M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z');
