import { fetchForecast } from './api.js';
import { resolveLocation, isTownList } from './logic/location.js';
import { openPicker } from './render/picker.js';
import { renderHero, setupCompactHeader } from './render/hero.js';
import { renderDataTime, renderNowTiles, renderHourly, renderAdvice, renderWeekly, renderObsTiles, renderSun } from './render/sections.js';
import { open72hPanel } from './render/panel72h.js';
import { open7dPanel } from './render/panel7d.js';

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
const compact = document.getElementById('compact');
const $ = (id) => document.getElementById(id);
const sections = ['data-time', 'now', 'hourly', 'advice', 'weekly', 'obs', 'sun'].map($);

function openLocationPicker() {
  openPicker(towns, current, (loc) => { current = loc; save(loc); load(true); });
}

function render(data) {
  renderHero(hero, data, { onOpenPicker: openLocationPicker });
  setupCompactHeader(hero, compact, data);
  renderDataTime($('data-time'), data);
  renderNowTiles($('now'), data);
  renderHourly($('hourly'), data, { onDetail: () => open72hPanel(data) });
  renderAdvice($('advice'), data);
  renderWeekly($('weekly'), data, { onDetail: () => open7dPanel(data) });
  renderObsTiles($('obs'), data);
  renderSun($('sun'), data);
}

// 載入中或出錯時，只留最上方那一塊顯示狀態。
function clearSections() {
  for (const s of sections) s.replaceChildren();
  compact.classList.remove('show');
}

function renderError(err) {
  const msg = document.createElement('p');
  msg.className = 'error';
  msg.textContent = `無法取得天氣資料：${err.message}`;
  const retry = document.createElement('button');
  retry.type = 'button';
  retry.textContent = '重試';
  retry.addEventListener('click', () => (towns.length && current ? load() : init()));
  hero.replaceChildren(msg, retry);
  // 存起來的地點一直失敗時，重新整理也還是同一個地點；鄉鎮清單有載入就讓使用者換地點。
  if (towns.length) {
    const other = document.createElement('button');
    other.type = 'button';
    other.textContent = '選擇其他地點';
    other.addEventListener('click', openLocationPicker);
    hero.append(' ', other);
  }
  clearSections();
}

async function load(refocus = false) {
  hero.textContent = '載入中…';
  clearSections();
  try {
    render(await fetchForecast(current.county, current.town));
    if (refocus) document.getElementById('menu')?.focus();
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
