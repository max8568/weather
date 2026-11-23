// 穿著、薄外套、帶傘、曬衣建議。缺值的項目不給。night：這個時段的開始時間是不是在晚上（18:00 到 06:00）。
export function adviceItems({ maxT, minT, pop, weather, night }) {
  const items = [];
  if (typeof maxT === 'number') {
    if (maxT >= 22) items.push({ key: 'short-sleeve', label: '短袖' });
    else if (maxT >= 16) items.push({ key: 'long-sleeve', label: '長袖' });
    else items.push({ key: 'heavy-coat', label: '厚外套' });
    if (maxT >= 16 && typeof minT === 'number' && minT <= (night ? 20 : 16)) items.push({ key: 'light-jacket', label: '薄外套' });
  }
  if (typeof pop === 'number') {
    if (pop >= 50) items.push({ key: 'umbrella', label: '帶雨傘' });
    if (pop <= 20 && !(weather || '').includes('雨')) items.push({ key: 'laundry', label: '適合曬衣' });
    else items.push({ key: 'no-laundry', label: '不適合曬衣' });
  }
  return items;
}
