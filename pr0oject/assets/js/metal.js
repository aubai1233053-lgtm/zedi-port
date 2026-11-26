/* ==========================================================================
   ZEDI — the wordmark as a solid piece of cast metal
   The metal is modelled and lit in Blender (tools/blender-logo.py) and rendered
   as a short turn: 9 views from 20 degrees left to 20 degrees right, once in
   dark graphite (day) and once in gunmetal with a blue edge light (night),
   in assets/img/logo3d/. This file shows those renders where the flat logo
   sits, and brings them to life: the logo turns towards the pointer (blending
   between neighbouring views, so the light really moves over the bevels),
   sways a little at rest, turns and changes metal when the look changes,
   gives a small press when clicked, and grows to the middle of the screen
   when the menu opens.

   Plain images drawn on a 2D canvas: it also runs from file://.
   If the images cannot load, the flat logo simply stays.
   ========================================================================== */
(function () {
  'use strict';

  var Z = window.Zedi;
  if (!Z || !window.HTMLCanvasElement) return;

  var DIR = 'assets/img/logo3d/';
  var VIEWS = 9;           // views per look, evenly from -YAW to +YAW (see tools/blender-logo.py)
  var YAW = 20;            // degrees
  var MARGIN = 0.06;       // empty border around the logo in each render, as a share of the logo's width
  var MIDDLE = (VIEWS - 1) / 2;
  var root = document.documentElement;

  function mix(a, b, t) { return a + (b - a) * t; }
  function clamp01(v) { return Math.max(0, Math.min(1, v)); }

  function start() {
    var env = Z.env;
    var holder = document.querySelector('.home-logo, .z-logo, .project-logo');
    var mainEl = document.getElementById('main');
    var canvas = document.createElement('canvas');
    canvas.className = 'z-metal';
    canvas.setAttribute('aria-hidden', 'true');
    var ctx = canvas.getContext('2d');
    if (!ctx) return;
    var blend = document.createElement('canvas');     // the views are blended here first, then laid on the page
    var bctx = blend.getContext('2d');

    // touch screens have no pointer to follow: the straight-on view is enough, and saves memory
    var wanted = env.touch || env.reducedMotion ? [MIDDLE] : null;
    function indices() {
      if (wanted) return wanted;
      var all = [];
      for (var i = 0; i < VIEWS; i++) all.push(i);
      return all;
    }

    /* ------------------------------------------------------------ images */
    var sets = { day: null, night: null };
    var loading = { day: null, night: null };

    function load(look) {
      if (loading[look]) return loading[look];
      loading[look] = new Promise(function (resolve, reject) {
        var list = [];
        var left = indices().length;
        indices().forEach(function (i) {
          var img = new Image();
          img.decoding = 'async';
          img.onload = function () {
            if (--left === 0) { sets[look] = list; resolve(list); }
          };
          img.onerror = function () { reject(new Error('missing ' + img.src)); };
          img.src = DIR + look + '-' + i + '.webp';
          list[i] = img;
        });
      });
      return loading[look];
    }

    /* ----------------------------------------------------------- state */
    var st = {
      menu: 0, menuSpeed: 0, menuTo: 0,
      rx: 0, ry: 0, rxTo: 0, ryTo: 0,
      night: env.night ? 1 : 0,
      spinFrom: -10,
      press: 0, pressSpeed: 0,
      shown: 0,
    };
    var ratio = 1;
    var frame = 0;
    var last = 0;
    var zero = window.performance.now();
    var signature = '';

    function calm() { return env.reducedMotion; }

    function size() {
      ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.round(window.innerWidth * ratio));
      canvas.height = Math.max(1, Math.round(window.innerHeight * ratio));
      signature = '';
    }

    // Where the wordmark is and how big: at its place in the page, or (menu open) in the
    // middle of the screen. "menu" runs from 0 to 1 and may overshoot a little, like a spring.
    function currentPose() {
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var mobile = vw < 960;
      var base = null;
      if (holder) {
        var box = holder.getBoundingClientRect();
        if (box.width > 2) {
          var alpha = parseFloat(window.getComputedStyle(holder).opacity);
          if (mainEl) alpha *= parseFloat(window.getComputedStyle(mainEl).opacity);
          base = { x: box.left + box.width / 2, y: box.top + box.height / 2, w: box.width, alpha: isFinite(alpha) ? alpha : 1 };
        }
      }
      var navHeight = mobile ? (parseFloat(root.style.getPropertyValue('--z-nav-h')) || 300) : 72;
      var stage = {
        x: vw / 2,
        y: (vh - navHeight - 22) / 2,
        w: mobile ? vw * 0.92 : Math.min(vw * 0.64, vh * 1.45),
        alpha: 1,
      };
      if (!base) base = { x: stage.x, y: stage.y + 46, w: stage.w * 0.7, alpha: 0 };
      var m = st.menu;
      return {
        x: mix(base.x, stage.x, m),
        y: mix(base.y, stage.y, m),
        w: mix(base.w, Math.max(stage.w, base.w * 1.04), m),
        alpha: clamp01(mix(base.alpha, 1, clamp01(m * 1.6))),
      };
    }

    /* ------------------------------------------------------------ draw */
    // which view to show, as a fractional index: pointer, a slow sway, and the turn on a look change
    function viewAt(time) {
      if (wanted) return MIDDLE;
      var deg = st.ry * 40;
      if (!calm()) deg += 2.2 * Math.sin(time * 0.45);
      var since = time - st.spinFrom;
      if (since >= 0 && since < 1.1) deg += Math.sin((since / 1.1) * Math.PI * 2) * YAW * 0.9 * (1 - since / 1.1);
      return Math.max(0, Math.min(VIEWS - 1, (deg + YAW) / (2 * YAW) * (VIEWS - 1)));
    }

    function draw(time, alpha, pose) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (alpha <= 0.002) return;
      var night = st.night;
      var looks = [];
      if (night < 0.999 && sets.day) looks.push(['day', 1 - night]);
      if (night > 0.001 && sets.night) looks.push(['night', night]);
      if (!looks.length) looks.push([sets.night ? 'night' : 'day', 1]);
      var first = sets[looks[0][0]];
      if (!first) return;

      var v = viewAt(time);
      var lo = Math.floor(v);
      var hi = Math.min(VIEWS - 1, lo + 1);
      var f = v - lo;
      if (wanted) { lo = hi = MIDDLE; f = 0; }

      var sample = first[lo] || first[MIDDLE];
      var iw = sample.naturalWidth;
      var ih = sample.naturalHeight;
      var drawW = pose.w * (1 + 2 * MARGIN) * ratio;
      var drawH = drawW * ih / iw;
      // the blend canvas only needs the on-screen size (never more than the render itself)
      var bw = Math.max(1, Math.min(iw, Math.round(drawW)));
      var bh = Math.max(1, Math.round(bw * ih / iw));
      if (blend.width !== bw || blend.height !== bh) { blend.width = bw; blend.height = bh; }
      bctx.globalCompositeOperation = 'source-over';
      bctx.globalAlpha = 1;
      bctx.clearRect(0, 0, bw, bh);
      // the views are added together with their weights, so in-between turns and the change of
      // metal blend smoothly instead of flickering
      bctx.globalCompositeOperation = 'lighter';
      looks.forEach(function (entry) {
        var set = sets[entry[0]];
        var a = set[lo] || set[MIDDLE];
        var b = set[hi] || set[MIDDLE];
        bctx.globalAlpha = entry[1] * (1 - f);
        bctx.drawImage(a, 0, 0, bw, bh);
        if (f > 0.001) {
          bctx.globalAlpha = entry[1] * f;
          bctx.drawImage(b, 0, 0, bw, bh);
        }
      });

      // lean towards the pointer, press when clicked
      var squash = 1 - 0.035 * st.press;
      var tiltY = Math.cos(st.rx * 0.9);
      var unit = pose.w * ratio;
      ctx.translate(pose.x * ratio, pose.y * ratio);
      ctx.transform(squash, 0, -st.rx * 0.12, squash * tiltY, 0, 0);
      ctx.globalAlpha = alpha;
      // soft shadow on the light page, blue glow on the black one
      if ('filter' in ctx) {
        var shadow = 'drop-shadow(' + (unit * 0.008).toFixed(1) + 'px ' + (unit * 0.016).toFixed(1) + 'px ' +
          (unit * 0.016).toFixed(1) + 'px rgba(0,0,0,' + (0.3 * (1 - night)).toFixed(3) + '))';
        var glow = 'drop-shadow(0 0 ' + (unit * 0.03).toFixed(1) + 'px rgba(25,67,255,' + (0.6 * night).toFixed(3) + '))';
        ctx.filter = shadow + ' ' + glow;
      }
      ctx.drawImage(blend, -drawW / 2, -drawH / 2, drawW, drawH);
      if ('filter' in ctx) ctx.filter = 'none';
      ctx.globalAlpha = 1;
    }

    /* ---------------------------------------------------------- motion */
    function tick(now) {
      frame = 0;
      if (document.hidden) return;
      var dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
      last = now;
      var time = (now - zero) / 1000;
      var nightTo = env.night ? 1 : 0;
      var ready = !!sets[nightTo ? 'night' : 'day'];     // only change metal once its images are in

      if (calm()) {
        st.menu = st.menuTo; st.menuSpeed = 0; st.rx = 0; st.ry = 0; st.press = 0;
        if (ready) st.night = nightTo;
      } else {
        // a slightly springy move for the menu and the press, soft follow for everything else
        st.menuSpeed += ((st.menuTo - st.menu) * 150 - st.menuSpeed * 17) * dt;
        st.menu += st.menuSpeed * dt;
        st.pressSpeed += (-st.press * 260 - st.pressSpeed * 16) * dt;
        st.press += st.pressSpeed * dt;
        var follow = 1 - Math.pow(1 - 0.09, dt * 60);
        st.rx += (st.rxTo - st.rx) * follow;
        st.ry += (st.ryTo - st.ry) * follow;
        if (ready) st.night += (nightTo - st.night) * (1 - Math.pow(1 - 0.07, dt * 60));
      }
      st.shown = Math.min(1, st.shown + dt / 0.5);

      var pose = currentPose();
      var alpha = pose.alpha * st.shown;
      if (calm()) {
        // nothing moves by itself: draw again only when something actually changed
        var now2 = [pose.x, pose.y, pose.w, alpha.toFixed(3), st.night, canvas.width].join('|');
        if (now2 !== signature) { signature = now2; draw(0, alpha, pose); }
      } else {
        draw(time, alpha, pose);
      }
      frame = window.requestAnimationFrame(tick);
    }

    function wake() {
      if (!frame && !document.hidden) {
        last = 0;
        frame = window.requestAnimationFrame(tick);
      }
    }

    /* ---------------------------------------------------------- events */
    function onLogo(x, y) {
      var pose = currentPose();
      return Math.abs(x - pose.x) < pose.w / 2 && Math.abs(y - pose.y) < pose.w * 0.22;
    }

    window.addEventListener('mousemove', function (e) {
      st.ryTo = (e.clientX / window.innerWidth - 0.5) * 1.0;
      st.rxTo = (e.clientY / window.innerHeight - 0.5) * 0.7;
    }, { passive: true });

    window.addEventListener('pointerdown', function (e) {
      if (!calm() && onLogo(e.clientX, e.clientY)) st.pressSpeed += 9;
    }, { passive: true });

    window.addEventListener('zedi:menu', function (e) {
      st.menuTo = e.detail && e.detail.open ? 1 : 0;
    });

    window.addEventListener('zedi:theme', function () {
      load(env.night ? 'night' : 'day').then(function () {
        if (!calm()) st.spinFrom = (window.performance.now() - zero) / 1000;
        wake();
      }, function () {});
    });

    window.addEventListener('resize', size, { passive: true });
    document.addEventListener('visibilitychange', wake);
    window.addEventListener('zedi:restore', wake);

    /* ------------------------------------------------------------ go */
    var look = env.night ? 'night' : 'day';
    load(look).then(function () {
      size();
      document.body.appendChild(canvas);
      if (holder) {
        holder.classList.add('is-metal');
        Z.untilt(holder);
      }
      wake();
      // the other metal comes in quietly, ready for the hold-to-switch
      var other = look === 'day' ? 'night' : 'day';
      var later = function () { load(other).catch(function () {}); };
      if ('requestIdleCallback' in window) window.requestIdleCallback(later, { timeout: 3000 });
      else window.setTimeout(later, 1500);
    }, function (err) {
      // the flat logo stays; add ?debug to the address to see why
      if (/[?&]debug\b/.test(window.location.search) && window.console) console.error(err);
    });
  }

  Z.ready(function () {
    try { start(); } catch (e) {
      if (/[?&]debug\b/.test(window.location.search) && window.console) console.error(e);
    }
  });
})();
