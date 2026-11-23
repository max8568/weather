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
  requestAnimationFrame(() => backdrop.classList.add('open'));

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    document.removeEventListener('keydown', onKey);
    backdrop.classList.remove('open');
    setTimeout(() => backdrop.remove(), 250);
    if (onClose) onClose();
  }
  function onKey(e) { if (e.key === 'Escape') close(); }
  document.addEventListener('keydown', onKey);
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  return { close };
}
