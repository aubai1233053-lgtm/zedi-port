/* ==========================================================================
   ABOUT + CONTACT — both pages are filled from content.js
   ========================================================================== */
(function () {
  'use strict';

  var Z = window.Zedi;
  if (!Z) return;

  Z.ready(function () {
    var h = Z.h;

    /* ------------------------------------------------------------ about */
    var aboutRoot = document.getElementById('about-root');
    if (aboutRoot) {
      var about = Z.content.about;

      if (about.intro) {
        aboutRoot.appendChild(h('section', { class: 'about-intro' },
          h('p', { class: 'about-intro__text' }, about.intro)));
      }

      var hasPerson = about.portrait || about.bio.length;
      if (hasPerson) {
        var person = h('div', { class: 'about-person' },
          about.portrait ? h('div', { class: 'about-portrait' },
            h('img', { src: about.portrait, alt: 'Portrait of ' + about.name, loading: 'lazy', decoding: 'async', width: 280, height: 322 }),
            h('span', { class: 'about-portrait__strip' })) : null,
          h('p', { class: 'about-person__name' }, about.name),
          about.role ? h('p', { class: 'z-muted' }, about.role) : null);

        aboutRoot.appendChild(h('section', { class: 'about-more', 'aria-label': 'About ' + about.name },
          h('h2', { class: 'about-heading' }, 'About'),
          h('div', { class: 'about-grid' },
            person,
            h('div', { class: 'about-bio' }, about.bio.map(function (text) { return h('p', null, text); })))));
      }

      if (about.blocks.length) {
        aboutRoot.appendChild(h('section', { class: 'about-blocks', 'aria-label': 'What ' + about.name + ' does' },
          about.blocks.map(function (block) {
            return h('div', { class: 'about-block' },
              h('h3', { class: 'about-block__title' }, block.title),
              h('ul', null, block.items.map(function (item) { return h('li', null, item); })));
          })));
      }

      if (about.press.length) {
        aboutRoot.appendChild(h('section', { 'aria-label': 'Press' },
          h('h2', { class: 'about-heading' }, 'Press'),
          h('div', { class: 'about-press' }, about.press.map(function (p) {
            var external = /^https?:/i.test(p.url);
            var title = p.url
              ? h('a', { class: 'z-link', href: p.url, target: external ? '_blank' : null, rel: external ? 'noopener' : null }, p.title)
              : h('span', null, p.title);
            return h('p', null, title, p.source ? h('span', { class: 'about-press__source' }, p.source) : null);
          }))));
      }
    }

    /* ---------------------------------------------------------- contact */
    var contactRoot = document.getElementById('contact-root');
    if (contactRoot) {
      var status = h('p', { class: 'z-sr', role: 'status', 'aria-live': 'polite' });

      // An e-mail address is copied on click (handy for webmail users); if the
      // browser will not allow that, the link simply opens the mail program.
      var copyValue = function (link, text) {
        return function (e) {
          if (!navigator.clipboard || !navigator.clipboard.writeText || link.dataset.busy) return;
          e.preventDefault();
          link.dataset.busy = '1';
          navigator.clipboard.writeText(text).then(function () {
            link.textContent = 'Copied!';
            status.textContent = text + ' copied';
            window.setTimeout(function () {
              link.textContent = text;
              status.textContent = '';
              delete link.dataset.busy;
            }, 2000);
          }, function () {
            delete link.dataset.busy;
            window.location.href = link.href;
          });
        };
      };

      var valueNode = function (row) {
        if (row.type === 'email') {
          var mail = h('a', { class: 'contact-value', href: 'mailto:' + row.value, title: 'Copy address' }, row.value);
          mail.addEventListener('click', copyValue(mail, row.value));
          return mail;
        }
        if (row.type === 'phone') {
          return h('a', { class: 'contact-value', href: 'tel:' + row.value.replace(/[^\d+]/g, '') }, row.value);
        }
        if (row.href) {
          var external = /^https?:/i.test(row.href);
          return h('a', { class: 'contact-value', href: row.href, target: external ? '_blank' : null, rel: external ? 'noopener' : null }, row.value);
        }
        return h('span', null, row.value);
      };

      var blocks = Z.content.contact.map(function (block) {
        return h('section', { class: 'contact-block' },
          h('div', { class: 'contact-block__head' },
            h('h2', { class: 'contact-block__title' }, block.title),
            block.note ? h('p', { class: 'contact-block__note' }, block.note) : null),
          h('dl', { class: 'contact-block__rows' }, block.rows.map(function (row) {
            return h('div', { class: 'contact-row' }, h('dt', null, row.label), h('dd', null, valueNode(row)));
          })));
      });

      contactRoot.appendChild(h('div', { class: 'contact-list' }, blocks, status));
    }
  });
})();
