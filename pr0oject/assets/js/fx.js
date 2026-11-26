/* ==========================================================================
   ZEDI — the playful layer
   • press and hold on empty space: a ring fills at the pointer, then the
     look flips between day and night
   • cursor extras: a word inside the cursor over films and artworks, a short
     trail of the accent colour, a menu button that leans towards the pointer
   • text that "decodes" itself, content that rises in while scrolling,
     artworks that lean towards the pointer, a little film grain
   All of it is decoration. Nothing here is needed to use the site, and the
   moving parts are skipped for visitors who ask for reduced motion.
   ========================================================================== */
(function () {
  'use strict';

  var Z = window.Zedi;
  if (!Z) return;

  var h = Z.h;
  var root = document.documentElement;
  var body = document.body;
  var fine = Z.env.finePointer;

  function calm() { return Z.env.reducedMotion; }

  /* ------------------------------------------------------ decoding text */
  // Letters flick through random signs and settle from left to right. Every sign
  // of the typeface has the same width, so nothing moves while this runs.
  var SIGNS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789/<>[]{}=+*#_';
  var decoding = new WeakMap();

  function scramble(el, options) {
    if (!el || calm() || el.childElementCount) return;
    var running = decoding.get(el);
    var text = running ? running.text : el.textContent;
    if (!text || !text.trim()) return;
    if (running) window.cancelAnimationFrame(running.frame);

    var o = options || {};
    var duration = o.duration || Math.min(900, 280 + text.length * 16);
    var start = window.performance.now() + (o.delay || 0);
    var state = { text: text, frame: 0 };
    var lastSwap = 0;
    decoding.set(el, state);
    el.setAttribute('aria-label', text);          // what assistive tech hears stays the real text

    function step(now) {
      var progress = Math.max(0, Math.min(1, (now - start) / duration));
      if (now - lastSwap > 45 || progress === 1) {
        lastSwap = now;
        var settled = Math.floor(progress * text.length);
        var out = '';
        for (var i = 0; i < text.length; i++) {
          var c = text.charAt(i);
          out += i < settled || /\s/.test(c) ? c : SIGNS.charAt(Math.floor(Math.random() * SIGNS.length));
        }
        el.textContent = out;
      }
      if (progress < 1) state.frame = window.requestAnimationFrame(step);
      else {
        el.textContent = text;
        el.removeAttribute('aria-label');
        decoding.delete(el);
      }
    }
    state.frame = window.requestAnimationFrame(step);
  }

  /* --------------------------------------------- content that rises in */
  function whenSeen(elements, callback) {
    if (!('IntersectionObserver' in window)) { elements.forEach(callback); return; }
    var watcher = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        watcher.unobserve(entry.target);
        callback(entry.target);
      });
    });
    elements.forEach(function (el) { watcher.observe(el); });
  }

  function dress() {
    if (calm()) return;
    var all = function (selector) { return Array.prototype.slice.call(document.querySelectorAll(selector)); };

    // headings decode once when they come into view
    whenSeen(all('.z-title, .z-band, .about-heading, .about-intro__text, .project-bar__client, .project-bar__title'), function (el) {
      scramble(el, { delay: 250 });
    });

    // rows, artworks and blocks rise in, one after the other inside their group
    var risers = all('.work-list > li, .art-item, .about-more, .about-block, .contact-block, .project-credit');
    risers.forEach(function (el) {
      var index = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.setProperty('--i', Math.min(index, 12));
      el.classList.add('fx-rise');
    });
    whenSeen(risers, function (el) { el.classList.add('is-in'); });
  }

  /* ------------------------------------------------------------- grain */
  function grain() {
    try {
      var size = 160;
      var canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      var ctx = canvas.getContext('2d');
      var image = ctx.createImageData(size, size);
      for (var i = 0; i < image.data.length; i += 4) {
        var v = Math.random() < 0.5 ? 0 : 255;
        image.data[i] = image.data[i + 1] = image.data[i + 2] = v;
        image.data[i + 3] = Math.floor(Math.random() * 255);
      }
      ctx.putImageData(image, 0, 0);
      var el = h('div', { class: 'z-grain', 'aria-hidden': 'true' });
      el.style.backgroundImage = 'url(' + canvas.toDataURL('image/png') + ')';
      body.appendChild(el);
    } catch (e) { /* no grain, no harm */ }
  }

  /* ------------------------------------------------------ pointer extras */
  function accentColour() {
    return window.getComputedStyle(root).getPropertyValue('--accent').trim() || '#d4f70a';
  }

  // a word inside the cursor over anything that carries data-cursor-label
  function cursorLabel() {
    var label = h('div', { class: 'z-cursorlabel', 'aria-hidden': 'true' }, h('span'));
    var host = null;
    body.appendChild(label);

    function show(next) {
      if (next === host) return;
      host = next;
      if (host) {
        label.firstChild.textContent = host.getAttribute('data-cursor-label');
        label.classList.add('is-on');
        Z.cursor.hide();
      } else {
        label.classList.remove('is-on');
        Z.cursor.show();
      }
    }

    document.addEventListener('mouseover', function (e) {
      show(e.target && e.target.closest ? e.target.closest('[data-cursor-label]') : null);
    }, { passive: true });
    document.addEventListener('mousemove', function (e) {
      label.style.transform = 'translate3d(' + e.clientX + 'px,' + e.clientY + 'px,0)';
    }, { passive: true });
    // whatever was under the pointer may be covered or gone after a click
    document.addEventListener('click', function () { show(null); }, true);
    root.addEventListener('mouseleave', function () { show(null); });
  }

  // a short ribbon of the accent colour that follows the pointer and thins out
  function trail() {
    var LIFE = 260;
    var canvas = h('canvas', { class: 'z-trail', 'aria-hidden': 'true' });
    var ctx = canvas.getContext('2d');
    var points = [];
    var frame = 0;
    var scale = 1;
    var colour = accentColour();
    var live = false;

    function size() {
      scale = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(window.innerWidth * scale);
      canvas.height = Math.round(window.innerHeight * scale);
    }

    function draw(now) {
      frame = 0;
      while (points.length && now - points[0].t > LIFE) points.shift();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (!points.length) {
        live = false;
        canvas.style.display = 'none';
        return;
      }
      ctx.lineCap = 'round';
      ctx.strokeStyle = colour;
      for (var i = 1; i < points.length; i++) {
        var a = points[i - 1];
        var b = points[i];
        var fresh = 1 - (now - b.t) / LIFE;             // 1 at the pointer, 0 at the tail
        ctx.lineWidth = Math.max(0.5, 12 * fresh * fresh) * scale;
        ctx.beginPath();
        ctx.moveTo(a.x * scale, a.y * scale);
        ctx.lineTo(b.x * scale, b.y * scale);
        ctx.stroke();
      }
      frame = window.requestAnimationFrame(draw);
    }

    document.addEventListener('mousemove', function (e) {
      if (calm() || document.hidden) return;
      points.push({ x: e.clientX, y: e.clientY, t: window.performance.now() });
      if (points.length > 90) points.shift();
      if (!live) {
        live = true;
        canvas.style.display = 'block';
      }
      if (!frame) frame = window.requestAnimationFrame(draw);
    }, { passive: true });

    window.addEventListener('resize', size, { passive: true });
    window.addEventListener('zedi:theme', function () { colour = accentColour(); });
    size();
    body.appendChild(canvas);
  }

  // the round menu button leans towards the pointer when it comes close
  function magnet() {
    var nav = document.querySelector('.z-nav');
    if (!nav) return;
    var REACH = 120;
    document.addEventListener('mousemove', function (e) {
      var dx = e.clientX - window.innerWidth / 2;
      var dy = e.clientY - (window.innerHeight - 46.5);       // centre of the closed button
      var distance = Math.hypot(dx, dy);
      var pull = calm() || Z.isMenuOpen() || distance > REACH ? 0 : 1 - distance / REACH;
      nav.style.setProperty('--mag-x', (dx * 0.4 * pull).toFixed(1) + 'px');
      nav.style.setProperty('--mag-y', (dy * 0.4 * pull).toFixed(1) + 'px');
    }, { passive: true });
  }

  // anything with data-tilt leans towards the pointer while it is hovered
  function tilts() {
    var current = null;
    function release() {
      if (!current) return;
      current.classList.remove('is-tilting');
      current.style.removeProperty('--tx');
      current.style.removeProperty('--ty');
      current = null;
    }
    document.addEventListener('mousemove', function (e) {
      var el = !calm() && e.target && e.target.closest ? e.target.closest('[data-tilt]') : null;
      if (el !== current) release();
      if (!el) return;
      current = el;
      var box = el.getBoundingClientRect();
      el.classList.add('is-tilting');
      el.style.setProperty('--tx', (((e.clientX - box.left) / box.width) * 2 - 1).toFixed(3));
      el.style.setProperty('--ty', (((e.clientY - box.top) / box.height) * 2 - 1).toFixed(3));
    }, { passive: true });
    root.addEventListener('mouseleave', release);
  }

  /* ------------------------------------------- press and hold: day / night */
  var HOLD_DELAY = 140;        // a normal click is over before anything shows
  var HOLD_FILL = 720;         // then the ring takes this long to close
  var NOT_EMPTY = 'a, button, input, textarea, select, label, summary, img, video, canvas, [role], [contenteditable], .z-nav, [data-no-hold]';

  // true when the point is on top of a line of text (pressing there usually starts a selection)
  function overText(x, y) {
    var node = null;
    try {
      if (document.caretPositionFromPoint) {
        var position = document.caretPositionFromPoint(x, y);
        node = position && position.offsetNode;
      } else if (document.caretRangeFromPoint) {
        var caret = document.caretRangeFromPoint(x, y);
        node = caret && caret.startContainer;
      }
      if (!node || node.nodeType !== 3 || !/\S/.test(node.nodeValue)) return false;
      var range = document.createRange();
      range.selectNodeContents(node);
      var boxes = range.getClientRects();
      for (var i = 0; i < boxes.length; i++) {
        var b = boxes[i];
        if (x >= b.left - 3 && x <= b.right + 3 && y >= b.top - 3 && y <= b.bottom + 3) return true;
      }
    } catch (e) { /* treat as empty space */ }
    return false;
  }

  function isEmptySpace(target, x, y) {
    if (!target || !target.closest || target.closest(NOT_EMPTY)) return false;
    return !overText(x, y);
  }

  function hold() {
    var ring = h('div', { class: 'z-hold', 'aria-hidden': 'true' });
    // fixed markup of our own, no content involved
    ring.innerHTML = '<svg viewBox="0 0 48 48"><circle class="z-hold__track" cx="24" cy="24" r="20"/><circle class="z-hold__fill" cx="24" cy="24" r="20"/></svg>';
    ring.style.setProperty('--hold-ms', HOLD_FILL + 'ms');
    body.appendChild(ring);

    var cursorDot = document.querySelector('.z-cursor');
    var press = null;            // { id, x, y, touch, showTimer, doneTimer }
    var swallowClick = false;

    function place(x, y, touch) {
      // on a touch screen the ring sits above the finger, where it can be seen
      ring.style.transform = 'translate3d(' + x + 'px,' + (touch ? Math.max(40, y - 70) : y) + 'px,0)';
    }

    function clear() {
      if (!press) return;
      window.clearTimeout(press.showTimer);
      window.clearTimeout(press.doneTimer);
      press = null;
      root.classList.remove('is-holding');
      ring.classList.remove('is-on');
      if (cursorDot) cursorDot.classList.remove('is-holding');
    }

    function complete() {
      var at = { x: press.x, y: press.y };
      var touch = press.touch;
      clear();
      swallowClick = true;
      ring.classList.add('is-done');
      window.setTimeout(function () { ring.classList.remove('is-done'); }, 500);
      if (touch && navigator.vibrate) { try { navigator.vibrate(12); } catch (e) { /* optional */ } }
      retireHint();
      Z.theme.toggle(at);
    }

    document.addEventListener('pointerdown', function (e) {
      swallowClick = false;
      if (press || e.button !== 0 || e.isPrimary === false) return;
      if (!isEmptySpace(e.target, e.clientX, e.clientY)) return;
      var touch = e.pointerType === 'touch' || e.pointerType === 'pen';
      press = { id: e.pointerId, x: e.clientX, y: e.clientY, touch: touch, showTimer: 0, doneTimer: 0 };
      root.classList.add('is-holding');
      place(e.clientX, e.clientY, touch);
      press.showTimer = window.setTimeout(function () {
        ring.classList.remove('is-done');
        ring.classList.add('is-on');
        if (cursorDot) cursorDot.classList.add('is-holding');
      }, HOLD_DELAY);
      press.doneTimer = window.setTimeout(complete, HOLD_DELAY + HOLD_FILL);
    }, { passive: true });

    document.addEventListener('pointermove', function (e) {
      if (!press || e.pointerId !== press.id) return;
      // a small wobble is fine; a real move means dragging or scrolling, not holding
      if (Math.hypot(e.clientX - press.x, e.clientY - press.y) > (press.touch ? 10 : 22)) { clear(); return; }
      if (!press.touch) place(e.clientX, e.clientY, false);
    }, { passive: true });

    ['pointerup', 'pointercancel'].forEach(function (type) {
      document.addEventListener(type, function (e) { if (press && e.pointerId === press.id) clear(); }, { passive: true });
    });
    window.addEventListener('blur', clear);
    window.addEventListener('scroll', clear, { passive: true });
    document.addEventListener('contextmenu', clear);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') clear(); });
    Z.onLeave(clear);

    // letting go after a finished hold must not also count as a click on what is underneath
    document.addEventListener('click', function (e) {
      if (!swallowClick) return;
      swallowClick = false;
      e.stopPropagation();
      e.preventDefault();
    }, true);
  }

  /* ------------------------------------------------- the one-time hint */
  var hintEl = null;
  var HINT_KEY = 'zedi-hold-known';

  function retireHint() {
    try { window.localStorage.setItem(HINT_KEY, '1'); } catch (e) { /* it may show again; fine */ }
    if (hintEl) hintEl.classList.remove('is-on');
  }

  function hint() {
    var known = false;
    try { known = window.localStorage.getItem(HINT_KEY) === '1'; } catch (e) { known = false; }
    if (known || Z.page === 'project') return;
    hintEl = h('p', { class: 'z-hint' }, h('i'), fine ? 'Hold anywhere to change the light' : 'Touch and hold to change the light');
    body.appendChild(hintEl);
    window.setTimeout(function () { hintEl.classList.add('is-on'); }, 2600);
    window.setTimeout(function () { hintEl.classList.remove('is-on'); }, 9500);
    // seen twice is enough
    try {
      var times = (parseInt(window.sessionStorage.getItem('zedi-hint-times'), 10) || 0) + 1;
      window.sessionStorage.setItem('zedi-hint-times', String(times));
      if (times >= 2) window.localStorage.setItem(HINT_KEY, '1');
    } catch (e) { /* fine */ }
  }

  /* --------------------------------------------------------------- menu */
  // the links decode one after the other as the menu opens
  window.addEventListener('zedi:menu', function (e) {
    if (!e.detail || !e.detail.open) return;
    Array.prototype.forEach.call(document.querySelectorAll('.z-nav__list a'), function (a, i) {
      scramble(a, { delay: 380 + i * 60, duration: 420 });
    });
  });

  /* -------------------------------------------------------------- mount */
  Z.fx = { scramble: scramble };

  hold();
  grain();
  if (fine) {
    cursorLabel();
    trail();
    magnet();
    tilts();
  }

  // page scripts run after this file; wait until they have built their content
  var dressed = false;
  function dressOnce() {
    if (dressed) return;
    dressed = true;
    dress();
    hint();
  }
  if (document.readyState === 'complete') dressOnce();
  else {
    document.addEventListener('DOMContentLoaded', dressOnce);
    window.addEventListener('load', dressOnce);
  }
})();
