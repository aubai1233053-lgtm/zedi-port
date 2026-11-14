/* ==========================================================================
   ZEDI — SITE CONTENT
   --------------------------------------------------------------------------
   Everything the site shows (projects, artworks, texts, contact details)
   lives in this one file. Edit it, save, refresh the browser.

   • Text goes between 'single quotes'. To use an apostrophe inside a text,
     write \' (for example 'Don\'t Look Down').
   • Keep the commas at the end of lines and the brackets as they are.
   • File paths are relative to the site folder, e.g. 'assets/video/my-film.mp4'.

   EVERYTHING BELOW IS SAMPLE CONTENT. The films, artworks, names and the
   e-mail addresses are placeholders: replace them with the real ones.
   ========================================================================== */

window.ZEDI_CONTENT = {

  /* ---------------------------------------------------------------- SITE */
  site: {
    name: 'Zedi',
    role: 'Artist & Videographer',
    // Shown by search engines and when the site is shared.
    description: 'Zedi is an artist and videographer: music videos, short films, paintings and prints.',
    // The main address people should write to (used by "Enquire" links and the footer).
    email: 'hello@example.com',
  },

  /* --------------------------------------------------------------- THEME */
  theme: {
    // 'auto'  = bright look during the day, dark look in the evening
    //           (follows the clock of each visitor).
    // 'day'   = always the bright look.   'night' = always the dark look.
    mode: 'auto',
    nightStartsAt: 19,        // 19 = 7 pm
    nightEndsAt: 7,           // 7 = 7 am
    accentDay: '#d4f70a',     // highlight colour of the bright look
    accentNight: '#1943ff',   // highlight colour of the dark look
  },

  /* ---------------------------------------------------------------- MENU */
  nav: [
    { label: 'Home',    href: 'index.html' },
    { label: 'Work',    href: 'work.html' },
    { label: 'Art',     href: 'art.html' },
    { label: 'About',   href: 'about.html' },
    { label: 'Contact', href: 'contact.html' },
  ],

  /* ----------------------------------------------------------- HOME PAGE */
  home: {
    // The tiles floating around the logo. 'auto' mixes every film and
    // artwork that has  home: true  below (20 at most). To choose the order
    // yourself, list slugs instead:  tiles: ['night-swim', 'slow-water', ...]
    // The first ones in the list sit closest to the logo.
    tiles: 'auto',
  },

  /* ------------------------------------------------------ WORK (FILMS)
     One block per film, newest first.

     slug      short name used in the page address (lower-case, dashes, unique)
     client    who it was made for (shown in CAPITALS)
     title     name of the piece
     category  shown in the "Project" filter on the Work page
     roles     what you did on it (shown in the "Role" filter)
     year      year of release
     preview   short silent loop (about 8 s, small file) for the home tiles
               and the hover preview on the Work page
     video     the full film (an .mp4 file in assets/video, or a direct
               .mp4 link from your video host)
     poster    still image shown while the film loads
     size      'small', 'medium' or 'big' tile on the home page
     home      true = show on the home page
     credits   optional extra lines for the credits list, for example
               { role: 'Producer', name: 'Someone', url: 'https://...' }
  ---------------------------------------------------------------------- */
  projects: [
    {
      slug: 'night-swim',
      client: 'The Band',
      title: 'Night Swim',
      category: 'Music Video',
      roles: ['Director', 'Editor'],
      year: 2026,
      preview: 'assets/video/placeholder-06-preview.mp4',
      video: 'assets/video/placeholder-06.mp4',
      poster: 'assets/img/posters/placeholder-06.jpg',
      size: 'small',
      home: true,
      credits: [],
    },
    {
      slug: 'paper-moons',
      client: 'Self-initiated',
      title: 'Paper Moons',
      category: 'Short Film',
      roles: ['Writer', 'Director'],
      year: 2026,
      preview: 'assets/video/placeholder-05-preview.mp4',
      video: 'assets/video/placeholder-05.mp4',
      poster: 'assets/img/posters/placeholder-05.jpg',
      size: 'small',
      home: true,
      credits: [],
    },
    {
      slug: 'soft-armor',
      client: 'The Fashion House',
      title: 'Soft Armor',
      category: 'Fashion Film',
      roles: ['Director', 'Cinematographer'],
      year: 2025,
      preview: 'assets/video/placeholder-08-preview.mp4',
      video: 'assets/video/placeholder-08.mp4',
      poster: 'assets/img/posters/placeholder-08.jpg',
      size: 'medium',
      home: true,
      credits: [],
    },
    {
      slug: 'halo-slowly',
      client: 'The Singer',
      title: 'Halo, Slowly',
      category: 'Music Video',
      roles: ['Director'],
      year: 2025,
      preview: 'assets/video/placeholder-01-preview.mp4',
      video: 'assets/video/placeholder-01.mp4',
      poster: 'assets/img/posters/placeholder-01.jpg',
      size: 'small',
      home: true,
      credits: [],
    },
    {
      slug: 'color-study-no-4',
      client: 'The Gallery',
      title: 'Color Study No. 4',
      category: 'Art Film',
      roles: ['Artist', 'Editor'],
      year: 2025,
      preview: 'assets/video/placeholder-02-preview.mp4',
      video: 'assets/video/placeholder-02.mp4',
      poster: 'assets/img/posters/placeholder-02.jpg',
      size: 'small',
      home: true,
      credits: [],
    },
    {
      slug: 'sunday-people',
      client: 'The Magazine',
      title: 'Sunday People',
      category: 'Documentary',
      roles: ['Cinematographer'],
      year: 2025,
      preview: 'assets/video/placeholder-10-preview.mp4',
      video: 'assets/video/placeholder-10.mp4',
      poster: 'assets/img/posters/placeholder-10.jpg',
      size: 'small',
      home: true,
      credits: [],
    },
    {
      slug: 'low-sun',
      client: 'The Record Label',
      title: 'Low Sun',
      category: 'Music Video',
      roles: ['Director', 'Colorist'],
      year: 2024,
      preview: 'assets/video/placeholder-03-preview.mp4',
      video: 'assets/video/placeholder-03.mp4',
      poster: 'assets/img/posters/placeholder-03.jpg',
      size: 'small',
      home: true,
      credits: [],
    },
    {
      slug: 'morning-ritual',
      client: 'The Brand',
      title: 'Morning Ritual',
      category: 'Commercial',
      roles: ['Director'],
      year: 2024,
      preview: 'assets/video/placeholder-07-preview.mp4',
      video: 'assets/video/placeholder-07.mp4',
      poster: 'assets/img/posters/placeholder-07.jpg',
      size: 'small',
      home: true,
      credits: [],
    },
    {
      slug: 'salt-road',
      client: 'Self-initiated',
      title: 'Salt Road',
      category: 'Documentary',
      roles: ['Director', 'Cinematographer'],
      year: 2024,
      preview: 'assets/video/placeholder-12-preview.mp4',
      video: 'assets/video/placeholder-12.mp4',
      poster: 'assets/img/posters/placeholder-12.jpg',
      size: 'small',
      home: true,
      credits: [],
    },
    {
      slug: 'velvet-signal',
      client: 'The Producer',
      title: 'Velvet Signal',
      category: 'Music Video',
      roles: ['Editor', 'Colorist'],
      year: 2024,
      preview: 'assets/video/placeholder-04-preview.mp4',
      video: 'assets/video/placeholder-04.mp4',
      poster: 'assets/img/posters/placeholder-04.jpg',
      size: 'small',
      home: true,
      credits: [],
    },
    {
      slug: 'lemon-light',
      client: 'The Studio',
      title: 'Lemon Light',
      category: 'Commercial',
      roles: ['Director', 'Editor'],
      year: 2023,
      preview: 'assets/video/placeholder-09-preview.mp4',
      video: 'assets/video/placeholder-09.mp4',
      poster: 'assets/img/posters/placeholder-09.jpg',
      size: 'small',
      home: true,
      credits: [],
    },
    {
      slug: 'hands-mostly',
      client: 'Self-initiated',
      title: 'Hands, Mostly',
      category: 'Short Film',
      roles: ['Director', 'Cinematographer', 'Editor'],
      year: 2023,
      preview: 'assets/video/placeholder-11-preview.mp4',
      video: 'assets/video/placeholder-11.mp4',
      poster: 'assets/img/posters/placeholder-11.jpg',
      size: 'small',
      home: true,
      credits: [],
    },
  ],

  /* ------------------------------------------------------------- ART
     One block per artwork.

     slug        short unique name (lower-case, dashes)
     title       name of the piece
     year        year it was made
     medium      for example 'Acrylic on canvas'
     dimensions  for example '80 × 100 cm'  (leave '' if not needed)
     image       the large picture (about 1800 px on the long side)
     thumb       a smaller copy for the grid (about 720 px); can be the
                 same file as image
     width / height   size of the large picture in pixels
     size        tile size on the Art page: 'big', 'medium' or 'small'.
                 A row is 5 units wide: big = 3, medium = 2, small = 1,
                 so "big + medium" or "medium + big" fills a row.
     status      optional note such as 'Available', 'Sold', 'Private collection'
     home        true = also float it on the home page
  ---------------------------------------------------------------------- */
  art: [
    {
      slug: 'paper-weather', title: 'Paper Weather', year: 2026,
      medium: 'Cut paper collage', dimensions: '40 × 50 cm',
      image: 'assets/img/art/art-placeholder-01.webp', thumb: 'assets/img/art/art-placeholder-01-sm.webp',
      width: 1440, height: 1800, size: 'big', status: '', home: true,
    },
    {
      slug: 'slow-water', title: 'Slow Water', year: 2026,
      medium: 'Ink marbling on paper', dimensions: '50 × 50 cm',
      image: 'assets/img/art/art-placeholder-02.webp', thumb: 'assets/img/art/art-placeholder-02-sm.webp',
      width: 1800, height: 1800, size: 'medium', status: '', home: true,
    },
    {
      slug: 'half-past-orange', title: 'Half Past Orange', year: 2025,
      medium: 'Acrylic on canvas', dimensions: '120 × 80 cm',
      image: 'assets/img/art/art-placeholder-03.webp', thumb: 'assets/img/art/art-placeholder-03-sm.webp',
      width: 1800, height: 1200, size: 'medium', status: '', home: false,
    },
    {
      slug: 'raw-signal', title: 'Raw Signal', year: 2025,
      medium: 'Acrylic on unprimed canvas', dimensions: '120 × 150 cm',
      image: 'assets/img/art/art-placeholder-04.webp', thumb: 'assets/img/art/art-placeholder-04-sm.webp',
      width: 1440, height: 1800, size: 'big', status: '', home: true,
    },
    {
      slug: 'soft-overlap', title: 'Soft Overlap', year: 2025,
      medium: 'Risograph print', dimensions: '28 × 42 cm',
      image: 'assets/img/art/art-placeholder-05.webp', thumb: 'assets/img/art/art-placeholder-05-sm.webp',
      width: 1200, height: 1800, size: 'big', status: '', home: false,
    },
    {
      slug: 'warm-lamp', title: 'Warm Lamp', year: 2024,
      medium: 'Airbrushed acrylic on panel', dimensions: '60 × 60 cm',
      image: 'assets/img/art/art-placeholder-06.webp', thumb: 'assets/img/art/art-placeholder-06-sm.webp',
      width: 1800, height: 1800, size: 'medium', status: '', home: true,
    },
    {
      slug: 'night-current', title: 'Night Current', year: 2024,
      medium: 'Plotter drawing, ink on black paper', dimensions: '64 × 40 cm',
      image: 'assets/img/art/art-placeholder-07.webp', thumb: 'assets/img/art/art-placeholder-07-sm.webp',
      width: 1800, height: 1125, size: 'medium', status: '', home: false,
    },
    {
      slug: 'dot-eclipse', title: 'Dot Eclipse', year: 2024,
      medium: 'Screenprint on paper', dimensions: '40 × 50 cm',
      image: 'assets/img/art/art-placeholder-08.webp', thumb: 'assets/img/art/art-placeholder-08-sm.webp',
      width: 1440, height: 1800, size: 'big', status: '', home: true,
    },
    {
      slug: 'quiet-static', title: 'Quiet Static', year: 2023,
      medium: 'Charcoal on paper', dimensions: '45 × 60 cm',
      image: 'assets/img/art/art-placeholder-09.webp', thumb: 'assets/img/art/art-placeholder-09-sm.webp',
      width: 1350, height: 1800, size: 'medium', status: '', home: false,
    },
    {
      slug: 'private-signals', title: 'Private Signals', year: 2023,
      medium: 'Oil pastel and acrylic on paper', dimensions: '70 × 70 cm',
      image: 'assets/img/art/art-placeholder-10.webp', thumb: 'assets/img/art/art-placeholder-10-sm.webp',
      width: 1800, height: 1800, size: 'big', status: '', home: true,
    },
  ],

  /* --------------------------------------------------------------- ABOUT */
  about: {
    // The short statement in the middle of the About page.
    intro: 'Zedi is an artist and videographer working between the moving image and the still one: music videos, short films, paintings and prints.',

    portrait: 'assets/img/portrait-placeholder.webp',
    name: 'Zedi',
    role: 'Artist & Videographer',

    // One text per paragraph.
    bio: [
      'Zedi works across film and visual art, directing, shooting and cutting moving image, and making paintings, drawings and prints alongside it.',
      'The two practices feed each other: the color and rhythm of the studio work find their way into the films, and the films find their way back into the studio.',
    ],

    // Three short lists under the bio. Add, remove or rename freely.
    blocks: [
      { title: 'Film',          items: ['Direction', 'Cinematography', 'Editing', 'Color grading'] },
      { title: 'Art',           items: ['Painting', 'Drawing', 'Printmaking', 'Commissions'] },
      { title: 'Available for', items: ['Music videos', 'Short films', 'Commercials', 'Fashion films', 'Exhibitions'] },
    ],

    // Optional. Leave the list empty [] to hide the section.
    // Example: { title: 'Name of the article', source: 'Magazine', url: 'https://...' }
    press: [],
  },

  /* ------------------------------------------------------------- CONTACT
     One block per group on the Contact page.
     type: 'email'  = clicking copies the address
     type: 'phone'  = opens the dialler on phones
     type: 'link'   = opens  href  in a new tab
     The first 'link' in this list is also shown in the footer strip.
  ---------------------------------------------------------------------- */
  contact: [
    {
      title: 'Bookings',
      note: 'Film, video and commercial projects',
      rows: [
        { label: 'E-mail', value: 'hello@example.com', type: 'email' },
      ],
    },
    {
      title: 'Art',
      note: 'Commissions, prints and exhibitions',
      rows: [
        { label: 'E-mail', value: 'studio@example.com', type: 'email' },
      ],
    },
    {
      title: 'Social',
      note: 'Follow the work',
      rows: [
        { label: 'Instagram', value: '@yourhandle', type: 'link', href: 'https://www.instagram.com/' },
        { label: 'Vimeo',     value: 'vimeo.com/yourhandle', type: 'link', href: 'https://vimeo.com/' },
        { label: 'YouTube',   value: 'youtube.com/@yourhandle', type: 'link', href: 'https://www.youtube.com/' },
      ],
    },
  ],
};
