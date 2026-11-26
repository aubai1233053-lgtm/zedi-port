// Imports the ZEDI mark (a glTF model, used with the permission of its author) into the site.
//
//   node tools/import-mark.js tools/zedi-mark.glb
//   node tools/render-mark.js
//
// This step only packs the model into tools/render-mark.html (a page that cannot fetch files,
// since it runs from file://). tools/render-mark.js then opens that page, which renders the turn
// frames with three.js and traces the mark's flat outline, and writes everything into the site.
const fs = require('fs');
const path = require('path');

const src = process.argv[2];
if (!src) { console.error('usage: node tools/import-mark.js zedi-mark.glb'); process.exit(1); }
const glb = fs.readFileSync(src);
if (glb.toString('ascii', 0, 4) !== 'glTF') throw new Error('not a glb file');

const template = fs.readFileSync(path.join(__dirname, 'render-mark.template.html'), 'utf8');
fs.writeFileSync(path.join(__dirname, 'render-mark.html'), template.replace('__GLB_BASE64__', glb.toString('base64')));
console.log('packed', glb.length, 'bytes into tools/render-mark.html');
