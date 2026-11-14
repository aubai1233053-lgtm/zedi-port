/* ==========================================================================
   WORK — builds the index from content.js: rows, the two filters
   (project type and role) and the preview that pops up while a row is hovered.
   ========================================================================== */
(function () {
  'use strict';

  var Z = window.Zedi;
  if (!Z) return;

  Z.ready(function () {
    var h = Z.h;
    var mount = document.getElementById('work-root');
    var pageEl = document.getElementById('main');
    if (!mount || !pageEl) return;

    var projects = Z.projects();
    var state = { category: '', role: '' };

    // Filters can be pre-set from the address: work.html?category=Music+Video&role=Editor
    try {
      var params = new URLSearchParams(window.location.search);
      var askedCategory = params.get('category') || '';
      var askedRole = params.get('role') || '';
      if (Z.categories().indexOf(askedCategory) !== -1) state.category = askedCategory;
      if (Z.roles().indexOf(askedRole) !== -1) state.role = askedRole;
    } catch (e) { /* no filters */ }

    function matches(p, category, role) {
      return (!category || p.category === category) && (!role || p.roles.indexOf(role) !== -1);
    }

    /* ------------------------------------------------------------ rows */
    var rows = projects.map(function (p) {
      var link = h('a', { class: 'work-row', href: Z.projectUrl(p) },
        h('span', { class: 'work-col work-col--client' },
          h('span', { class: 'work-row__client' }, p.client || p.category),
          h('span', { class: 'work-row__title' }, p.title)),
        h('span', { class: 'work-col work-col--project' }, p.title),
        h('span', { class: 'work-col work-col--role' }, p.roles.join(', ')));
      var item = h('li', null, link);
      return { project: p, item: item, link: link };
    });

    var listEl = h('ul', { class: 'work-list' }, rows.map(function (r) { return r.item; }));
    var emptyEl = h('p', { class: 'work-empty', hidden: true }, 'Nothing matches these filters yet.');

    /* --------------------------------------------------------- filters */
    var openFilter = null;

    function buildFilter(key, title, values) {
      var label = h('span', { class: 'work-filter__label' }, title);
      var arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      arrow.setAttribute('class', 'work-filter__arrow');
      arrow.setAttribute('viewBox', '0 0 8 5');
      arrow.setAttribute('fill', 'none');
      arrow.setAttribute('aria-hidden', 'true');
      var stroke = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      stroke.setAttribute('d', 'M0.7 0.7 4 4 7.3 0.7');
      stroke.setAttribute('stroke', 'currentColor');
      stroke.setAttribute('stroke-width', '1.33');
      stroke.setAttribute('stroke-linecap', 'round');
      stroke.setAttribute('stroke-linejoin', 'round');
      arrow.appendChild(stroke);

      var panelId = 'work-filter-' + key;
      var button = h('button', {
        class: 'work-filter__btn', type: 'button', 'aria-expanded': 'false', 'aria-controls': panelId,
      }, label, arrow);

      var options = [''].concat(values).map(function (value) {
        return {
          value: value,
          el: h('button', { class: 'work-filter__opt', type: 'button', role: 'radio', 'aria-checked': 'false' },
            h('span', { class: 'work-filter__dot', 'aria-hidden': 'true' }),
            h('span', null, value || 'All')),
        };
      });

      var closeBtn = h('button', { class: 'work-filter__close', type: 'button', 'aria-label': 'Close filter' }, Z.icon('close', 25));
      var panel = h('div', { class: 'work-filter__panel', id: panelId, role: 'radiogroup', 'aria-label': 'Filter by ' + title.toLowerCase() },
        options.map(function (o) { return o.el; }), closeBtn);
      var wrap = h('div', { class: 'work-filter' }, button, panel);
      var cell = h('div', { class: 'work-col work-head__cell work-col--' + (key === 'category' ? 'project' : 'role') }, wrap);

      var filter = { key: key, title: title, wrap: wrap, cell: cell, button: button, label: label, options: options };

      button.addEventListener('click', function (e) {
        e.stopPropagation();
        toggle(filter, openFilter !== filter);
      });
      closeBtn.addEventListener('click', function (e) { e.stopPropagation(); toggle(filter, false); button.focus(); });
      panel.addEventListener('click', function (e) { e.stopPropagation(); });
      options.forEach(function (o) {
        o.el.addEventListener('click', function () {
          state[key] = o.value;
          update();
          toggle(filter, false);
          button.focus();
        });
      });
      return filter;
    }

    function toggle(filter, open) {
      if (openFilter && openFilter !== filter) setOpen(openFilter, false);
      setOpen(filter, open);
      openFilter = open ? filter : null;
      pageEl.classList.toggle('is-filtering', !!openFilter);
      if (openFilter) hideThumb();
    }

    function setOpen(filter, open) {
      filter.wrap.classList.toggle('is-open', open);
      filter.cell.classList.toggle('is-active', open);
      filter.button.setAttribute('aria-expanded', String(open));
    }

    var filters = [
      buildFilter('category', 'Project', Z.categories()),
      buildFilter('role', 'Role', Z.roles()),
    ];

    document.addEventListener('click', function () { if (openFilter) toggle(openFilter, false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && openFilter) { var f = openFilter; toggle(f, false); f.button.focus(); }
    });

    function update() {
      var shown = 0;
      rows.forEach(function (r) {
        var ok = matches(r.project, state.category, state.role);
        r.item.hidden = !ok;
        if (ok) shown++;
      });
      emptyEl.hidden = shown > 0;

      filters.forEach(function (filter) {
        var other = filter.key === 'category' ? 'role' : 'category';
        filter.label.textContent = state[filter.key] || filter.title;
        filter.options.forEach(function (o) {
          var count = projects.filter(function (p) {
            return filter.key === 'category' ? matches(p, o.value, state[other]) : matches(p, state[other], o.value);
          }).length;
          o.el.setAttribute('aria-checked', String(state[filter.key] === o.value));
          o.el.disabled = !!o.value && count === 0;      // would give an empty list together with the other filter
        });
      });

      // keep the choice in the address so Back returns to the same list
      try {
        var q = new URLSearchParams(window.location.search);
        ['category', 'role'].forEach(function (k) { if (state[k]) q.set(k, state[k]); else q.delete(k); });
        var search = q.toString();
        window.history.replaceState(null, '', window.location.pathname + (search ? '?' + search : '') + window.location.hash);
      } catch (e) { /* some browsers refuse this on file:// — the filter still works */ }
    }

    /* ----------------------------------------------------- hover preview */
    var thumbVideo = h('video', { muted: true, loop: true, playsinline: true, preload: 'none', tabindex: '-1' });
    thumbVideo.muted = true;
    var thumb = h('div', { class: 'work-thumb', 'aria-hidden': 'true' }, thumbVideo);
    var hovered = null;
    var thumbTimer = 0;
    var scrollTimer = 0;
    var canHover = Z.env.finePointer;

    function hideThumb() {
      window.clearTimeout(thumbTimer);
      thumb.classList.remove('is-shown');
      Z.pause(thumbVideo);
    }

    // Drop the preview somewhere random on screen, never on top of the hovered row.
    function placeThumb(row) {
      var vw = window.innerWidth;
      var vh = window.innerHeight;
      var w = thumb.offsetWidth;
      var ht = thumb.offsetHeight;
      var bar = row.link.getBoundingClientRect();
      var above = bar.top - ht;                  // largest "top" that keeps the preview above the row
      var below = vh - ht - bar.bottom;          // free travel below the row
      var top;
      if (above < 0 && below < 0) top = above > below ? 0 : vh - ht;   // no room: take the roomier side
      else {
        var span = Math.max(0, above) + Math.max(0, below);
        var pick = Math.random() * span;
        top = pick < Math.max(0, above) ? pick : bar.bottom + (pick - Math.max(0, above));
      }
      thumb.style.left = Math.round(Math.random() * Math.max(0, vw - w)) + 'px';
      thumb.style.top = Math.round(top) + 'px';
    }

    function showThumb(row) {
      window.clearTimeout(thumbTimer);
      if (!canHover || window.innerWidth < 960 || openFilter) return;
      var p = row.project;
      if (!p.preview && !p.poster) return;
      thumbTimer = window.setTimeout(function () {
        if (hovered !== row) return;
        if (p.poster) thumbVideo.setAttribute('poster', p.poster); else thumbVideo.removeAttribute('poster');
        if (thumbVideo.getAttribute('src') !== p.preview) {
          if (p.preview) thumbVideo.setAttribute('src', p.preview); else thumbVideo.removeAttribute('src');
        }
        placeThumb(row);
        thumb.classList.add('is-shown');
        Z.play(thumbVideo);
      }, 50);
    }

    rows.forEach(function (row) {
      row.link.addEventListener('mouseenter', function () { hovered = row; hideThumb(); showThumb(row); });
      row.link.addEventListener('mouseleave', function () { if (hovered === row) hovered = null; hideThumb(); });
    });

    window.addEventListener('scroll', function () {
      if (!thumb.classList.contains('is-shown') && !hovered) return;
      hideThumb();
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(function () {
        if (hovered && hovered.link.matches(':hover')) showThumb(hovered);
      }, 150);
    }, { passive: true });

    Z.onLeave(hideThumb);

    /* ------------------------------------------------------------ mount */
    var head = h('div', { class: 'work-head' },
      h('div', { class: 'work-col work-head__cell work-col--client' }, 'Client'),
      filters[0].cell,
      filters[1].cell);

    mount.appendChild(head);
    mount.appendChild(projects.length ? listEl : h('p', { class: 'work-empty' }, 'Films will appear here soon.'));
    mount.appendChild(emptyEl);
    document.body.appendChild(thumb);
    update();
  });
})();
