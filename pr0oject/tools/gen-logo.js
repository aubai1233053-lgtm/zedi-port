// Generates the ZEDI wordmark (logo.svg, logo.js, favicon.svg) from calligraphic strokes.
// Run: node tools/gen-logo.js   (a development helper only; the site itself has no build step)
//
// Every part of the letters is one brush stroke: a cubic curve (four points) with a
// width at its start, middle and end. A width of 0 tapers the stroke to a thorn point.
// Strokes overlap freely; the outline uses the nonzero fill rule, so overlaps simply merge.
// Coordinates: y down, the letters sit roughly between y = 110 and y = 290.
const fs = require('fs');
const path = require('path');

// [x0,y0, x1,y1, x2,y2, x3,y3, widthStart, widthMiddle, widthEnd]
const S = (pts, w0, wm, w1) => ({ pts, w: [w0, wm, w1], cap: true });
// a branch grows out of another stroke, so its start needs no pointed cap
const B = (pts, w0, wm, w1) => ({ pts, w: [w0, wm, w1], cap: false });

const strokes = [
  // ---------------------------------------------------------------- Z
  B([176, 112, 210, 104, 244, 114, 272, 106], 30, 38, 26),          // top bar
  B([204, 110, 150, 112, 100, 96, 62, 22], 34, 22, 0),              // horn growing out of the bar, up-left
  S([258, 116, 236, 170, 190, 230, 152, 288], 34, 50, 34),          // diagonal
  B([170, 288, 200, 282, 236, 294, 276, 284], 32, 38, 8),          // bottom bar
  B([204, 288, 120, 292, 40, 330, -40, 412], 34, 24, 0),            // long thorn sweeping down-left
  B([212, 198, 190, 194, 172, 182, 158, 160], 24, 14, 0),           // barb on the diagonal

  // ---------------------------------------------------------------- E
  S([328, 100, 312, 170, 312, 230, 326, 300], 26, 54, 26),          // stem, tapering at both ends
  B([332, 112, 352, 104, 374, 112, 396, 106], 30, 30, 26),          // top arm
  B([388, 108, 420, 96, 442, 70, 448, 18], 26, 16, 0),              // thorn rising to the arch
  B([330, 200, 350, 194, 372, 200, 400, 192], 28, 20, 0),           // middle arm, pointed
  B([332, 292, 352, 298, 374, 288, 396, 294], 30, 30, 26),          // bottom arm
  B([388, 292, 420, 304, 442, 330, 448, 382], 26, 16, 0),           // thorn falling to the lower arch

  // ---------------------------------------------------------------- D
  S([484, 100, 498, 170, 498, 230, 484, 300], 26, 54, 26),          // stem
  S([488, 110, 612, 90, 646, 306, 488, 290], 24, 48, 24),           // bowl
  B([508, 108, 476, 96, 454, 70, 448, 18], 26, 16, 0),              // thorn meeting the E thorn: a pointed arch
  B([508, 292, 476, 304, 454, 330, 448, 382], 26, 16, 0),           // and the lower arch

  // ---------------------------------------------------------------- I
  S([672, 98, 660, 170, 660, 230, 670, 302], 26, 50, 26),           // stem
  B([676, 116, 732, 112, 790, 96, 834, 22], 32, 22, 0),             // horn sweeping up-right (mirrors the Z horn)
  B([674, 288, 764, 292, 856, 330, 936, 412], 32, 24, 0),           // long thorn down-right (mirrors the Z thorn)
  B([672, 112, 650, 108, 632, 96, 620, 74], 28, 16, 0),            // serif flaring up-left, so the I stands on both sides
  B([670, 290, 648, 294, 630, 306, 618, 328], 28, 16, 0),          // and down-left
];

// ------------------------------------------------------------------ geometry
function bez(p, t) {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return [a * p[0] + b * p[2] + c * p[4] + d * p[6], a * p[1] + b * p[3] + c * p[5] + d * p[7]];
}
function tangent(p, t) {
  const u = 1 - t;
  const x = 3 * u * u * (p[2] - p[0]) + 6 * u * t * (p[4] - p[2]) + 3 * t * t * (p[6] - p[4]);
  const y = 3 * u * u * (p[3] - p[1]) + 6 * u * t * (p[5] - p[3]) + 3 * t * t * (p[7] - p[5]);
  const l = Math.hypot(x, y) || 1;
  return [x / l, y / l];
}
// width along the stroke: a smooth curve through start, middle and end
function width(w, t) {
  const m = 2 * w[1] - 0.5 * (w[0] + w[2]);          // so that the width at t = 0.5 is exactly w[1]
  const u = 1 - t;
  return u * u * w[0] + 2 * u * t * m + t * t * w[2];
}
const area = (pts) => pts.reduce((s, p, i) => {
  const q = pts[(i + 1) % pts.length];
  return s + (p[0] * q[1] - q[0] * p[1]);
}, 0) / 2;

const N = 40;
const CAP = 0.55;                                     // length of a pointed end, relative to the stroke width
const SKEW = 0;                                       // upright: the emblem is mirror-balanced
const lean = ([x, y]) => [x + (200 - y) * SKEW, y];

const rings = strokes.map(({ pts, w, cap }) => {
  const left = [], right = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const c = bez(pts, t), d = tangent(pts, t), h = width(w, t) / 2;
    left.push([c[0] - d[1] * h, c[1] + d[0] * h]);
    right.push([c[0] + d[1] * h, c[1] - d[0] * h]);
  }
  if (w[2] === 0) right.pop();                        // a thorn ends in one point, not two
  // blunt ends get a pointed cap, like the diamond-cut terminals of blackletter
  const tip = (t, dir) => {
    const c = bez(pts, t), d = tangent(pts, t), k = CAP * width(w, t) * dir;
    return [c[0] + d[0] * k, c[1] + d[1] * k];
  };
  const startCap = cap && w[0] > 0 ? [tip(0, -1)] : [];
  const endCap = w[2] > 0 ? [tip(1, 1)] : [];
  let ring = startCap.concat(left, endCap, right.reverse()).map(lean);
  if (area(ring) < 0) ring = ring.reverse();          // every stroke the same way round: overlaps merge
  return ring;
});

const all = rings.flat();
const PAD = 6;
const minX = Math.min(...all.map((p) => p[0])) - PAD;
const minY = Math.min(...all.map((p) => p[1])) - PAD;
const W = +(Math.max(...all.map((p) => p[0])) + PAD - minX).toFixed(1);
const H = +(Math.max(...all.map((p) => p[1])) + PAD - minY).toFixed(1);
const f = (n) => +n.toFixed(1);
const d = rings.map((r) => 'M' + r.map(([x, y]) => f(x - minX) + ' ' + f(y - minY)).join('L') + 'Z').join('');

const svgInline = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Zedi" fill="currentColor"><path d="${d}"/></svg>`;
const svgFile = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="zedi-logo-title" fill="currentColor"><title id="zedi-logo-title">Zedi</title><path d="${d}"/></svg>\n`;

const root = process.argv[2] || path.join(__dirname, '..');
fs.writeFileSync(path.join(root, 'assets/img/logo.svg'), svgFile);
fs.writeFileSync(path.join(root, 'assets/js/logo.js'),
`/* The Zedi wordmark as inline SVG, so pages can colour it with CSS.
   Calligraphic gothic letters drawn as tapering brush strokes, with thorns that
   sweep out to both sides and cross into arches between the E and the D.
   Generated by tools/gen-logo.js (edit the strokes there, then run it).
   The strokes overlap and merge under the nonzero fill rule.
   The 3D version (metal.js) is built from this outline too. */
window.ZEDI_LOGO = '${svgInline}';
window.ZEDI_LOGO_RATIO = ${(W / H).toFixed(4)};
`);

// favicon: the Z strokes alone on the accent square
const zRings = rings.slice(0, 6);   // the Z strokes (first six)
const zp = zRings.flat();
const zx0 = Math.min(...zp.map((p) => p[0])), zx1 = Math.max(...zp.map((p) => p[0]));
const zy0 = Math.min(...zp.map((p) => p[1])), zy1 = Math.max(...zp.map((p) => p[1]));
const s = 54 / Math.max(zx1 - zx0, zy1 - zy0);
const ox = 32 - (zx0 + zx1) / 2 * s, oy = 32 - (zy0 + zy1) / 2 * s;
const zd = zRings.map((r) => 'M' + r.map(([x, y]) => f(x * s + ox) + ' ' + f(y * s + oy)).join('L') + 'Z').join('');
fs.writeFileSync(path.join(root, 'assets/img/favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#d4f70a"/><path d="${zd}" fill="#000"/></svg>\n`);

// the strokes (same coordinates as the SVG), for tools/blender-logo.py
fs.writeFileSync(path.join(root, 'tools/logo-strokes.json'), JSON.stringify({
  width: W, height: H, samples: N, cap: CAP,
  // the stroke definitions themselves (shifted like the SVG), so Blender can bevel each one exactly
  strokes: strokes.map(({ pts, w, cap }) => ({
    pts: pts.map((v, i) => f(v - (i % 2 ? minY : minX))), w, cap,
  })),
}));

console.log('viewBox', W, H, 'ratio', (W / H).toFixed(4), 'points', all.length);
