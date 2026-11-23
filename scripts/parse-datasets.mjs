// 從氣象署 API 文件（YAML 文字）整理出「縣市 -> 3 天 / 1 週預報資料集代碼」。
// 每個 endpoint 只在自己的區段內找 summary；整理完要 22 個縣市都有兩個代碼，否則丟錯誤。
const ENDPOINT = /^\s*\/v1\/rest\/datastore\/([A-Z]-[A-Z]\d{4}-\d{3}):/;

export function parseDatasets(text) {
  const lines = text.split(/\r?\n/);
  const datasets = {};
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(ENDPOINT);
    if (!m || !m[1].startsWith('F-D0047-')) continue;
    for (let j = i + 1; j < lines.length && !ENDPOINT.test(lines[j]); j++) {
      const s = lines[j].match(/summary:\s*鄉鎮天氣預報-(.+?)未來(3天|1週)天氣預報/);
      if (!s) continue;
      if (s[1] !== '臺灣') (datasets[s[1]] ??= {})[s[2] === '3天' ? 'threeDay' : 'weekly'] = m[1];
      break;
    }
  }
  const names = Object.keys(datasets);
  const bad = names.filter((c) => !datasets[c].threeDay || !datasets[c].weekly);
  if (names.length !== 22 || bad.length) {
    throw new Error(`資料集對照表不完整：${names.length} 個縣市，缺代碼的縣市：${bad.join('、') || '無'}`);
  }
  return datasets;
}
