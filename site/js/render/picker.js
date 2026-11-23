import { openSheet } from './sheet.js';

// 先列縣市，點了列該縣市的鄉鎮；鄉鎮畫面上方「縣市」可返回。
export function openPicker(towns, current, onPick) {
  const content = document.createElement('div');
  let sheet;
  let picked = false;

  function listButton(label, selected, onClick) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick-item' + (selected ? ' selected' : '');
    b.textContent = label;
    b.addEventListener('click', onClick);
    return b;
  }

  function showCounties() {
    content.replaceChildren(...towns.map((c) => listButton(c.county, c.county === current.county, () => showTowns(c))));
    (content.querySelector('.selected') || content.firstElementChild).focus();
  }

  function showTowns(c) {
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'pick-back';
    back.textContent = '‹ 縣市';
    back.addEventListener('click', showCounties);
    const title = document.createElement('div');
    title.className = 'pick-county';
    title.textContent = c.county;
    content.replaceChildren(back, title, ...c.towns.map((t) =>
      listButton(t, c.county === current.county && t === current.town, () => {
        if (picked) return;
        picked = true;
        sheet.close();
        onPick({ county: c.county, town: t });
      })));
    back.focus();
  }

  showCounties();
  sheet = openSheet({ title: '選擇地點', content });
  return sheet;
}
