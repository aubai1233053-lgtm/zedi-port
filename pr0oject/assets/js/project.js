/* ==========================================================================
   PROJECT — the film page (project.html?p=slug)
   A silent preview loop plays first. The first click starts the film with
   sound; after that a click toggles play / pause. A thin line with the
   running time marks the position and can be dragged to scrub.
   ========================================================================== */
(function () {
  'use strict';

  var Z = window.Zedi;
  if (!Z) return;

  Z.ready(function () {
    var h = Z.h;
    var mount = document.getElementById('project-root');
    if (!mount) return;

    var slug = '';
    try { slug = new URLSearchParams(window.location.search).get('p') || ''; } catch (e) { /* none */ }
    var projects = Z.projects();
    var project = Z.getProject(slug);

    if (!project) {
      document.body.classList.add('is-missing');
      mount.appendChild(h('div', { class: 'notfound' },
        h('h1', { class: 'z-caps' }, 'Film not found'),
        h('p', { class: 'z-muted' }, 'This address does not match any film.'),
        h('p', null, h('a', { class: 'z-link notfound__link', href: 'work.html' }, 'See all work'))));
      return;
    }

    var heading = (project.client ? project.client + ' — ' : '') + project.title;
    document.title = Z.content.site.name + ' | ' + heading;

    /* ------------------------------------------------------------ build */
    var video = h('video', {
      class: 'project-video', playsinline: true, loop: true, preload: 'metadata',
      poster: project.poster || null, src: project.video || null, tabindex: '-1',
    });

    var preview = null;
    if (project.preview) {
      preview = h('video', {
        class: 'project-preview', muted: true, autoplay: true, loop: true, playsinline: true, preload: 'auto',
        poster: project.poster || null, src: project.preview, tabindex: '-1', 'aria-hidden': 'true',
      });
      preview.muted = true;
    }

    var timeLabel = h('span', { class: 'project-progress__time' }, '00.00');
    var handle = h('div', { class: 'project-progress__handle', 'aria-hidden': 'true' }, timeLabel);
    var progress = h('div', { class: 'project-progress' }, handle);

    var frame = h('div', {
      class: 'project-frame', role: 'button', tabindex: '0', 'aria-label': 'Play film: ' + heading,
    }, video, preview, progress);

    var badge = h('div', { class: 'project-badge project-ui', 'aria-hidden': 'true' },
      Z.icon('play'), Z.icon('pause'), Z.icon('scrub'));

    var soundBtn = h('button', { class: 'project-btn project-sound project-ui', type: 'button', 'aria-pressed': 'false', 'aria-label': 'Sound' },
      h('span', { class: 'project-waves', 'aria-hidden': 'true' }, h('i'), h('i'), h('i'), h('i')));

    // "Close" returns to where the visitor most likely came from.
    var backTo = 'work.html';
    try {
      if (document.referrer) {
        var from = new URL(document.referrer);
        if (from.host === window.location.host && /(\/|\/index\.html)$/i.test(from.pathname)) backTo = 'index.html';
      }
    } catch (e) { /* keep the Work page */ }
    var closeBtn = h('a', { class: 'project-btn project-close project-ui', href: backTo, 'aria-label': 'Close film' },
      Z.icon('close'));

    var logoEl = h('div', { class: 'project-logo project-ui' },
      h('a', { href: 'index.html', 'aria-label': Z.content.site.name + ', home' }, Z.logo()));

    var bar = h('div', { class: 'project-bar project-ui' },
      h('div', { class: 'project-bar__main' },
        h('h1', { class: 'project-bar__client' }, project.client || project.category),
        h('h2', { class: 'project-bar__title' }, project.title)),
      project.roles.length ? h('p', { class: 'project-bar__role' }, project.roles.join(' / ')) : null);

    var stage = h('section', { class: 'project-stage', 'aria-label': heading }, frame, badge, logoEl, soundBtn, closeBtn, bar);

    /* ---------------------------------------------------------- credits */
    var facts = [
      ['Client', project.client],
      ['Project', project.title],
      ['Type', project.category],
      ['Role', project.roles.join(', ')],
      ['Year', project.year],
    ].filter(function (f) { return f[1]; }).map(function (f) { return { role: f[0], name: f[1], url: '' }; });

    var credits = facts.concat(project.credits).map(function (c) {
      var external = /^https?:/i.test(c.url);
      var value = c.url
        ? h('a', { href: c.url, target: external ? '_blank' : null, rel: external ? 'noopener' : null }, c.name)
        : c.name;
      return h('div', { class: 'project-credit' }, h('dt', null, c.role), h('dd', null, value));
    });

    var at = projects.indexOf(project);
    var next = projects.length > 1 ? projects[(at + 1) % projects.length] : null;
    if (next) {
      credits.push(h('div', { class: 'project-credit project-credit--next' },
        h('dt', null, 'Next'),
        h('dd', null, h('a', { href: Z.projectUrl(next) }, (next.client ? next.client + ' — ' : '') + next.title))));
    }

    var creditsEl = h('section', { class: 'project-credits' },
      h('h3', { class: 'z-band' }, 'Credits'),
      h('dl', null, credits));

    mount.appendChild(stage);
    mount.appendChild(creditsEl);
    Z.tilt(logoEl, 'translateX(-50%)');

    /* ---------------------------------------------------------- player */
    var started = false;        // has the full film been started at least once?
    var scrubbing = false;
    var raf = 0;

    function setSound(on) {
      video.muted = !on;
      soundBtn.classList.toggle('is-on', on);
      soundBtn.setAttribute('aria-pressed', String(on));
    }

    function start() {
      if (started || !project.video) return;
      started = true;
      stage.classList.add('is-started');
      if (preview) Z.pause(preview);
    }

    function playFilm() {
      if (!project.video) return;
      var firstTime = !started;
      start();
      if (firstTime) setSound(true);
      var attempt = video.play();
      if (attempt && typeof attempt.catch === 'function') {
        attempt.catch(function () {
          // The browser refused to start with sound (or the file is missing): try silently.
          if (!video.muted) { setSound(false); Z.play(video); }
        });
      }
    }

    function toggle() {
      if (video.paused) playFilm(); else video.pause();
    }

    function render() {
      var d = video.duration;
      var ratio = isFinite(d) && d > 0 ? Math.min(1, Math.max(0, video.currentTime / d)) : 0;
      var x = ratio * frame.clientWidth;
      handle.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
      handle.classList.toggle('is-flipped', x > frame.clientWidth - 90);
      timeLabel.textContent = Z.formatTime(video.currentTime);
    }

    function loop() {
      render();
      raf = video.paused ? 0 : window.requestAnimationFrame(loop);
    }

    video.addEventListener('play', function () {
      stage.classList.add('is-playing');
      frame.setAttribute('aria-label', 'Pause film: ' + heading);
      if (!raf) raf = window.requestAnimationFrame(loop);
    });
    video.addEventListener('pause', function () {
      stage.classList.remove('is-playing');
      frame.setAttribute('aria-label', 'Play film: ' + heading);
    });
    ['seeked', 'timeupdate', 'loadedmetadata'].forEach(function (type) { video.addEventListener(type, render); });
    window.addEventListener('resize', render, { passive: true });

    frame.addEventListener('click', function (e) {
      if (e.target === handle || handle.contains(e.target)) return;   // the time line is for scrubbing
      toggle();
    });

    soundBtn.addEventListener('click', function () {
      if (!started) { playFilm(); return; }
      setSound(video.muted);
    });

    /* -------------------------------------------------------- scrubbing */
    function seekTo(clientX) {
      var d = video.duration;
      if (!isFinite(d) || d <= 0) return;
      var box = frame.getBoundingClientRect();
      var ratio = Math.min(1, Math.max(0, (clientX - box.left) / box.width));
      video.currentTime = Math.min(d - 0.05, ratio * d);
      render();
    }

    handle.addEventListener('pointerdown', function (e) {
      if (!started) return;
      scrubbing = true;
      stage.classList.add('is-scrubbing');
      try { handle.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }
      e.preventDefault();
    });
    handle.addEventListener('pointermove', function (e) { if (scrubbing) seekTo(e.clientX); });
    function endScrub() {
      scrubbing = false;
      if (!handle.matches(':hover')) stage.classList.remove('is-scrubbing');
    }
    handle.addEventListener('pointerup', endScrub);
    handle.addEventListener('pointercancel', endScrub);
    handle.addEventListener('mouseenter', function () { if (started) stage.classList.add('is-scrubbing'); });
    handle.addEventListener('mouseleave', function () { if (!scrubbing) stage.classList.remove('is-scrubbing'); });

    /* ------------------------------------------ pointer badge and cursor */
    if (Z.env.finePointer) {
      frame.addEventListener('mouseenter', function () { stage.classList.add('is-pointing'); Z.cursor.hide(); });
      frame.addEventListener('mouseleave', function () { stage.classList.remove('is-pointing'); Z.cursor.show(); });
      frame.addEventListener('mousemove', function (e) {
        var box = stage.getBoundingClientRect();
        badge.style.transform = 'translate3d(' + (e.clientX - box.left) + 'px,' + (e.clientY - box.top) + 'px,0)';
      }, { passive: true });
    }

    /* --------------------------------------------------------- keyboard */
    document.addEventListener('keydown', function (e) {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || Z.isMenuOpen()) return;
      var onControl = e.target && e.target.closest && e.target.closest('a, button, input, textarea, select');
      var onFrame = e.target === frame;
      if ((e.key === ' ' || e.key === 'Enter') && (onFrame || (!onControl && e.key === ' '))) { e.preventDefault(); toggle(); }
      else if (e.key === 'k' || e.key === 'K') toggle();
      else if (e.key === 'm' || e.key === 'M') { if (started) setSound(video.muted); }
      else if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && started && isFinite(video.duration)) {
        e.preventDefault();
        video.currentTime = Math.min(video.duration - 0.05, Math.max(0, video.currentTime + (e.key === 'ArrowRight' ? 5 : -5)));
      } else if (e.key === 'Escape') Z.navigate(closeBtn.href);
    });

    /* ------------------------------------------------------------- misc */
    // With a mouse the controls fade away while the pointer rests; on touch screens they stay put.
    if (Z.env.finePointer) Z.idle.watch(2000, 2500);

    // The menu button returns once the visitor scrolls down to the credits.
    function onScroll() {
      document.documentElement.classList.toggle('is-past-stage', window.scrollY > window.innerHeight * 0.4);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { video.pause(); if (preview) Z.pause(preview); }
      else if (!started && preview) Z.play(preview);
    });

    Z.onLeave(function () { video.pause(); if (preview) Z.pause(preview); Z.cursor.show(); });
    window.addEventListener('zedi:restore', function () { if (!started && preview) Z.play(preview); });

    if (preview) Z.play(preview);
    render();
  });
})();
