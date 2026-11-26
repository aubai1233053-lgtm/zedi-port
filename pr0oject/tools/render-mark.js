// Renders the ZEDI mark turn frames into assets/img/logo3d/ (day-0..8.webp, night-0..8.webp).
//
//   node tools/import-mark.js path/to/zedi-mark.glb   (once, builds tools/render-mark.html)
//   node tools/render-mark.js
//
// Opens tools/render-mark.html in headless Microsoft Edge (or Chrome), which draws every frame
// with three.js and leaves them in the page as data URLs; this script saves them as files.
// A development helper only: the site itself just shows the finished images.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'assets/img/logo3d');
const page = path.join(__dirname, 'render-mark.html');
if (!fs.existsSync(page)) { console.error('run tools/import-mark.js first'); process.exit(1); }

const browsers = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
];
const browser = browsers.find((b) => fs.existsSync(b));
if (!browser) { console.error('no Edge or Chrome found'); process.exit(1); }

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'zedi-render-'));
const dom = execFileSync(browser, [
  '--headless=new', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  '--virtual-time-budget=60000', '--user-data-dir=' + profile, '--dump-dom',
  'file:///' + page.replace(/\\/g, '/'),
], { maxBuffer: 256 * 1024 * 1024, encoding: 'utf8' });
fs.rmSync(profile, { recursive: true, force: true });

const title = /<title>([^<]*)<\/title>/.exec(dom);
if (!title || !/^done/.test(title[1])) { console.error('the render page did not finish (title: ' + (title && title[1]) + ')'); process.exit(1); }
fs.mkdirSync(OUT, { recursive: true });
let n = 0;
dom.replace(/<pre id="((?:day|night)-\d)">data:image\/webp;base64,([^<]+)<\/pre>/g, (_, name, data) => {
  fs.writeFileSync(path.join(OUT, name + '.webp'), Buffer.from(data, 'base64'));
  n++;
  return '';
});
console.log(title[1], '-', n, 'frames written to', path.relative(ROOT, OUT));
if (n !== 18) process.exit(1);

// ------------------------------------------------------------------ flat outline
const outline = /<pre id="outline">([^<]+)<\/pre>/.exec(dom);
if (!outline) { console.error('no outline in the page'); process.exit(1); }
const { width: W, height: H, loops } = JSON.parse(outline[1].replace(/&quot;/g, '"'));
const d = loops.map((l) => 'M' + l.map((p) => p.join(' ')).join('L') + 'Z').join('');
const svgInline = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Zedi" fill="currentColor"><path fill-rule="evenodd" d="${d}"/></svg>`;
const svgFile = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="zedi-logo-title" fill="currentColor"><title id="zedi-logo-title">Zedi</title><path fill-rule="evenodd" d="${d}"/></svg>\n`;
fs.writeFileSync(path.join(ROOT, 'assets/img/logo.svg'), svgFile);
fs.writeFileSync(path.join(ROOT, 'assets/js/logo.js'),
`/* The Zedi wordmark as inline SVG, so pages can colour it with CSS.
   The flat outline of the ZEDI mark (used with its author's permission), traced
   from the 3D model seen straight on by tools/render-mark.js. The 3D version
   (metal.js) shows renders of the same model, so the two line up exactly. */
window.ZEDI_LOGO = '${svgInline}';
window.ZEDI_LOGO_RATIO = ${(W / H).toFixed(4)};
`);
// favicon: the whole mark on the accent square
const k = 58 / W;
const fav = loops.map((l) => 'M' + l.map(([x, y]) => +(x * k + 3).toFixed(2) + ' ' + +(y * k + 32 - H * k / 2).toFixed(2)).join('L') + 'Z').join('');
fs.writeFileSync(path.join(ROOT, 'assets/img/favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#d4f70a"/><path fill-rule="evenodd" d="${fav}" fill="#000"/></svg>\n`);
console.log('outline', loops.length, 'loops, viewBox', W, H);
