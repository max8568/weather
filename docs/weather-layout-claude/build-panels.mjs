// 把網站的「詳細預報」面板（72 小時、7 日）從 site/js 的 ES module 轉成一般 <script> 可以載入的檔案，
// 樣式從 site/css/style.css 取出面板用到的部分。原型要能直接用 file:// 打開，file:// 不能載入 module。
// 網站的面板改了就重跑：node docs/weather-layout-claude/build-panels.mjs
// 測試會比對這裡產生的內容和檔案，沒重跑會失敗。
import { readFileSync, writeFileSync } from 'node:fs';
import { posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = new URL('../../', import.meta.url);
const read = (path) => readFileSync(new URL(path, ROOT), 'utf8').replace(/\r\n/g, '\n');

// 照相依順序排：被 import 的放前面
const MODULES = [
  'render/ui-icons.js', 'logic/icons.js', 'logic/format.js', 'logic/advice.js', 'chart.js',
  'render/sections.js', 'render/sheet.js', 'render/panel72h.js', 'render/panel7d.js',
];

const HEADER = '由 docs/weather-layout-claude/build-panels.mjs 從 site/ 產生，不要手改；網站改了就重跑那支程式。';

// 每個 module 包成一個函式，import 改成從 M 取，export 的名字最後一起回傳
function wrap(name) {
  const dir = posix.dirname(name);
  const from = (spec) => `M['${posix.join(dir, spec)}']`;
  const exported = [];
  let src = read(`site/js/${name}`)
    .replace(/^import \* as (\w+) from '([^']+)';$/gm, (_, id, spec) => `const ${id} = ${from(spec)};`)
    .replace(/^import \{([^}]+)\} from '([^']+)';$/gm, (_, names, spec) => `const {${names.replace(/(\w+) as (\w+)/g, '$1: $2')}} = ${from(spec)};`)
    .replace(/^export (function|const) (\w+)/gm, (_, kind, id) => { exported.push(id); return `${kind} ${id}`; });
  if (/^\s*(import|export)\b/m.test(src)) throw new Error(`${name}: 有這支程式沒處理的 import 或 export 寫法`);
  // 網站的圖示路徑是相對於 site/，原型在 docs/weather-layout-claude/
  if (name === 'logic/icons.js') {
    const before = src;
    src = src.replace('`icons/weather/', '`../../site/icons/weather/');
    if (src === before) throw new Error('logic/icons.js: 找不到圖示路徑');
  }
  return `M['${name}'] = (function () {\n${src.trimEnd()}\nreturn { ${exported.join(', ')} };\n})();\n`;
}

// 每條規則前面加上 .sheet-backdrop，樣式只套用在面板裡，不會影響原型各排版裡同名的 class
const scopeSelectors = (sel) => sel.split(',').map((s) => s.trim())
  .map((s) => (s.startsWith('.sheet-backdrop') ? s : `.sheet-backdrop ${s}`)).join(', ');
function scope(line) {
  if (line.startsWith('@media')) return line.replace(/\{ ([^{}]+) \{/, (_, sel) => `{ ${scopeSelectors(sel)} {`);
  if (!line.startsWith('.')) return line;
  const i = line.indexOf('{');
  return `${scopeSelectors(line.slice(0, i))} ${line.slice(i)}`;
}

function css() {
  const lines = read('site/css/style.css').split('\n');
  const start = lines.findIndex((l) => l.startsWith('.sheet-backdrop'));
  const tiles = lines.filter((l) => /^\.tiles? |^\.tile-/.test(l));
  const panels = lines.slice(start).filter((l) => !l.startsWith('.pick-'));
  // 面板的圓角用網站的 --radius，原型的 base.css 沒有這個值
  return [`/* ${HEADER} */`, '.sheet-backdrop { --radius: 20px; }', ...[...tiles, ...panels].map(scope)].join('\n').trimEnd() + '\n';
}

export function build() {
  const js = `// ${HEADER}\n(function () {\nconst M = {};\n${MODULES.map(wrap).join('')}`
    + `window.SITE_PANELS = { open72hPanel: M['render/panel72h.js'].open72hPanel, open7dPanel: M['render/panel7d.js'].open7dPanel };\n})();\n`;
  return { js, css: css() };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { js, css: style } = build();
  writeFileSync(new URL('site-panels.js', import.meta.url), js);
  writeFileSync(new URL('site-panels.css', import.meta.url), style);
}
