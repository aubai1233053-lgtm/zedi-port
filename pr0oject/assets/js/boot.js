/* Runs in <head> before the page is painted: decides day or night look and
   applies the accent colours from content.js, so there is no flash of the
   wrong colours. Keep it tiny and dependency-free. */
(function () {
  'use strict';

  var root = document.documentElement;
  var theme = (window.ZEDI_CONTENT && window.ZEDI_CONTENT.theme) || {};

  root.classList.remove('no-js');
  root.classList.add('js');

  function hour(value, fallback) {
    var n = parseInt(value, 10);
    return n >= 0 && n <= 23 ? n : fallback;
  }

  // Preview helper: add ?theme=night (or day / auto) to any page address.
  // The choice sticks for the browser tab so you can click around.
  var mode = theme.mode === 'day' || theme.mode === 'night' ? theme.mode : 'auto';
  try {
    var asked = new URLSearchParams(window.location.search).get('theme');
    if (asked === 'day' || asked === 'night') {
      window.sessionStorage.setItem('zedi-theme', asked);
    } else if (asked === 'auto') {
      window.sessionStorage.removeItem('zedi-theme');
    }
    var stored = window.sessionStorage.getItem('zedi-theme');
    if (stored === 'day' || stored === 'night') mode = stored;
  } catch (e) { /* storage can be blocked; the configured mode still applies */ }

  var start = hour(theme.nightStartsAt, 19);
  var end = hour(theme.nightEndsAt, 7);
  var now = new Date().getHours();
  var nightByClock = start > end ? (now >= start || now < end) : (now >= start && now < end);
  var night = mode === 'night' || (mode === 'auto' && nightByClock);
  root.classList.toggle('is-night', night);

  // Black or white text on top of an accent colour, whichever reads better.
  function readableOn(hex) {
    var m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex || '').trim());
    if (!m) return null;
    var h = m[1].length === 3 ? m[1].replace(/./g, '$&$&') : m[1];
    var lum = [0, 2, 4].map(function (i) {
      var c = parseInt(h.substr(i, 2), 16) / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    var l = 0.2126 * lum[0] + 0.7152 * lum[1] + 0.0722 * lum[2];
    return l > 0.4 ? '#000' : '#fff';
  }

  [['accentDay', 'day'], ['accentNight', 'night']].forEach(function (pair) {
    var text = readableOn(theme[pair[0]]);
    if (!text) return;
    root.style.setProperty('--accent-' + pair[1], String(theme[pair[0]]).trim());
    root.style.setProperty('--on-accent-' + pair[1], text);
  });

  var meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', night ? '#000000' : '#ffffff');

  // No precise pointer: no custom cursor, no hover-only affordances.
  var fine = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  root.classList.toggle('is-touch', !fine);

  // Arriving from another page of the site: that page covered the screen with a drop of
  // the accent colour. Start covered too, so the drop can shrink back to where it began.
  try {
    var ink = (window.sessionStorage.getItem('zedi-ink') || '').split(',');
    window.sessionStorage.removeItem('zedi-ink');
    var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (ink.length === 3 && Date.now() - ink[0] < 8000 && !calm) {
      root.style.setProperty('--ink-x', (+ink[1] || 0) + 'px');
      root.style.setProperty('--ink-y', (+ink[2] || 0) + 'px');
      root.classList.add('is-arriving');
    }
  } catch (e) { /* no storage: the page simply fades in */ }

  // Safety net: if the main script fails to load, still reveal the page.
  window.setTimeout(function () { root.classList.add('is-ready'); }, 3000);

  window.ZEDI_BOOT = { night: night, mode: mode, finePointer: !!fine };
})();
