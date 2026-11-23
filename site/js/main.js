import { fetchForecast } from './api.js';
import { resolveLocation, isTownList } from './logic/location.js';
import { openPicker } from './render/picker.js';
import { renderHero, setupCompactHeader } from './render/hero.js';
import { renderDataTime, renderNowTiles, renderHourly, renderAdvice, renderWeekly, renderObsTiles, renderSun } from './render/sections.js';

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
const onDetail = () => {}; // Task 9 接上面板

function openLocationPicker() {
  openPicker(towns, current, (loc) => { current = loc; save(loc); load(true); });
}

function render(data) {
  renderHero(hero, data, { onOpenPicker: openLocationPicker });
  setupCompactHeader(hero, compact, data);
  renderDataTime($('data-time'), data);
  renderNowTiles($('now'), data);
  renderHourly($('hourly'), data, { onDetail });
  renderAdvice($('advice'), data);
  renderWeekly($('weekly'), data, { onDetail });
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
  clearSections();
}

async function load(refocus = false) {
  hero.textContent = '載入中…';
  clearSections();
  try {
    render(await fetchForecast(current.county, current.town));
    if (refocus) document.getElementById('place')?.focus();
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
