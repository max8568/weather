// 切換列：上一種、下拉選單、下一種。網址 ?v=<key> 直接開某一種，左右鍵也能換。
(function () {
  const app = document.getElementById('app');
  const pick = document.getElementById('pick');
  const list = window.LAYOUTS;
  let index = 0;
  let cleanup = null;

  pick.innerHTML = list.map((l, i) => `<option value="${l.key}">${i + 1}. ${l.name}</option>`).join('');

  function show(i, updateUrl) {
    if (cleanup) cleanup();
    cleanup = null;
    index = (i + list.length) % list.length;
    const layout = list[index];
    app.className = `v-${layout.key}`;
    app.innerHTML = layout.render(window.WEATHER);
    if (layout.mount) cleanup = layout.mount(app, window.WEATHER) || null;
    pick.value = layout.key;
    document.title = `${layout.name}｜天氣預報排版`;
    if (updateUrl) {
      const url = new URL(location.href);
      url.searchParams.set('v', layout.key);
      history.replaceState(null, '', url);
      window.scrollTo(0, 0);
    }
  }

  pick.addEventListener('change', () => show(pick.selectedIndex, true));
  document.getElementById('prev').addEventListener('click', () => show(index - 1, true));
  document.getElementById('next').addEventListener('click', () => show(index + 1, true));
  document.addEventListener('keydown', (e) => {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[e.key];
    if (!step || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.defaultPrevented) return;
    if (e.target.closest('input, select, textarea, [data-own-keys]')) return;
    e.preventDefault();
    show(index + step, true);
  });

  const wanted = new URLSearchParams(location.search).get('v');
  show(Math.max(0, list.findIndex((l) => l.key === wanted)), false);
})();
