import { iconKey, isNight, iconUrl } from '../logic/icons.js';
import { h, img, deg } from './sections.js';
import { menu } from './ui-icons.js';

// 右側淺藍區塊加放大的天氣圖示；沒有天氣現象就不放圖示。
function panel(data) {
  const parts = [h('div', 'hero-panel')];
  const weather = data.threeDay?.current.weather;
  if (weather) parts.push(img(iconUrl(iconKey(weather), { night: isNight(data.generatedAt) }), '', 'hero-icon'));
  return parts;
}

export function renderHero(el, data, { onOpenPicker }) {
  const obs = data.observation;
  const next = data.threeDay?.next24h;

  const menuBtn = h('button', 'menu-btn');
  menuBtn.type = 'button';
  menuBtn.setAttribute('aria-label', '選擇地點');
  menuBtn.innerHTML = menu;
  menuBtn.addEventListener('click', onOpenPicker);

  const place = h('button', 'place', `${data.county} ${data.town}`);
  place.type = 'button';
  place.id = 'place';
  place.addEventListener('click', onOpenPicker);

  const humidity = obs?.humidity?.value;
  const text = h('div', 'hero-text');
  text.append(
    menuBtn,
    place,
    h('div', 'temp', deg(obs?.temperature?.value)),
    h('div', 'hero-range', `未來 24 小時 最高 ${deg(next?.max)}・最低 ${deg(next?.min)}`),
    h('div', 'hero-weather', data.threeDay?.current.weather || '--'),
    h('div', 'hero-wind', `${obs?.windDirection?.value || '--'}・濕度 ${typeof humidity === 'number' ? `${humidity}%` : '--'}`),
  );
  el.replaceChildren(...panel(data), text);
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
  }, { rootMargin: '-80px 0px 0px 0px' });
  observer.observe(heroEl);
}
