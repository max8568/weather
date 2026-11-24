import { openSheet } from './sheet.js';
import { pin } from './ui-icons.js';

// 先列縣市，點了列該縣市的鄉鎮；鄉鎮畫面上方「縣市」可返回。
// locate 有給才在縣市清單最上面放「使用目前位置」；它回傳 {county, town}，失敗時丟出要顯示給使用者的 Error。
export function openPicker(towns, current, onPick, locate) {
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

  function choose(loc) {
    if (picked) return;
    picked = true;
    sheet.close();
    onPick(loc);
  }

  // 定位要等幾秒。等的時候按鈕改成「定位中…」，重按不理；失敗的說明顯示在按鈕下面。
  const status = document.createElement('p');
  status.className = 'pick-status';
  status.setAttribute('role', 'status');
  const locateBtn = document.createElement('button');
  locateBtn.type = 'button';
  locateBtn.className = 'pick-locate';
  locateBtn.innerHTML = pin;
  const locateLabel = document.createElement('span');
  locateLabel.textContent = '使用目前位置';
  locateBtn.append(locateLabel);
  let locating = false;
  locateBtn.addEventListener('click', async () => {
    if (locating) return;
    locating = true;
    locateLabel.textContent = '定位中…';
    status.textContent = '';
    try {
      choose(await locate());
    } catch (err) {
      status.textContent = err.message;
    } finally {
      locating = false;
      locateLabel.textContent = '使用目前位置';
    }
  });

  function showCounties() {
    content.replaceChildren(...(locate ? [locateBtn, status] : []), ...towns.map((c) => listButton(c.county, c.county === current.county, () => showTowns(c))));
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
      listButton(t, c.county === current.county && t === current.town, () => choose({ county: c.county, town: t }))));
    back.focus();
  }

  showCounties();
  sheet = openSheet({ title: '選擇地點', content, onClose: () => { picked = true; } });
  return sheet;
}
