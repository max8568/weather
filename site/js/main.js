import { fetchForecast } from './api.js';
import { resolveLocation, isTownList } from './logic/location.js';
import { openPicker } from './render/picker.js';

const KEY = 'weather.location';
let towns = [];
let current = null;

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; }
}
function save(loc) {
  try { localStorage.setItem(KEY, JSON.stringify(loc)); } catch { /* 存不了就算了 */ }
}

const hero = document.getElementById('hero');

function render(data) {
  const t = data.observation?.temperature?.value;
  const place = document.createElement('button');
  place.type = 'button';
  place.id = 'place';
  place.className = 'place';
  place.textContent = `${data.county} ${data.town}`;
  place.addEventListener('click', () => openPicker(towns, current, (loc) => { current = loc; save(loc); load(); }));
  const temp = document.createElement('div');
  temp.className = 'temp';
  temp.textContent = t == null ? '--' : `${t}°`;
  hero.replaceChildren(place, temp);
}

function renderError(err) {
  const msg = document.createElement('p');
  msg.className = 'error';
  msg.textContent = `無法取得天氣資料：${err.message}`;
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.textContent = '重試';
  retry.addEventListener('click', towns.length && current ? load : init);
  hero.replaceChildren(msg, retry);
}

async function load() {
  hero.textContent = '載入中…';
  try {
    render(await fetchForecast(current.county, current.town));
  } catch (err) {
    renderError(err);
  }
}

async function init() {
  try {
    const res = await fetch('data/towns.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const list = await res.json();
    if (!isTownList(list)) throw new Error('縣市清單格式不正確');
    towns = list;
  } catch (err) {
    renderError(err);
    return;
  }
  current = resolveLocation(loadSaved(), towns);
  load();
}
init();
