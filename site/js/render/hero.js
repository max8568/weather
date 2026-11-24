import { iconKey, isNight, iconUrl } from '../logic/icons.js';
import { dateLabel } from '../logic/format.js';
import { h, img, deg } from './sections.js';
import { menu } from './ui-icons.js';

// 精簡列右側的淺藍區塊加天氣圖示；沒有天氣現象就不放圖示。
function panel(data) {
  const parts = [h('div', 'hero-panel')];
  const weather = data.threeDay?.current.weather;
  if (weather) parts.push(img(iconUrl(iconKey(weather), { night: isNight(data.generatedAt) }), '', 'hero-icon'));
  return parts;
}

// 溫度卡片：左欄地點、日期、實測溫度、未來 24 小時最高最低溫；右欄天氣圖示，正下方是天氣現象。
// 右上角是選單圖示，點了打開地點選單（地點文字本身不是按鈕）。
export function renderHero(el, data, { onOpenPicker }) {
  const next = data.threeDay?.next24h;
  const weather = data.threeDay?.current.weather;

  const menuBtn = h('button', 'menu-btn');
  menuBtn.type = 'button';
  menuBtn.id = 'menu';
  menuBtn.setAttribute('aria-label', '選擇地點');
  menuBtn.innerHTML = menu;
  menuBtn.addEventListener('click', onOpenPicker);

  const t = data.observation?.temperature?.value;
  const temp = h('div', 'temp', typeof t === 'number' ? String(Math.round(t)) : '--');
  temp.append(h('span', 'unit', '°C'));

  const text = h('div', 'hero-text');
  text.append(
    h('div', 'place', `${data.county} ${data.town}`),
    h('div', 'hero-date', dateLabel(data.generatedAt)),
    temp,
    h('div', 'hero-range', `未來 24 小時 ${deg(next?.min)}–${deg(next?.max)}`),
  );
  const look = h('div', 'hero-look');
  if (weather) look.append(img(iconUrl(iconKey(weather), { night: isNight(data.generatedAt) }), '', 'hero-look-icon'));
  look.append(h('div', 'hero-weather', weather || '--'));
  const card = h('div', 'hero-card');
  card.append(text, look);
  el.replaceChildren(card, menuBtn);
}

let observer = null;

// 最上方離開畫面時，頂端固定顯示精簡版（名稱、溫度、天氣）。
export function setupCompactHeader(heroEl, compactEl, data) {
  observer?.disconnect();
  const row = h('div', 'compact-row');
  row.append(
    h('span', 'compact-temp', deg(data.observation?.temperature?.value)),
    h('span', 'compact-weather', data.threeDay?.current.weather || '--'),
  );
  const text = h('div', 'compact-text');
  text.append(h('div', 'compact-place', `${data.county} ${data.town}`), row);
  compactEl.replaceChildren(...panel(data), text);
  compactEl.classList.remove('show');
  observer = new IntersectionObserver(([entry]) => {
    compactEl.classList.toggle('show', !entry.isIntersecting);
  });
  observer.observe(heroEl);
}
