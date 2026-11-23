// 穿著、帶傘、曬衣建議。缺值的項目不給。
export function adviceItems({ maxT, pop, weather }) {
  const items = [];
  if (typeof maxT === 'number') {
    if (maxT >= 26) items.push({ key: 'short-sleeve', label: '短袖' });
    else if (maxT >= 20) items.push({ key: 'light-long-sleeve', label: '薄長袖' });
    else if (maxT >= 15) items.push({ key: 'jacket', label: '外套' });
    else items.push({ key: 'heavy-coat', label: '厚外套' });
  }
  if (typeof pop === 'number') {
    if (pop >= 50) items.push({ key: 'umbrella', label: '帶傘' });
    if (pop <= 20 && !(weather || '').includes('雨')) items.push({ key: 'laundry', label: '適合曬衣' });
  }
  return items;
}
