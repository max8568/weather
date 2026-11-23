// 從氣象署 API 文件（YAML 文字）整理出「縣市 -> 3 天 / 1 週預報資料集代碼」。
// 每個 endpoint 的 summary 只從它自己的 paths 項目讀；整理完要 22 個縣市都有兩個代碼，否則丟錯誤。
import yaml from 'js-yaml';

// 只收集，不檢查是否完整
export function collectDatasets(text) {
  const doc = yaml.load(text);
  const datasets = {};
  for (const [path, item] of Object.entries(doc?.paths ?? {})) {
    const m = path.match(/\/v1\/rest\/datastore\/(F-D0047-\d{3})$/);
    const s = String(item?.get?.summary ?? '').match(/鄉鎮天氣預報-(.+?)未來(3天|1週)天氣預報/);
    if (!m || !s || s[1] === '臺灣') continue;
    (datasets[s[1]] ??= {})[s[2] === '3天' ? 'threeDay' : 'weekly'] = m[1];
  }
  return datasets;
}

export function parseDatasets(text) {
  const datasets = collectDatasets(text);
  const names = Object.keys(datasets);
  const bad = names.filter((c) => !datasets[c].threeDay || !datasets[c].weekly);
  if (names.length !== 22 || bad.length) {
    throw new Error(`資料集對照表不完整：${names.length} 個縣市，缺代碼的縣市：${bad.join('、') || '無'}`);
  }
  return datasets;
}
