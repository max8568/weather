// 從下方滑出的面板。左上關閉按鈕、點背景或按 Esc 關閉。
export function openSheet({ title, content, onClose }) {
  const backdrop = document.createElement('div');
  backdrop.className = 'sheet-backdrop';
  const sheet = document.createElement('div');
  sheet.className = 'sheet';
  sheet.setAttribute('role', 'dialog');
  sheet.setAttribute('aria-modal', 'true');
  sheet.setAttribute('aria-label', title);

  const head = document.createElement('div');
  head.className = 'sheet-head';
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'sheet-close';
  closeBtn.setAttribute('aria-label', '關閉');
  closeBtn.textContent = '×';
  const h = document.createElement('h2');
  h.textContent = title;
  head.append(closeBtn, h);

  const body = document.createElement('div');
  body.className = 'sheet-body';
  body.append(content);
  sheet.append(head, body);
  backdrop.append(sheet);
  document.body.append(backdrop);
  const trigger = document.activeElement;
  const page = document.querySelector('main');
  if (page) page.inert = true;
  closeBtn.focus();

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    document.removeEventListener('keydown', onKey);
    backdrop.classList.add('closing');
    sheet.inert = true;
    if (page) page.inert = false;
    if (trigger && trigger.isConnected) trigger.focus();
    setTimeout(() => backdrop.remove(), 250);
    if (onClose) onClose();
  }
  function onKey(e) {
    if (e.key === 'Escape') { close(); return; }
    if (e.key !== 'Tab') return;
    const items = [...sheet.querySelectorAll('button')];
    const i = items.indexOf(document.activeElement);
    if (!items.length) return;
    if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
    else if (!e.shiftKey && (i === -1 || i === items.length - 1)) { e.preventDefault(); items[0].focus(); }
  }
  document.addEventListener('keydown', onKey);
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  return { close };
}
