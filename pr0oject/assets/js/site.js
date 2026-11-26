/* ==========================================================================
   ZEDI — shared behaviour for every page
   Mounts the menu button, the round cursor, the page fade, the small logo
   and the footer strip, and exposes helpers to the page scripts as
   window.Zedi. Content comes from content.js (window.ZEDI_CONTENT).
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var body = document.body;
  var boot = window.ZEDI_BOOT || {};
  var page = (body && body.getAttribute('data-page')) || '';

  /* ---------------------------------------------------------------- env */
  function mq(query) {
    return window.matchMedia ? window.matchMedia(query) : { matches: false };
  }

  var env = {
    night: root.classList.contains('is-night'),
    finePointer: mq('(hover: hover) and (pointer: fine)').matches,
    touch: !mq('(hover: hover) and (pointer: fine)').matches,
    file: window.location.protocol === 'file:',
    get reducedMotion() { return mq('(prefers-reduced-motion: reduce)').matches; },
    get desktop() { return window.innerWidth >= 960; },
  };

  /* -------------------------------------------------------- DOM helpers */
  // h('a', { class: 'x', href: url, dataset: { id: 1 }, on: { click: fn } }, 'text', node, [more])
  // Strings always become text nodes, so content can never inject markup.
  function h(tag, attrs) {
    var el = document.createElement(tag);
    var key;
    if (attrs) {
      for (key in attrs) {
        if (!Object.prototype.hasOwnProperty.call(attrs, key)) continue;
        var value = attrs[key];
        if (value === null || value === undefined || value === false) continue;
        if (key === 'class') el.className = value;
        else if (key === 'text') el.textContent = value;
        else if (key === 'dataset') assign(el.dataset, value);
        else if (key === 'style' && typeof value === 'object') assign(el.style, value);
        else if (key === 'on') {
          for (var type in value) {
            if (Object.prototype.hasOwnProperty.call(value, type)) el.addEventListener(type, value[type]);
          }
        } else if (value === true) el.setAttribute(key, '');
        else el.setAttribute(key, String(value));
      }
    }
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }

  function append(parent, kid) {
    if (kid === null || kid === undefined || kid === false) return;
    if (Array.isArray(kid)) { kid.forEach(function (k) { append(parent, k); }); return; }
    parent.appendChild(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }

  function assign(target, source) {
    for (var k in source) {
      if (Object.prototype.hasOwnProperty.call(source, k)) target[k] = source[k];
    }
    return target;
  }

  // Tiny line icons, drawn on a 25 x 25 grid in the current colour.
  var ICONS = {
    close: [['path', { d: 'M6.5 18.5 18.5 6.5M18.5 18.5 6.5 6.5', stroke: 1 }]],
    play: [['path', { d: 'M9.3 6.4 18.6 12a.6.6 0 0 1 0 1L9.3 18.6a.6.6 0 0 1-.9-.5V6.9a.6.6 0 0 1 .9-.5Z', fill: 1 }]],
    pause: [['rect', { x: 7.5, y: 4.5, width: 3, height: 16, rx: 1, fill: 1 }], ['rect', { x: 14.5, y: 4.5, width: 3, height: 16, rx: 1, fill: 1 }]],
    scrub: [['path', { d: 'M9.5 8.5 5.5 12.5l4 4M15.5 8.5l4 4-4 4', stroke: 1 }]],
    prev: [['path', { d: 'M14.5 6.5 8.5 12.5l6 6', stroke: 1 }]],
    next: [['path', { d: 'M10.5 6.5l6 6-6 6', stroke: 1 }]],
    light: [['circle', { cx: 12.5, cy: 12.5, r: 7, stroke: 1 }], ['path', { d: 'M12.5 5.5a7 7 0 0 1 0 14Z', fill: 1 }]],
    down: [['path', { d: 'M8.5 10.5l4 4 4-4', stroke: 1 }]],
    expand: [['path', { d: 'M6.5 10.5v-4h4M14.5 6.5h4v4M18.5 14.5v4h-4M10.5 18.5h-4v-4', stroke: 1 }]],
  };

  function icon(name, size) {
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    var px = size || 25;
    svg.setAttribute('viewBox', '0 0 25 25');
    svg.setAttribute('width', px);
    svg.setAttribute('height', px);
    svg.setAttribute('fill', 'none');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    svg.setAttribute('class', 'z-icon z-icon--' + name);
    (ICONS[name] || []).forEach(function (shape) {
      var node = document.createElementNS(NS, shape[0]);
      var a = shape[1];
      for (var k in a) {
        if (k === 'stroke') {
          node.setAttribute('stroke', 'currentColor');
          node.setAttribute('stroke-width', '2');
          node.setAttribute('stroke-linecap', 'round');
          node.setAttribute('stroke-linejoin', 'round');
        } else if (k === 'fill') node.setAttribute('fill', 'currentColor');
        else node.setAttribute(k, a[k]);
      }
      svg.appendChild(node);
    });
    return svg;
  }

  // A fresh inline copy of the wordmark (so it can take any text colour).
  function logo() {
    if (typeof window.ZEDI_LOGO === 'string' && window.ZEDI_LOGO.indexOf('<svg') !== -1) {
      var holder = document.createElement('template');
      holder.innerHTML = window.ZEDI_LOGO;        // our own static file, not user content
      var svg = holder.content.querySelector('svg');
      if (svg) return svg;
    }
    return h('span', { class: 'z-logo__text' }, content.site.name);
  }

  /* ------------------------------------------------------------ content */
  function str(v) { return v === null || v === undefined ? '' : String(v).trim(); }

  function list(v) {
    if (Array.isArray(v)) return v;
    return v === null || v === undefined || v === '' ? [] : [v];
  }

  function normalise(raw) {
    var c = raw && typeof raw === 'object' ? raw : {};
    var site = assign({ name: 'Zedi', role: '', description: '', email: '' }, c.site || {});
    var seen = {};

    function unique(slug, kind) {
      if (!slug) return false;
      if (seen[slug]) {
        if (window.console) console.warn('[content] Two entries share the slug "' + slug + '"; the second ' + kind + ' is ignored.');
        return false;
      }
      seen[slug] = true;
      return true;
    }

    var projects = list(c.projects).filter(function (p) {
      return p && typeof p === 'object' && str(p.title) && unique(str(p.slug), 'project');
    }).map(function (p) {
      return {
        kind: 'project',
        slug: str(p.slug),
        client: str(p.client),
        title: str(p.title),
        category: str(p.category),
        roles: list(p.roles).map(str).filter(Boolean),
        year: str(p.year),
        preview: str(p.preview) || str(p.video),
        video: str(p.video) || str(p.preview),
        poster: str(p.poster),
        size: p.size === 'medium' || p.size === 'big' ? p.size : 'small',
        home: p.home === true,
        credits: list(p.credits).filter(function (x) { return x && str(x.role) && str(x.name); }).map(function (x) {
          return { role: str(x.role), name: str(x.name), url: str(x.url) };
        }),
      };
    });

    var art = list(c.art).filter(function (a) {
      return a && typeof a === 'object' && str(a.title) && str(a.image) && unique(str(a.slug), 'artwork');
    }).map(function (a) {
      var w = parseFloat(a.width) > 0 ? parseFloat(a.width) : 4;
      var ht = parseFloat(a.height) > 0 ? parseFloat(a.height) : 5;
      return {
        kind: 'art',
        slug: str(a.slug),
        title: str(a.title),
        year: str(a.year),
        medium: str(a.medium),
        dimensions: str(a.dimensions),
        image: str(a.image),
        thumb: str(a.thumb) || str(a.image),
        width: w,
        height: ht,
        size: a.size === 'big' || a.size === 'small' ? a.size : 'medium',
        status: str(a.status),
        home: a.home === true,
      };
    });

    var nav = list(c.nav).filter(function (n) { return n && str(n.label) && str(n.href); }).map(function (n) {
      return { label: str(n.label), href: str(n.href) };
    });

    var about = assign({ intro: '', portrait: '', name: site.name, role: site.role, bio: [], blocks: [], press: [] }, c.about || {});
    about.bio = list(about.bio).map(str).filter(Boolean);
    about.blocks = list(about.blocks).filter(function (b) { return b && str(b.title); }).map(function (b) {
      return { title: str(b.title), items: list(b.items).map(str).filter(Boolean) };
    });
    about.press = list(about.press).filter(function (p) { return p && str(p.title); }).map(function (p) {
      return { title: str(p.title), source: str(p.source), url: str(p.url) };
    });

    var contact = list(c.contact).filter(function (b) { return b && str(b.title); }).map(function (b) {
      return {
        title: str(b.title),
        note: str(b.note),
        rows: list(b.rows).filter(function (r) { return r && str(r.value); }).map(function (r) {
          return { label: str(r.label), value: str(r.value), type: str(r.type) || 'text', href: str(r.href) };
        }),
      };
    });

    return {
      site: site,
      theme: c.theme || {},
      nav: nav,
      home: assign({ tiles: 'auto' }, c.home || {}),
      projects: projects,
      art: art,
      about: about,
      contact: contact,
    };
  }

  var content = normalise(window.ZEDI_CONTENT);

  function find(items, slug) {
    for (var i = 0; i < items.length; i++) if (items[i].slug === slug) return items[i];
    return null;
  }

  function uniqueValues(getter) {
    var out = [];
    content.projects.forEach(function (p) {
      list(getter(p)).forEach(function (v) { if (v && out.indexOf(v) === -1) out.push(v); });
    });
    return out;
  }

  // "00.07" style, as on the reference player
  function formatTime(seconds) {
    var s = isFinite(seconds) && seconds > 0 ? seconds : 0;
    var m = Math.floor(s / 60);
    var r = Math.floor(s % 60);
    return (m < 10 ? '0' : '') + m + '.' + (r < 10 ? '0' : '') + r;
  }

  /* ---------------------------------------------------------- lifecycle */
  var readyQueue = [];
  var mounted = false;
  var leaveHandlers = [];
  var leaving = false;

  function ready(fn) {
    if (mounted) fn();
    else readyQueue.push(fn);
  }

  function onLeave(fn) { leaveHandlers.push(fn); }

  function runLeave() {
    leaveHandlers.forEach(function (fn) { try { fn(); } catch (e) { /* keep leaving */ } });
  }

  // Leave the page: a drop of the accent colour spreads from where the visitor clicked
  // and covers the screen; the next page lets it shrink back (see boot.js and fx.css).
  // Falls back to a plain jump when motion is reduced.
  function navigate(url, origin) {
    if (leaving) return;
    leaving = true;
    setMenu(false);
    rememberPointer();
    runLeave();
    root.classList.add('is-leaving');
    if (!env.reducedMotion) spreadInk(origin);
    window.setTimeout(function () { window.location.href = url; }, env.reducedMotion ? 0 : 520);
  }

  function spreadInk(origin) {
    var from = origin || lastPointer || { x: window.innerWidth / 2, y: window.innerHeight - 46 };
    var x = Math.round(from.x);
    var y = Math.round(from.y);
    var reach = Math.ceil(Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))) + 4;
    var ink = h('div', { class: 'z-ink', 'aria-hidden': 'true' });
    ink.style.setProperty('--ink-x', x + 'px');
    ink.style.setProperty('--ink-y', y + 'px');
    ink.style.setProperty('--ink-r', reach + 'px');
    body.appendChild(ink);
    void ink.offsetWidth;                       // make sure the starting size is painted first
    ink.classList.add('is-on');
    try { window.sessionStorage.setItem('zedi-ink', [Date.now(), x, y].join(',')); } catch (e) { /* the next page simply fades in */ }
  }

  function centreOf(el) {
    var b = el.getBoundingClientRect();
    return { x: b.left + b.width / 2, y: b.top + b.height / 2 };
  }

  function interceptLinks() {
    document.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      if ((a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      var href = a.getAttribute('href');
      if (!href || href.charAt(0) === '#') return;
      var url;
      try { url = new URL(a.href, window.location.href); } catch (err) { return; }
      if (url.protocol !== window.location.protocol || url.host !== window.location.host) return; // mailto:, tel:, other sites
      if (url.pathname === window.location.pathname && url.search === window.location.search) return; // same page (hash only)
      e.preventDefault();
      // a click made with the keyboard has no position: start from the link itself
      navigate(url.href, e.clientX || e.clientY ? { x: e.clientX, y: e.clientY } : centreOf(a));
    });

    // Coming back with the browser's Back button can restore the faded-out page as it was.
    window.addEventListener('pageshow', function (e) {
      if (!e.persisted) return;
      leaving = false;
      root.classList.remove('is-leaving');
      root.classList.remove('is-arriving');
      Array.prototype.forEach.call(document.querySelectorAll('.z-ink'), function (el) { el.remove(); });
      root.classList.add('is-ready');
      window.dispatchEvent(new CustomEvent('zedi:restore'));
    });

    window.addEventListener('pagehide', function () { rememberPointer(); runLeave(); });
  }

  /* -------------------------------------------------------------- theme */
  // Switch between the day and the night look while the page is open. The new look
  // opens as a growing circle from "origin" (where the visitor pressed), using the
  // browser's view transitions where they exist. The choice lasts for the browser tab.
  var themeBusy = false;

  function applyTheme(night) {
    root.classList.toggle('is-night', night);
    env.night = night;
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', night ? '#000000' : '#ffffff');
    try { window.sessionStorage.setItem('zedi-theme', night ? 'night' : 'day'); } catch (e) { /* lasts for this page only */ }
    labelThemeButton();
    window.dispatchEvent(new CustomEvent('zedi:theme', { detail: { night: night } }));
  }

  function setTheme(night, origin) {
    night = !!night;
    if (night === env.night || themeBusy) return;
    if (env.reducedMotion || typeof document.startViewTransition !== 'function') { applyTheme(night); return; }

    var x = origin && isFinite(origin.x) ? origin.x : window.innerWidth / 2;
    var y = origin && isFinite(origin.y) ? origin.y : window.innerHeight / 2;
    var reach = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    var done = function () { themeBusy = false; root.classList.remove('is-theme-switching'); };
    themeBusy = true;
    root.classList.add('is-theme-switching');
    try {
      var transition = document.startViewTransition(function () { applyTheme(night); });
      transition.ready.then(function () {
        root.animate(
          { clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + reach + 'px at ' + x + 'px ' + y + 'px)'] },
          { duration: 850, easing: 'cubic-bezier(0.65, 0, 0.2, 1)', pseudoElement: '::view-transition-new(root)' });
      }).catch(function () { /* the look still changes, just without the circle */ });
      transition.finished.then(done, done);
    } catch (e) {
      if (env.night !== night) applyTheme(night);
      done();
    }
  }

  function labelThemeButton() {
    if (navTheme) navTheme.setAttribute('aria-label', env.night ? 'Switch to the day look' : 'Switch to the night look');
  }

  /* --------------------------------------------------------------- menu */
  var menuOpen = false;
  var navEl, navMenu, navToggle, navTheme;

  function currentFile() {
    var file = window.location.pathname.split('/').pop() || 'index.html';
    return file.toLowerCase();
  }

  function buildNav() {
    var here = currentFile();
    var links = content.nav.map(function (item) {
      var file = item.href.split(/[?#]/)[0].split('/').pop().toLowerCase() || 'index.html';
      // project pages belong to "Work"
      var active = file === here || (page === 'project' && file === 'work.html');
      return h('li', null, h('a', { href: item.href, 'aria-current': active ? 'page' : null }, item.label));
    });

    navToggle = h('button', {
      class: 'z-nav__toggle', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'z-nav-menu', 'aria-label': 'Open menu',
      on: { click: function (e) { e.stopPropagation(); setMenu(!menuOpen); } },
    }, h('span', { class: 'z-nav__burger', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')));

    // The visible way to change the look (pressing and holding on empty space is the other one).
    navTheme = h('button', {
      class: 'z-nav__theme', type: 'button',
      on: { click: function (e) { e.stopPropagation(); setTheme(!env.night, centreOf(navTheme)); } },
    }, icon('light', 25));
    labelThemeButton();

    navMenu = h('nav', { class: 'z-nav__menu', id: 'z-nav-menu', 'aria-label': 'Main' },
      h('ul', { class: 'z-nav__list' }, links),
      h('div', { class: 'z-nav__tools' },
        navTheme,
        h('button', { class: 'z-nav__close', type: 'button', 'aria-label': 'Close menu', on: { click: function (e) { e.stopPropagation(); setMenu(false); } } }, icon('close', 25))));

    // the button comes before the links so that Tab moves from it straight into the open menu
    navEl = h('div', { class: 'z-nav' },
      h('span', { class: 'z-nav__shape' }),
      navToggle,
      h('div', { class: 'z-nav__clip' }, navMenu));

    // a click on the pill itself (not on a link) closes it, like the reference
    navEl.addEventListener('click', function (e) {
      if (menuOpen && !(e.target.closest && e.target.closest('a'))) setMenu(false);
    });

    var veil = h('div', { class: 'z-veil', 'aria-hidden': 'true', on: { click: function () { setMenu(false); } } });

    body.appendChild(veil);
    // Placed right after the "skip" link: keyboard users reach the menu first instead of
    // last. It is fixed to the screen, so its place in the page makes no visual difference.
    var main = document.getElementById('main');
    if (main && main.parentNode === body) body.insertBefore(navEl, main);
    else body.appendChild(navEl);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menuOpen) { setMenu(false); navToggle.focus(); }
    });

    measureNav();
    window.addEventListener('resize', measureNav, { passive: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measureNav);
  }

  // The open pill is exactly as wide (or, on phones, as tall) as its links need.
  function measureNav() {
    if (!navMenu) return;
    root.style.setProperty('--z-nav-w', Math.ceil(navMenu.offsetWidth) + 'px');
    root.style.setProperty('--z-nav-h', Math.ceil(navMenu.offsetHeight) + 'px');
  }

  function setMenu(open) {
    if (!navEl || menuOpen === open) return;
    menuOpen = open;
    if (open) measureNav();
    root.classList.toggle('is-menu-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    window.dispatchEvent(new CustomEvent('zedi:menu', { detail: { open: open } }));
  }

  /* ------------------------------------------------------------- cursor */
  var cursorEl = null;
  var cursorState = { over: false, down: false, forced: null, hidden: false };
  var GROW = 'a, button, [role="button"], label, summary, [data-cursor="grow"]';

  function renderCursor() {
    if (!cursorEl) return;
    var grown = cursorState.forced !== null ? cursorState.forced : (cursorState.over || cursorState.down);
    cursorEl.classList.toggle('is-grown', grown);
    cursorEl.classList.toggle('is-hidden', cursorState.hidden);
  }

  function moveCursor(x, y) {
    cursorEl.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
    cursorEl.classList.add('is-visible');
  }

  function rememberPointer() {
    if (!cursorEl || lastPointer === null) return;
    try { window.sessionStorage.setItem('zedi-pointer', lastPointer.x + ',' + lastPointer.y); } catch (e) { /* optional */ }
  }

  var lastPointer = null;

  function buildCursor() {
    if (!env.finePointer) return;
    cursorEl = h('div', { class: 'z-cursor', 'aria-hidden': 'true' }, h('span', { class: 'z-cursor__dot' }));
    body.appendChild(cursorEl);
    root.classList.add('has-cursor');

    // Start where the pointer was on the previous page, so the dot does not vanish between pages.
    try {
      var saved = (window.sessionStorage.getItem('zedi-pointer') || '').split(',');
      if (saved.length === 2 && isFinite(+saved[0]) && isFinite(+saved[1])) {
        lastPointer = { x: +saved[0], y: +saved[1] };
        moveCursor(lastPointer.x, lastPointer.y);
      }
    } catch (e) { /* optional */ }

    document.addEventListener('mousemove', function (e) {
      lastPointer = { x: e.clientX, y: e.clientY };
      moveCursor(e.clientX, e.clientY);
    }, { passive: true });

    document.addEventListener('mouseover', function (e) {
      cursorState.over = !!(e.target && e.target.closest && e.target.closest(GROW));
      renderCursor();
    }, { passive: true });

    document.addEventListener('mousedown', function () { cursorState.down = true; renderCursor(); }, { passive: true });
    document.addEventListener('mouseup', function () { cursorState.down = false; renderCursor(); }, { passive: true });
    root.addEventListener('mouseleave', function () { cursorEl.classList.remove('is-visible'); });
  }

  var cursor = {
    grow: function () { cursorState.forced = true; renderCursor(); },
    reset: function () { cursorState.forced = null; renderCursor(); },
    hide: function () { cursorState.hidden = true; renderCursor(); },
    show: function () { cursorState.hidden = false; renderCursor(); },
  };

  /* --------------------------------------------------------------- tilt */
  // Elements registered here lean towards the pointer, like the reference logo.
  var tilted = [];
  var tiltFrame = 0;
  var tiltPoint = null;

  function applyTilt() {
    tiltFrame = 0;
    if (!tiltPoint) return;
    var rx = (window.innerHeight / 2 - tiltPoint.y) / tiltPoint.div;
    var ry = (tiltPoint.x - window.innerWidth / 2) / tiltPoint.div;
    tilted.forEach(function (t) {
      t.el.style.transform = t.base + ' perspective(800px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
    });
  }

  function tilt(el, base) {
    if (!el) return;
    tilted.push({ el: el, base: base || '' });
    if (tilted.length > 1) return;

    window.addEventListener('mousemove', function (e) {
      if (env.reducedMotion) return;
      tiltPoint = { x: e.clientX, y: e.clientY, div: 20 };
      if (!tiltFrame) tiltFrame = window.requestAnimationFrame(applyTilt);
    }, { passive: true });

    window.addEventListener('touchmove', function (e) {
      if (env.reducedMotion || !e.touches || !e.touches.length) return;
      tiltPoint = { x: e.touches[0].clientX, y: e.touches[0].clientY, div: 10 };
      if (!tiltFrame) tiltFrame = window.requestAnimationFrame(applyTilt);
    }, { passive: true });
  }

  // Hand an element back (the 3D wordmark does its own leaning once it is running).
  function untilt(el) {
    for (var i = tilted.length - 1; i >= 0; i--) {
      if (tilted[i].el === el) {
        el.style.transform = '';
        tilted.splice(i, 1);
      }
    }
  }

  /* --------------------------------------------------------------- idle */
  // html.is-idle is set after a pause without input; pages use it to hide their controls.
  var idleTimer = 0;
  var idleMs = 0;

  function idleReset() {
    root.classList.remove('is-idle');
    window.clearTimeout(idleTimer);
    if (idleMs) idleTimer = window.setTimeout(function () { root.classList.add('is-idle'); }, idleMs);
  }

  var idle = {
    watch: function (ms, firstMs) {
      idleMs = ms || 2000;
      ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'].forEach(function (type) {
        document.addEventListener(type, idleReset, { passive: true });
      });
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(function () { root.classList.add('is-idle'); }, firstMs || idleMs);
    },
    stop: function () {
      idleMs = 0;
      window.clearTimeout(idleTimer);
      root.classList.remove('is-idle');
    },
    poke: idleReset,
  };

  /* -------------------------------------------------------------- video */
  function play(video) {
    if (!video || typeof video.play !== 'function') return;
    var attempt = video.play();
    if (attempt && typeof attempt.catch === 'function') attempt.catch(function () { /* autoplay refused or source missing */ });
  }

  function pause(video) {
    if (video && typeof video.pause === 'function' && !video.paused) video.pause();
  }

  /* ------------------------------------------------------------ overlays */
  var scrollLocks = 0;

  function lockScroll(on) {
    scrollLocks = Math.max(0, scrollLocks + (on ? 1 : -1));
    if (scrollLocks === 1 && on) {
      var gap = window.innerWidth - root.clientWidth;      // width of the scrollbar that is about to vanish
      root.style.overflow = 'hidden';
      if (gap > 0) body.style.paddingRight = gap + 'px';
    } else if (scrollLocks === 0) {
      root.style.overflow = '';
      body.style.paddingRight = '';
    }
  }

  // Keep Tab inside a dialog. Returns a function that releases the trap.
  function trapFocus(container) {
    function onKey(e) {
      if (e.key !== 'Tab') return;
      var items = Array.prototype.filter.call(
        container.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'),
        function (el) { return el.offsetParent !== null || el === document.activeElement; });
      if (!items.length) { e.preventDefault(); return; }
      var first = items[0];
      var last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || !container.contains(document.activeElement))) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || !container.contains(document.activeElement))) {
        e.preventDefault(); first.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return function () { document.removeEventListener('keydown', onKey); };
  }

  /* --------------------------------------------------------- page chrome */
  function buildLogo() {
    // home and project place their own logo; the work index has none (as on the reference)
    if (page === 'home' || page === 'project' || page === 'work') return;
    var main = document.getElementById('main');
    if (!main) return;
    var el = h('div', { class: 'z-logo' },
      h('a', { href: 'index.html', 'aria-label': content.site.name + ', home' }, logo()));
    main.insertBefore(el, main.firstChild);
    tilt(el, 'translateX(-50%)');
  }

  function footerLinks() {
    var links = [];
    content.contact.forEach(function (block) {
      block.rows.forEach(function (row) {
        if (row.type === 'link' && row.href && links.length < 1) links.push({ label: row.label || row.value, href: row.href, external: true });
      });
    });
    if (content.site.email) links.push({ label: 'Email', href: 'mailto:' + content.site.email });
    return links;
  }

  function buildFooter() {
    if (!body.hasAttribute('data-footer')) return;
    var main = document.getElementById('main');
    if (!main) return;
    var links = footerLinks();
    var linkNodes = [];
    links.forEach(function (l, i) {
      if (i) linkNodes.push(' / ');
      linkNodes.push(h('a', { href: l.href, target: l.external ? '_blank' : null, rel: l.external ? 'noopener' : null }, l.label));
    });
    main.appendChild(h('footer', { class: 'z-footer' },
      h('p', null, content.site.name + ' ' + new Date().getFullYear() + ' - All rights reserved'),
      linkNodes.length ? h('p', { class: 'z-footer__links' }, linkNodes) : null));
  }

  /* ---------------------------------------------------------------- API */
  window.Zedi = {
    content: content,
    env: env,
    page: page,
    ready: ready,
    onLeave: onLeave,
    navigate: navigate,
    h: h,
    icon: icon,
    logo: logo,
    tilt: tilt,
    untilt: untilt,
    theme: {
      isNight: function () { return env.night; },
      set: setTheme,
      toggle: function (origin) { setTheme(!env.night, origin); },
    },
    cursor: cursor,
    idle: idle,
    play: play,
    pause: pause,
    lockScroll: lockScroll,
    trapFocus: trapFocus,
    formatTime: formatTime,
    projects: function () { return content.projects; },
    art: function () { return content.art; },
    getProject: function (slug) { return find(content.projects, slug); },
    getArt: function (slug) { return find(content.art, slug); },
    categories: function () { return uniqueValues(function (p) { return p.category; }); },
    roles: function () { return uniqueValues(function (p) { return p.roles; }); },
    projectUrl: function (p) { return 'project.html?p=' + encodeURIComponent(p.slug); },
    artUrl: function (a) { return 'art.html#' + encodeURIComponent(a.slug); },
    closeMenu: function () { setMenu(false); },
    isMenuOpen: function () { return menuOpen; },
  };

  /* -------------------------------------------------------------- mount */
  function mount() {
    if (mounted || !body) return;
    buildNav();
    buildCursor();
    buildLogo();
    interceptLinks();
    mounted = true;
    readyQueue.splice(0).forEach(function (fn) { fn(); });

    // Page scripts are deferred too and run right after this one, before DOMContentLoaded;
    // wait for that event so the footer lands after their content, then fade the page in.
    var revealed = false;
    function reveal() {
      if (revealed) return;
      revealed = true;
      buildFooter();
      window.requestAnimationFrame(function () { root.classList.add('is-ready'); });
      window.setTimeout(function () { root.classList.remove('is-arriving'); }, 1500);   // the drop has gone by then
    }
    if (document.readyState === 'complete') reveal();
    else {
      document.addEventListener('DOMContentLoaded', reveal);
      window.addEventListener('load', reveal);
    }
  }

  mount();
})();
