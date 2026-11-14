/* ==========================================================================
   ART — gallery grid built from content.js and the viewer (lightbox):
   arrows / swipe / dots to move between works, Esc to close.
   An address such as art.html#soft-machine opens that work directly.
   ========================================================================== */
(function () {
  'use strict';

  var Z = window.Zedi;
  if (!Z) return;

  Z.ready(function () {
    var h = Z.h;
    var mount = document.getElementById('art-root');
    if (!mount) return;

    var works = Z.art();
    if (!works.length) {
      mount.appendChild(h('p', { class: 'art-empty' }, 'Artworks will appear here soon.'));
      return;
    }

    function caption(a) {
      return [a.title, a.medium, a.year].filter(Boolean).join(', ');
    }

    /* ------------------------------------------------------------ grid */
    var grid = h('div', { class: 'art-grid' });
    var items = works.map(function (a, index) {
      var img = h('img', {
        src: a.thumb, alt: caption(a), loading: index < 4 ? null : 'lazy', decoding: 'async',
        width: Math.round(a.width), height: Math.round(a.height),
      });
      var link = h('a', { class: 'art-item__link', href: '#' + encodeURIComponent(a.slug), 'aria-label': 'View ' + caption(a) },
        h('span', { class: 'art-item__image' }, img));
      var view = h('button', { class: 'art-item__view', type: 'button', 'aria-label': 'View ' + a.title }, 'View');
      var el = h('article', { class: 'art-item art-item--' + a.size },
        link,
        h('div', { class: 'art-item__bar' },
          h('div', { class: 'art-item__info' },
            h('p', { class: 'art-item__title' }, a.title),
            a.year ? h('p', { class: 'art-item__year' }, a.year) : null),
          view));
      link.addEventListener('click', function (e) { e.preventDefault(); open(index, link); });
      view.addEventListener('click', function () { open(index, view); });
      grid.appendChild(el);
      return { art: a, link: link };
    });
    mount.appendChild(grid);

    /* ---------------------------------------------------------- viewer */
    var current = -1;
    var opener = null;
    var release = null;
    var isOpen = false;

    var image = h('img', { alt: '', decoding: 'async' });
    var imageBox = h('div', { class: 'art-box__image' }, image);
    var titleEl = h('h2', { class: 'art-box__title', id: 'art-box-title' });
    var metaEl = h('p', { class: 'art-box__meta' });
    var yearEl = h('p', null);
    var statusEl = h('p', { class: 'art-box__meta' });
    var enquire = h('a', { class: 'art-box__enquire' }, 'Enquire');
    var card = h('figure', { class: 'art-box__card' },
      imageBox,
      h('figcaption', { class: 'art-box__info' },
        h('div', { class: 'art-box__main' }, titleEl, metaEl),
        h('div', { class: 'art-box__side' }, yearEl, statusEl, enquire)));

    var prevArrow = h('span', { class: 'art-box__arrow', 'aria-hidden': 'true' }, Z.icon('prev'));
    var nextArrow = h('span', { class: 'art-box__arrow', 'aria-hidden': 'true' }, Z.icon('next'));
    var prevZone = h('button', { class: 'art-box__zone art-box__zone--prev', type: 'button', 'aria-label': 'Previous artwork' }, prevArrow);
    var nextZone = h('button', { class: 'art-box__zone art-box__zone--next', type: 'button', 'aria-label': 'Next artwork' }, nextArrow);
    var closeBtn = h('button', { class: 'art-box__close', type: 'button', 'aria-label': 'Close' }, Z.icon('close'));

    var dots = works.map(function (a, index) {
      return h('button', {
        class: 'art-box__dot', type: 'button', 'aria-label': a.title,
        on: { click: function (e) { e.stopPropagation(); show(index); } },
      });
    });
    var dotsEl = h('div', { class: 'art-box__dots' }, works.length > 1 ? dots : null);

    var box = h('div', { class: 'art-box', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'art-box-title', 'aria-hidden': 'true' },
      works.length > 1 ? prevZone : null, works.length > 1 ? nextZone : null, card, closeBtn, dotsEl);
    document.body.appendChild(box);

    function setHash(slug) {
      try {
        window.history.replaceState(null, '', window.location.pathname + window.location.search + (slug ? '#' + encodeURIComponent(slug) : ''));
      } catch (e) { /* the viewer works without it */ }
    }

    function show(index) {
      var count = works.length;
      current = ((index % count) + count) % count;
      var a = works[current];

      // show the small picture at once, then swap in the large one when it has loaded
      imageBox.style.backgroundImage = 'url("' + encodeURI(a.thumb).replace(/"/g, '%22') + '")';
      image.classList.add('is-loading');
      image.alt = caption(a);
      image.onload = function () { image.classList.remove('is-loading'); };
      image.onerror = function () { image.classList.add('is-loading'); };
      image.src = a.image;
      if (image.complete && image.naturalWidth) image.classList.remove('is-loading');

      titleEl.textContent = a.title;
      metaEl.textContent = [a.medium, a.dimensions].filter(Boolean).join(', ');
      yearEl.textContent = a.year;
      statusEl.textContent = a.status;
      statusEl.hidden = !a.status;
      if (Z.content.site.email) {
        enquire.href = 'mailto:' + Z.content.site.email + '?subject=' + encodeURIComponent('Artwork: ' + a.title);
        enquire.hidden = false;
      } else enquire.hidden = true;

      dots.forEach(function (d, i) { d.setAttribute('aria-current', String(i === current)); });
      if (isOpen) setHash(a.slug);
    }

    function open(index, from) {
      if (isOpen) { show(index); return; }
      isOpen = true;
      opener = from || document.activeElement;
      show(index);
      setHash(works[current].slug);
      box.classList.add('is-open');
      box.setAttribute('aria-hidden', 'false');
      Z.lockScroll(true);
      release = Z.trapFocus(box);
      closeBtn.focus({ preventScroll: true });
    }

    function close() {
      if (!isOpen) return;
      isOpen = false;
      box.classList.remove('is-open');
      box.setAttribute('aria-hidden', 'true');
      Z.lockScroll(false);
      if (release) { release(); release = null; }
      setHash('');
      Z.cursor.show();
      if (opener && typeof opener.focus === 'function') opener.focus({ preventScroll: true });
    }

    closeBtn.addEventListener('click', function (e) { e.stopPropagation(); close(); });
    prevZone.addEventListener('click', function (e) { e.stopPropagation(); show(current - 1); });
    nextZone.addEventListener('click', function (e) { e.stopPropagation(); show(current + 1); });
    card.addEventListener('click', function (e) { e.stopPropagation(); });
    box.addEventListener('click', close);                 // a click on the dark area closes

    document.addEventListener('keydown', function (e) {
      if (!isOpen) return;
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      else if (e.key === 'ArrowLeft' && works.length > 1) show(current - 1);
      else if (e.key === 'ArrowRight' && works.length > 1) show(current + 1);
    });

    // arrow badges follow the pointer inside the side areas
    if (Z.env.finePointer) {
      [[prevZone, prevArrow], [nextZone, nextArrow]].forEach(function (pair) {
        pair[0].addEventListener('mousemove', function (e) {
          pair[1].style.transform = 'translate3d(' + e.clientX + 'px,' + e.clientY + 'px,0)';
        }, { passive: true });
        pair[0].addEventListener('mouseenter', function () { Z.cursor.hide(); });
        pair[0].addEventListener('mouseleave', function () { Z.cursor.show(); });
      });
    }

    // swipe left / right on touch screens
    var touchX = null;
    var touchY = null;
    box.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) { touchX = null; return; }
      touchX = e.touches[0].clientX;
      touchY = e.touches[0].clientY;
    }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (touchX === null || works.length < 2) return;
      var dx = e.changedTouches[0].clientX - touchX;
      var dy = e.changedTouches[0].clientY - touchY;
      touchX = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) show(current + (dx < 0 ? 1 : -1));
    }, { passive: true });

    /* --------------------------------------------- open from the address */
    function openFromHash() {
      var slug = '';
      try { slug = decodeURIComponent(window.location.hash.replace(/^#/, '')); } catch (e) { slug = ''; }
      if (!slug) { if (isOpen) close(); return; }
      for (var i = 0; i < works.length; i++) {
        if (works[i].slug === slug) { open(i, items[i].link); return; }
      }
    }
    window.addEventListener('hashchange', openFromHash);
    openFromHash();

    Z.onLeave(function () { if (isOpen) Z.lockScroll(false); });
  });
})();
