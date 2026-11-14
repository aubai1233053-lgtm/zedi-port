/* ==========================================================================
   HOME — the floating tiles
   A camera sits in the middle of the scene and turns towards the pointer;
   tiles hang on a wall in front of it, each one angled to face the viewer.
   Everything is real DOM (links, videos, text) moved with CSS 3D transforms,
   so it also works from file:// and stays accessible.

   Scene units ("u") follow the reference scene: camera 11u from the wall,
   45 degree vertical field of view, a 5 x 4 grid of cells with the middle
   kept free for the wordmark.
   ========================================================================== */
(function () {
  'use strict';

  var Z = window.Zedi;
  if (!Z) return;

  Z.ready(function () {
    var h = Z.h;
    var stage = document.getElementById('home-sphere');
    var logoHolder = document.getElementById('home-logo');
    if (!stage) return;

    if (logoHolder) {
      logoHolder.appendChild(Z.logo());
      Z.tilt(logoHolder, 'translate(-50%, -50%)');
    }

    /* ------------------------------------------------------- constants */
    var FOV = 45 * Math.PI / 180;   // vertical field of view
    var DEPTH = 11;                 // eye -> wall of tiles
    var FOCUS = 3;                  // eye -> the point every tile is turned towards
    var ROWS = 4;
    var COLS = 5;
    var GAP = 0.5;                  // minimum gap between grid cells
    var EASE = 0.03;                // camera catches up 3% per frame (at 60 fps)
    var DRIFT = 0.08 / 0.03;        // "loose" tiles slide this many units per radian of camera turn
    var LABEL_H = 0.2;              // label bar height
    var CHAR_W = 0.09;              // rough width of one label character, used for truncation

    /* ---------------------------------------------------------- tiles */
    function pickItems() {
      var conf = Z.content.home.tiles;
      var items = [];
      if (Array.isArray(conf)) {
        conf.forEach(function (slug) {
          var item = Z.getProject(String(slug)) || Z.getArt(String(slug));
          if (item && items.indexOf(item) === -1) items.push(item);
        });
      } else {
        var films = Z.projects().filter(function (p) { return p.home; });
        var works = Z.art().filter(function (a) { return a.home; });
        if (!films.length && !works.length) { films = Z.projects(); works = Z.art(); }
        var i = 0;
        var j = 0;
        while (i < films.length || j < works.length) {      // two films, then one artwork
          if (i < films.length) items.push(films[i++]);
          if (i < films.length) items.push(films[i++]);
          if (j < works.length) items.push(works[j++]);
        }
      }
      return items.slice(0, ROWS * COLS);
    }

    // Small deterministic random generator, so a layout can be rebuilt identically on resize.
    function randomSource(seed) {
      var a = seed >>> 0;
      return function () {
        a = (a + 0x6D2B79F5) | 0;
        var t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    var seedParam = null;
    try { seedParam = new URLSearchParams(window.location.search).get('seed'); } catch (e) { /* ignore */ }
    var seed = seedParam !== null && isFinite(parseInt(seedParam, 10))
      ? parseInt(seedParam, 10)
      : Math.floor(Math.random() * 4294967296);
    var random = randomSource(seed);

    // Grid cells ordered from the centre outwards: the first tiles get the best seats.
    var cells = [];
    for (var row = 0; row < ROWS; row++) {
      for (var col = 0; col < COLS; col++) {
        cells.push({ row: row, col: col, score: -Math.abs(row - Math.floor(ROWS / 2)) - Math.abs(col - Math.floor(COLS / 2)) });
      }
    }
    cells.sort(function (a, b) { return b.score - a.score; });

    var world = h('div', { class: 'home-world' });
    var still = h('div', { class: 'home-layer' });
    var loose = h('div', { class: 'home-layer' });
    world.appendChild(still);
    world.appendChild(loose);
    stage.appendChild(world);

    var tiles = pickItems().map(function (item, index) {
      var isFilm = item.kind === 'project';
      var first = isFilm ? (item.client || item.category) : 'Art';
      var text = (first ? first.toLocaleUpperCase() + '   ' : '') + item.title;
      var name = item.title + (first ? ', ' + first : '');
      var media;

      if (isFilm) {
        media = h('video', {
          muted: true, loop: true, playsinline: true, preload: 'metadata', tabindex: '-1',
          poster: item.poster || null, src: item.preview || null, 'aria-hidden': 'true', disablepictureinpicture: true,
        });
        media.muted = true;         // the attribute alone is not enough for autoplay in every browser
      } else {
        media = h('img', { src: item.thumb, alt: '', decoding: 'async', draggable: 'false' });
      }

      var label = h('span', { class: 'home-tile__label' });
      var mediaBox = h('span', { class: 'home-tile__media' }, media);
      var el = h('a', {
        class: 'home-tile', href: isFilm ? Z.projectUrl(item) : Z.artUrl(item),
        draggable: 'false', 'aria-label': name,
      }, mediaBox, label);

      var tile = {
        el: el, media: media, mediaBox: mediaBox, label: label, item: item, isFilm: isFilm, text: text,
        cell: cells[index], seed: Math.floor(random() * 4294967296), loose: random() <= 0.6,
        x: 0, y: 0, visible: false,
      };
      (tile.loose ? loose : still).appendChild(el);

      // fade the tile in once it has something to show (or after a short wait if the file is slow or missing)
      var shown = false;
      function show() { if (!shown) { shown = true; el.classList.add('is-shown'); } }
      media.addEventListener(isFilm ? 'loadeddata' : 'load', show);
      media.addEventListener('error', show);
      window.setTimeout(show, 1200 + index * 60);
      if (!isFilm && media.complete) show();

      el.addEventListener('focus', function () { lookAt(tile); });
      return tile;
    });

    /* --------------------------------------------------------- layout */
    var P = 1;            // CSS perspective in px
    var U = 1;            // px per scene unit at the wall
    var mobile = false;

    function sizeOf(tile) {
      if (tile.isFilm) {
        var widths = mobile ? { small: 2.2, medium: 3.2, big: 3.7 } : { small: 2.6, medium: 4.2, big: 5 };
        var w = widths[tile.item.size] || widths.small;
        return { w: w, h: w * 9 / 16 };
      }
      // artworks keep their own proportions inside a box about the size of a small tile
      var maxW = mobile ? 2.2 : 2.6;
      var maxH = mobile ? 1.35 : 2.3;
      var ratio = tile.item.width / tile.item.height;
      return ratio >= maxW / maxH ? { w: maxW, h: maxW / ratio } : { w: maxH * ratio, h: maxH };
    }

    function layout() {
      var W = window.innerWidth;
      var H = window.innerHeight;
      mobile = W < 960;
      P = (H / 2) / Math.tan(FOV / 2);
      U = P / DEPTH;
      stage.style.setProperty('--home-p', P.toFixed(2) + 'px');

      var rectW = (mobile ? 30 : 40) * Math.SQRT2 / 2;
      var rectH = mobile ? rectW / 2.5 : rectW / 2;
      var emptyW = mobile ? 4 : 7;          // the free zone behind the wordmark
      var emptyH = mobile ? 2.5 : 4;
      var cellW = (rectW - (COLS - 1) * GAP) / COLS;
      var cellH = (rectH - (ROWS - 1) * GAP) / ROWS;
      var fontPx = 0.1435 * U * (mobile ? 0.9 : 1);

      tiles.forEach(function (tile) {
        var rand = randomSource(tile.seed);
        var c = tile.cell;
        var x = -rectW / 2 + c.col * (cellW + GAP) + cellW / 2 + (rand() - 0.5) * cellW * 0.3;
        var y = -rectH / 2 + c.row * (cellH + GAP) + cellH / 2 + (rand() - 0.5);
        var tries = 0;
        while (Math.abs(x) <= emptyW / 2 && Math.abs(y) <= emptyH / 2 && tries++ < 400) {
          x = -rectW / 2 + c.col * cellW + rand() * cellW;
          y = -rectH / 2 + c.row * cellH + rand() * cellH;
        }
        tile.x = x;
        tile.y = y;

        var size = sizeOf(tile);
        var wPx = size.w * U;
        var hPx = size.h * U;

        // Look-at basis in scene space (y up): the tile's normal points at the focus point.
        var zx = -x;
        var zy = -y;
        var zz = DEPTH - FOCUS;
        var zl = Math.sqrt(zx * zx + zy * zy + zz * zz);
        zx /= zl; zy /= zl; zz /= zl;
        var xl = Math.sqrt(zz * zz + zx * zx);
        var xx = zz / xl;
        var xz = -zx / xl;                       // right = up x normal (its y part is zero)
        var yx = zy * xz;
        var yy = zz * xx - zx * xz;
        var yz = -zy * xx;                       // up = normal x right

        // Same basis as a CSS matrix (y points down on screen, hence the sign flips).
        var m = [xx, 0, xz, 0, -yx, yy, -yz, 0, zx, -zy, zz, 0, x * U, -y * U, -DEPTH * U, 1];
        tile.el.style.width = wPx.toFixed(2) + 'px';
        tile.el.style.fontSize = fontPx.toFixed(2) + 'px';
        tile.el.style.transform = 'matrix3d(' + m.map(function (n) { return +n.toFixed(5); }).join(',') + ') translate(' +
          (-wPx / 2).toFixed(2) + 'px,' + (-hPx / 2).toFixed(2) + 'px)';
        tile.mediaBox.style.height = hPx.toFixed(2) + 'px';
        tile.label.style.height = (LABEL_H * U).toFixed(2) + 'px';
        tile.label.style.paddingLeft = (0.05 * U).toFixed(2) + 'px';

        var maxChars = Math.floor(size.w / (CHAR_W * (mobile ? 0.9 : 1)));
        tile.label.textContent = tile.text.length > maxChars ? tile.text.substring(0, Math.max(1, maxChars - 3)) + '...' : tile.text;
      });

      apply();
    }

    /* --------------------------------------------------------- camera */
    var target = { x: 0, y: 0 };   // where the camera wants to look (radians: x = up/down, y = left/right)
    var rot = { x: 0, y: 0 };      // where it looks now
    var frame = 0;
    var last = 0;
    var running = true;

    function clamp(v, max) { return Math.max(-max, Math.min(max, v)); }

    function apply() {
      world.style.transform = 'translateZ(' + P.toFixed(2) + 'px) rotateY(' + (-rot.y).toFixed(5) + 'rad) rotateX(' + rot.x.toFixed(5) + 'rad)';
      loose.style.transform = 'translate3d(' + (DRIFT * rot.y * U).toFixed(2) + 'px,' + (-DRIFT * rot.x * U).toFixed(2) + 'px,0)';
    }

    function tick(now) {
      frame = 0;
      if (!running) return;
      var dt = last ? Math.min(64, now - last) : 16.667;
      last = now;
      var k = 1 - Math.pow(1 - EASE, dt / 16.667);
      rot.x += (target.x - rot.x) * k;
      rot.y += (target.y - rot.y) * k;
      if (Math.abs(target.x - rot.x) < 0.00005 && Math.abs(target.y - rot.y) < 0.00005) {
        rot.x = target.x;
        rot.y = target.y;
        apply();
        last = 0;
        return;                                  // settled: sleep until the next input
      }
      apply();
      frame = window.requestAnimationFrame(tick);
    }

    function wake() {
      if (!frame && running) frame = window.requestAnimationFrame(tick);
    }

    // nx / ny: pointer position from +0.5 (left / top edge) to -0.5 (right / bottom edge)
    function aim(nx, ny, byTouch) {
      if (Z.env.reducedMotion || Z.isMenuOpen()) return;
      var maxV = Math.PI * (byTouch ? 0.06 : 0.08);
      var maxH = Math.PI * (byTouch ? 0.23 : 0.13);
      target.x = clamp(ny * 2 * maxV, maxV);
      target.y = clamp(nx * 2 * maxH, maxH);
      wake();
    }

    // Keyboard users: turn the camera to the tile that receives focus.
    function lookAt(tile) {
      var maxV = Math.PI * 0.08;
      var maxH = Math.PI * (mobile ? 0.23 : 0.13);
      target.x = clamp(Math.atan2(tile.y, DEPTH), maxV);
      target.y = clamp(-Math.atan2(tile.x, DEPTH), maxH);
      if (Z.env.reducedMotion) { rot.x = target.x; rot.y = target.y; apply(); return; }
      wake();
    }

    window.addEventListener('mousemove', function (e) {
      aim(0.5 - e.clientX / window.innerWidth, 0.5 - e.clientY / window.innerHeight, false);
    }, { passive: true });

    function onTouch(e) {
      if (!e.touches || !e.touches.length) return;
      aim(0.5 - e.touches[0].clientX / window.innerWidth, 0.5 - e.touches[0].clientY / window.innerHeight, true);
    }
    window.addEventListener('touchstart', onTouch, { passive: true });
    window.addEventListener('touchmove', onTouch, { passive: true });

    var resizeTimer = 0;
    window.addEventListener('resize', function () {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(layout, 80);
    }, { passive: true });

    /* --------------------------------------------- play only what shows */
    function setPlaying(tile, on) {
      tile.visible = on;
      if (!tile.isFilm) return;
      if (on && running && !document.hidden) Z.play(tile.media);
      else Z.pause(tile.media);
    }

    if ('IntersectionObserver' in window) {
      var watcher = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          for (var i = 0; i < tiles.length; i++) {
            if (tiles[i].el === entry.target) { setPlaying(tiles[i], entry.isIntersecting); break; }
          }
        });
      }, { rootMargin: '15%' });
      tiles.forEach(function (tile) { watcher.observe(tile.el); });
    } else {
      tiles.forEach(function (tile) { setPlaying(tile, true); });
    }

    function pauseAll() { tiles.forEach(function (tile) { if (tile.isFilm) Z.pause(tile.media); }); }
    function resumeVisible() { tiles.forEach(function (tile) { if (tile.isFilm && tile.visible) Z.play(tile.media); }); }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) pauseAll(); else resumeVisible();
    });

    Z.onLeave(function () { running = false; pauseAll(); });
    window.addEventListener('zedi:restore', function () { running = true; resumeVisible(); wake(); });

    layout();
  });
})();
