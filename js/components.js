'use strict';

/* ── DOM & URL Sanitization Utilities (XSS Protection) ── */
window.sanitizeText = function (str) {
  if (!str) return '';
  // Strip HTML tags using a secure regex that preserves math operators (<, >) and emoticons
  const stripped = str.toString().replace(/<[a-zA-Z\/][^>]*>/g, '');
  // Escape HTML characters
  return stripped
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

window.sanitizeUrl = function (url) {
  if (!url) return '';
  const trimmed = url.toString().trim();
  // Prevent javascript: protocol links
  if (/^javascript:/i.test(trimmed)) return '#';
  return window.sanitizeText(trimmed);
};

window.resolveUrl = function (url) {
  if (window.location.protocol === 'file:') {
    return url;
  }
  if (!url) return '';
  
  let urlStr = typeof url === 'string' ? url : url.toString();
  
  if (
    urlStr.startsWith('mailto:') ||
    urlStr.startsWith('tel:') ||
    (urlStr.includes('://') && !urlStr.includes(window.location.host))
  ) {
    return urlStr;
  }

  try {
    const isAbsolute = urlStr.includes('://');
    const base = window.location.origin;
    const parsed = new URL(urlStr, base);
    
    let pathname = parsed.pathname;
    if (pathname.endsWith('index.html')) {
      pathname = pathname.slice(0, -10);
    } else if (pathname.endsWith('.html')) {
      pathname = pathname.slice(0, -5);
    }
    
    const resolved = pathname + parsed.search + parsed.hash;
    return isAbsolute ? window.location.origin + resolved : resolved;
  } catch (err) {
    let resolved = urlStr;
    if (resolved.includes('index.html')) {
      resolved = resolved.replace('index.html', '');
    } else if (resolved.includes('.html')) {
      resolved = resolved.replace('.html', '');
    }
    return resolved;
  }
};


// Preload critical nav logo immediately
const _logoPl = document.createElement('link');
_logoPl.rel = 'preload';
_logoPl.as = 'image';
_logoPl.href = 'images/sap logo only.webp';
document.head.appendChild(_logoPl);

/* ── Injected HTML Sprite Sheet for SVG Icons ── */
function injectSvgSpriteSheet() {
  if (document.getElementById('svgSpriteSheet')) return;
  const sheet = document.createElement('div');
  sheet.id = 'svgSpriteSheet';
  sheet.className = 'hidden';
  sheet.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true" focusable="false">
            <symbol id="icon-font" viewBox="0 0 24 24"><path d="M9.93 13.5h4.14L12 7.98 9.93 13.5zM20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-4.05 16.5l-1.14-3H9.17l-1.12 3H5.96l5.11-13h1.86l5.11 13h-2.09z"/></symbol>
      <symbol id="icon-text-size" viewBox="0 0 24 24"><path d="M9 4v3h5v12h3V7h5V4H9zm-6 8h3v7h3v-7h3V9H3v3z"/></symbol>
      <symbol id="icon-palette" viewBox="0 0 24 24"><path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10c1.38 0 2.5-1.12 2.5-2.5 0-.61-.23-1.21-.64-1.67-.08-.09-.13-.21-.13-.33 0-.28.22-.5.5-.5H16c3.31 0 6-2.69 6-6 0-4.96-4.49-9-10-9zm5.5 11c-.83 0-1.5-.67-1.5-1.5S16.67 10 17.5 10s1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm-3-4c-.83 0-1.5-.67-1.5-1.5S13.67 6 14.5 6s1.5.67 1.5 1.5S15.33 9 14.5 9zm-5 0c-.83 0-1.5-.67-1.5-1.5S8.67 6 9.5 6s1.5.67 1.5 1.5S10.33 9 9.5 9zm-3 4c-.83 0-1.5-.67-1.5-1.5S6.67 10 7.5 10s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></symbol>
      <symbol id="icon-eye" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></symbol>
<symbol id="icon-book" viewBox="0 0 24 24"><path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1z"/></symbol>
      <symbol id="icon-info" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></symbol>
      <symbol id="icon-people" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></symbol>
      <symbol id="icon-edit" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></symbol>
      <symbol id="icon-coffee" viewBox="0 0 24 24"><path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.11 0 2-.89 2-2V5c0-1.11-.89-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z"/></symbol>
      <symbol id="icon-cal" viewBox="0 0 24 24"><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></symbol>
      <symbol id="icon-mail" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></symbol>
      <symbol id="icon-cart" viewBox="0 0 24 24"><path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96C5 16.1 6.9 18 9 18h12v-2H9.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63H19c.75 0 1.41-.41 1.75-1.03l3.58-6.49A1 1 0 0023.45 5H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z"/></symbol>
      <symbol id="icon-burger" viewBox="0 0 24 24"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></symbol>
      <symbol id="icon-search" viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5z"/></symbol>
      <symbol id="icon-sun" viewBox="0 0 24 24"><path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z"/></symbol>
      <symbol id="icon-moon" viewBox="0 0 24 24"><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 01-4.4 2.26 5.403 5.403 0 01-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></symbol>
      <symbol id="icon-up" viewBox="0 0 24 24"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></symbol>
      <symbol id="icon-filter" viewBox="0 0 24 24"><path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></symbol>
      <symbol id="icon-chevron" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z"/></symbol>
      <symbol id="icon-chevron-up" viewBox="0 0 24 24"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></symbol>
      <symbol id="icon-document" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></symbol>
      <symbol id="icon-send" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></symbol>
      <symbol id="icon-check" viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></symbol>
      <symbol id="icon-delivery" viewBox="0 0 24 24"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm12 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></symbol>
      <symbol id="icon-facebook" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></symbol>
      <symbol id="icon-instagram" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051c-.059 1.28-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></symbol>
      <symbol id="icon-phone" viewBox="0 0 24 24"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></symbol>
      <symbol id="icon-qr" viewBox="0 0 24 24"><path d="M2,2H10V10H2V2M4,4V8H8V4H4M14,2H22V10H14V2M16,4V8H20V4H16M2,14H10V22H2V14M4,16V20H8V16H4M14,14H16V16H14V14M16,16H18V18H16V16M18,14H20V16H18V14M20,16H22V18H20V16M14,18H16V20H14V18M16,20H18V22H16V20M18,18H20V20H18V18M20,20H22V22H20V20" fill="currentColor"/></symbol>
      <symbol id="icon-pin" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></symbol>
      <symbol id="icon-chat" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></symbol>
      <symbol id="icon-chevron-right" viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></symbol>
      <symbol id="icon-star" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></symbol>
      <symbol id="icon-share" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></symbol>
      <symbol id="icon-volume" viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></symbol>
      <symbol id="icon-delete" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></symbol>
      <symbol id="icon-heart" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></symbol>
      <symbol id="icon-reply" viewBox="0 0 24 24"><path d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z"/></symbol>
      <symbol id="icon-kebab" viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></symbol>
      <symbol id="icon-settings" viewBox="0 0 24 24"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></symbol>
    </svg>
  `;
  document.body.insertBefore(sheet, document.body.firstChild);
}

const _icon = (name) =>
  `<svg class="icon icon-${name}" aria-hidden="true" focusable="false"><use href="#icon-${name}"></use></svg>`;
const _bmIcon = (name) =>
  `<svg class="icon bm-icon icon-${name}" aria-hidden="true" focusable="false"><use href="#icon-${name}"></use></svg>`;

const _NAV_ITEMS = [
  {
    section: 'Catalog',
    items: [
      {
        key: 'catalog',
        label: 'Our Publications',
        icon: 'book',
        href: 'index.html',
      },
    ],
  },
  {
    section: 'About',
    items: [
      { key: 'about', label: 'About Us', icon: 'info', href: 'about.html' },
      { key: 'team', label: 'Our Team', icon: 'people', href: 'team.html' },
      { key: 'authors', label: 'Authors', icon: 'edit', href: 'authors.html' },
    ],
  },
  {
    section: 'Community',
    items: [
      { key: 'news', label: 'News', icon: 'coffee', href: 'news.html' },
      { key: 'events', label: 'Events', icon: 'cal', href: 'events.html' },
      {
        key: 'contact',
        label: 'Contact Us',
        icon: 'mail',
        href: 'contact.html',
      },
      { key: 'order', label: 'How to Order', icon: 'cart', href: 'order.html' },
    ],
  },
];

const _NAV_ITEMS_TRANSLATIONS = {
  en: {
    Catalog: 'Catalog',
    About: 'About',
    Community: 'Community',
    catalog: 'Our Publications',
    about: 'About Us',
    team: 'Our Team',
    authors: 'Authors',
    news: 'News',
    events: 'Events',
    contact: 'Contact Us',
    order: 'How to Order',
  },
  fil: {
    Catalog: 'Katalogo',
    About: 'Tungkol',
    Community: 'Komunidad',
    catalog: 'Mga Publikasyon',
    about: 'Tungkol sa Amin',
    team: 'Ang Koponan',
    authors: 'Mga May-akda',
    news: 'Balita',
    events: 'Mga Kaganapan',
    contact: 'Makipag-ugnayan',
    order: 'Paano Umorder',
  },
};

/* ── Inject Navigation & Set Up DOM Bindings ── */
function injectNav(activePage) {
  injectSvgSpriteSheet();
  const container = document.getElementById('navContainer');
  if (!container) return;

  if (activePage === 'catalog' || activePage === 'authors') {
    document.body.classList.add('has-bottom-search');
  }

  // Burger backdrop
  const backdrop = document.createElement('div');
  backdrop.className = 'burger-backdrop';
  backdrop.id = 'burgerBackdrop';

  // Burger menu
  const lang = document.body.dataset.lang || 'en';
  const prefix = lang === 'en' ? '' : `/${lang}`;
  const dict = _NAV_ITEMS_TRANSLATIONS[lang] || _NAV_ITEMS_TRANSLATIONS.en;

  let burgerHTML = '';
  _NAV_ITEMS.forEach((group) => {
    const sectionLabel = dict[group.section] || group.section;
    burgerHTML += `<div class="bm-section">${sectionLabel}</div>`;
    group.items.forEach((item) => {
      const active = item.key === activePage ? ' active' : '';
      const itemLabel = dict[item.key] || item.label;
      const href = window.resolveUrl(prefix ? `${prefix}/${item.href}` : item.href);
      burgerHTML += `<a class="bm-btn${active}" href="${href}">${_bmIcon(item.icon)} ${itemLabel}</a>`;
    });
  });

  const burgerMenu = document.createElement('nav');
  burgerMenu.className = 'burger-menu';
  burgerMenu.id = 'burgerMenu';
  burgerMenu.setAttribute('aria-label', 'Main navigation');
  burgerMenu.setAttribute('aria-hidden', 'true');
  burgerMenu.innerHTML = burgerHTML;

  // Cart Backdrop
  const cartBackdrop = document.createElement('div');
  cartBackdrop.className = 'cart-backdrop';
  cartBackdrop.id = 'cartBackdrop';

  // Cart Drawer
  const cartDrawer = document.createElement('div');
  cartDrawer.className = 'cart-drawer';
  cartDrawer.id = 'cartDrawer';
  cartDrawer.setAttribute('role', 'dialog');
  cartDrawer.setAttribute('aria-modal', 'true');
  cartDrawer.setAttribute('aria-hidden', 'true');
  cartDrawer.innerHTML = `
    <div class="cart-header">
      <h2 class="cart-title">Your Order Cart</h2>
      <button class="cart-close-btn" id="cartCloseBtn" aria-label="Close cart">×</button>
    </div>
    <div class="cart-body" id="cartItemsList"></div>
    
    <!-- Checkout Details Form -->
    <div class="cart-body hidden" id="cartCheckoutForm">
      <h3 class="checkout-title">Delivery &amp; Payment Details</h3>
      <div class="checkout-field">
        <label for="coName" class="checkout-label">Full Name</label>
        <input type="text" id="coName" class="checkout-input" placeholder="e.g. Juan dela Cruz" required autocomplete="name" oninput="this.classList.remove('invalid')">
        <div class="field-error-msg" id="errName">Please enter your full name.</div>
      </div>
      <div class="checkout-field">
        <label for="coPhone" class="checkout-label">Phone Number</label>
        <input type="tel" id="coPhone" class="checkout-input" placeholder="e.g. 09171234567" required autocomplete="tel" oninput="this.classList.remove('invalid')">
        <div class="field-error-msg" id="errPhone">Please enter a valid phone number.</div>
      </div>
      <div class="checkout-field">
        <label for="coEmail" class="checkout-label">Email Address</label>
        <input type="email" id="coEmail" class="checkout-input" placeholder="e.g. juan@gmail.com" required autocomplete="email" oninput="this.classList.remove('invalid')">
        <div class="field-error-msg" id="errEmail">Please enter a valid email address.</div>
      </div>
      <div class="checkout-field">
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:0.25rem;">
          <label for="coAddress" class="checkout-label" style="margin-bottom:0;">Delivery Address</label>
          <button type="button" class="btn-text-sm" id="btnUseLocation" style="font-size: 0.7rem; color: var(--terra); display: flex; align-items: center; gap: 0.2rem; background: none; border: none; cursor: pointer; padding: 0;">
            <svg class="icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>
            Use My Location
          </button>
        </div>
        <textarea id="coAddress" class="checkout-input" placeholder="e.g. 123 Rizal St, Brgy. Central, Quezon City" rows="2" required autocomplete="street-address" oninput="this.classList.remove('invalid')"></textarea>
        <div class="field-error-msg" id="errAddress">Please enter your delivery address.</div>
      </div>
      <div class="checkout-field">
        <label class="checkout-label">Payment Method</label>
        <div class="cs-wrap" id="coPaymentWrap">
          <button type="button" class="cs-btn" id="coPaymentBtn" aria-expanded="false">
            <span id="coPaymentLabel">Select Payment Option</span>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M7 10l5 5 5-5z"/></svg>
          </button>
          <div class="cs-opts" id="coPaymentOpts" role="listbox">
            <div class="cs-opt" data-value="GCash" role="option">GCash</div>
            <div class="cs-opt" data-value="Bank Transfer" role="option">Bank Transfer</div>
            <div class="cs-opt" data-value="Cash" role="option">Cash</div>
          </div>
          <input type="hidden" id="coPayment" required>
        </div>
      </div>
      <div class="back-link-row">
        <button type="button" class="back-to-cart-btn" id="backToCartBtn">
          &larr; Back to Review Cart
        </button>
      </div>
    </div>

    <!-- Success Screen -->
    <div class="cart-body hidden" id="cartSuccessScreen">
      <div class="success-icon-wrap">
        ${_icon('check')}
      </div>
      <h3 class="success-title">Order Slip Copied!</h3>
      <p class="success-desc">
        We have copied your order details to your clipboard. Click the button below to paste and send it to us on Facebook Messenger to finalize your order.
      </p>
      <a href="https://m.me/sananselmopress" target="_blank" rel="noopener" class="btn-primary w-100 flex-center" id="successMsgBtn">
        Open Facebook Messenger
      </a>
      <button class="back-to-cart-btn" id="successBackBtn">
        Back to Cart
      </button>
    </div>

    <div class="cart-footer" id="cartFooter">
      <div class="cart-total-row">
        <span>Total Price:</span>
        <span class="cart-total-price" id="cartTotalVal">₱0</span>
      </div>
      <button id="cartCheckoutBtn" class="btn-primary cart-checkout-btn w-100 flex-center">
        Checkout via Messenger
      </button>
    </div>`;

  // Topbar
  const topbar = document.createElement('header');
  topbar.className = 'topbar';
  topbar.id = 'topbar';
  topbar.setAttribute('role', 'banner');

  const homeHref = window.resolveUrl(prefix ? `${prefix}/index.html` : 'index.html');
  const logoSrc = '/images/sap logo only.webp';

  const searchTooltip =
    activePage === 'authors'
      ? lang === 'fil'
        ? 'Maghanap ng May-akda'
        : 'Search Author'
      : lang === 'fil'
        ? 'Maghanap sa Katalogo'
        : 'Search Catalog';
  const cartTooltip = lang === 'fil' ? 'Iyong Cart' : 'Your Cart';
  const themeTooltip = lang === 'fil' ? 'Dark Mode' : 'Dark Mode';

  topbar.innerHTML = `
    <div class="scroll-progress" id="scrollProgress"></div>
    <button class="topbar-burger" id="burgerBtn" aria-label="Open navigation" aria-expanded="false">
      ${_icon('burger')}
    </button>
    <a class="topbar-center" href="${homeHref}" aria-label="San Anselmo Publications home">
      <img src="${logoSrc}" class="topbar-logo" alt="SAP Logo" id="topbarLogoImg" width="32" height="32" decoding="async">
      <div class="topbar-logo-fallback hidden" id="topbarLogoFallback" aria-hidden="true">S</div>
      <span class="topbar-center-name">San Anselmo Publications</span>
    </a>

    <div class="topbar-right">
      <button class="tb-icon pos-relative" id="cartToggleBtn" aria-label="Shopping Cart">
        ${_icon('cart')}
        <span class="cart-badge hidden" id="cartBadge">0</span>
        <span class="tb-tooltip">${cartTooltip}</span>
      </button>
      <button class="tb-icon pos-relative" id="settingsToggleBtn" aria-label="Settings" aria-expanded="false">
        ${_icon('settings')}
        <span class="tb-tooltip">Settings</span>
      </button>
    </div>`;

  // Settings Backdrop
  const settingsBackdrop = document.createElement('div');
  settingsBackdrop.className = 'settings-backdrop';
  settingsBackdrop.id = 'settingsBackdrop';
  
  // Settings Panel
  const settingsPanel = document.createElement('div');
  settingsPanel.className = 'settings-panel';
  settingsPanel.id = 'settingsPanel';
  settingsPanel.setAttribute('role', 'dialog');
  settingsPanel.setAttribute('aria-modal', 'true');
  settingsPanel.setAttribute('aria-labelledby', 'settingsTitle');
  settingsPanel.style.display = 'none';

  const settingsTitleText = lang === 'fil' ? 'Mga Setting' : 'Settings';
  const displayTitleText = lang === 'fil' ? 'Tampok' : 'Display';
  const darkModeLabel = lang === 'fil' ? 'Madilim na Tema' : 'Dark Mode';
  const a11yTitleText = lang === 'fil' ? 'Akseso' : 'Accessibility';

  settingsPanel.innerHTML = `
    <div class="settings-header">
      <h3 id="settingsTitle">${settingsTitleText}</h3>
      <button class="settings-close-btn" id="settingsCloseBtn" aria-label="Close Settings">×</button>
    </div>
    <div class="settings-body">
      <div class="settings-section">
        <h4 class="settings-section-title">${displayTitleText}</h4>
        <div class="settings-row">
          <span>${darkModeLabel}</span>
          <button class="a11y-btn" id="panelThemeToggleBtn" aria-label="Toggle dark mode">
            <span id="panelThemeToggleLabel">Off</span>
          </button>
        </div>
      </div>
      <div class="settings-section">
        <button id="a11yAccordionTrigger" aria-expanded="false" aria-controls="a11yAccordionContent">
          <h4 class="settings-section-title">${a11yTitleText}</h4>
          <svg class="accordion-chevron" viewBox="0 0 24 24" width="16" height="16">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </button>
        <div id="a11yAccordionContent">
          <div class="a11y-options-grid">
            <div class="a11y-option-group">
              <span class="a11y-group-label">${lang === 'fil' ? 'Estilo ng Font' : 'Font Style'}</span>
              <div class="a11y-buttons-row">
                <button class="a11y-btn" data-a11y-font="default">Sans-Serif</button>
                <button class="a11y-btn" data-a11y-font="serif">Book Serif</button>
                <button class="a11y-btn" data-a11y-font="dyslexic">Dyslexia-Aid</button>
              </div>
            </div>
            <div class="a11y-option-group">
              <span class="a11y-group-label">${lang === 'fil' ? 'Laki ng Teksto' : 'Text Size'}</span>
              <div class="a11y-buttons-row">
                <button class="a11y-btn" data-a11y-size="default">Default</button>
                <button class="a11y-btn" data-a11y-size="large">Large</button>
                <button class="a11y-btn" data-a11y-size="extra">Extra Large</button>
              </div>
            </div>
            <div class="a11y-option-group">
              <span class="a11y-group-label">${lang === 'fil' ? 'Gabay sa Pagbasa' : 'Reading Aids'}</span>
              <div class="a11y-checkboxes-list">
                <button class="a11y-btn w-100" id="a11yToggleLinks">${lang === 'fil' ? 'I-highlight ang Links' : 'Highlight Links'}</button>
                <button class="a11y-btn w-100" id="a11yToggleSpacing">${lang === 'fil' ? 'Malawak na Spacing' : 'Wide Spacing'}</button>
                <button class="a11y-btn w-100" id="a11yToggleCursor">${lang === 'fil' ? 'Malaking Cursor' : 'Large Cursor'}</button>
                <button class="a11y-btn w-100" id="a11yToggleRuler">${lang === 'fil' ? 'Gabay sa Pagbasa' : 'Reading Guide'}</button>
              </div>
            </div>
            <div class="a11y-option-group">
              <span class="a11y-group-label">${lang === 'fil' ? 'Mga Tunog at Animasyon' : 'Audio & Motion'}</span>
              <div class="a11y-checkboxes-list">
                <button class="a11y-btn w-100" id="a11yToggleAudio">${lang === 'fil' ? 'Kumpirmasyon ng Tunog' : 'Audio Confirmation'}</button>
                <button class="a11y-btn w-100" id="a11yToggleMotion">${lang === 'fil' ? 'Bawasan ang Animasyon' : 'Reduce Motion'}</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="settings-footer" style="margin-top: 0.5rem; border-top: 1px solid var(--ash); padding-top: 0.8rem; display: flex; justify-content: flex-end;">
        <button class="a11y-btn" id="a11yResetBtn" style="font-size: var(--fs-xs); font-weight:600; padding: 0.4rem 0.8rem; border: 1px solid var(--terra); color: var(--terra); background: transparent; border-radius: var(--radius-sm); cursor:pointer;">
          ${lang === 'fil' ? 'I-reset ang mga Setting' : 'Reset Settings'}
        </button>
      </div>
    </div>
  `;

  container.appendChild(backdrop);
  container.appendChild(burgerMenu);
  container.appendChild(cartBackdrop);
  container.appendChild(cartDrawer);
  container.appendChild(settingsBackdrop);
  container.appendChild(settingsPanel);
  container.appendChild(topbar);

  // Render unified topbar-search persistently in the catalog page body
  if (activePage === 'catalog') {
    const searchPanel = document.createElement('div');
    searchPanel.className = 'topbar-search';
    searchPanel.setAttribute('role', 'search');

    let filterDropdownHTML = '';
    if (activePage === 'catalog') {
      filterDropdownHTML = `
      <div class="filter-wrap">
        <button class="tb-icon" id="filterBtn" aria-label="Filters" aria-expanded="false">
          ${_icon('filter')}
          <span class="tb-tooltip">Search Filters</span>
        </button>
        <div class="filter-dropdown" id="filterDropdown">
          <div class="f-row">
            <label>Year</label>
            <div class="cs-wrap">
              <button class="cs-btn" id="yearBtn" aria-expanded="false">
                <span id="yearLabel">All Years</span>
                ${_icon('chevron')}
              </button>
              <div class="cs-opts" id="yearOpts" role="listbox"></div>
            </div>
          </div>
          <div class="f-row">
            <label>Sort By</label>
            <div class="cs-wrap">
              <button class="cs-btn" id="sortBtn" aria-expanded="false">
                <span id="sortLabel">Newest</span>
                ${_icon('chevron')}
              </button>
              <div class="cs-opts" id="sortOpts" role="listbox">
                <div class="cs-opt" data-sort="newest">Newest</div>
                <div class="cs-opt" data-sort="price-asc">Price: Low to High</div>
                <div class="cs-opt" data-sort="price-desc">Price: High to Low</div>
                <div class="cs-opt" data-sort="title-asc">Title: A-Z</div>
              </div>
            </div>
          </div>
          <div class="f-row">
            <label>Price Range (₱)</label>
            <div class="f-price-inputs" style="display:flex; gap:0.5rem; align-items:center;">
              <input type="number" id="minPrice" placeholder="Min" class="f-price-input" min="0" style="width:75px; padding:0.3rem; border:1px solid var(--border); border-radius:4px; background:var(--bg-card); color:var(--text);">
              <span style="color:var(--text-muted); font-size:0.9rem;">to</span>
              <input type="number" id="maxPrice" placeholder="Max" class="f-price-input" min="0" style="width:75px; padding:0.3rem; border:1px solid var(--border); border-radius:4px; background:var(--bg-card); color:var(--text);">
            </div>
          </div>
          <button class="f-reset" id="resetFiltersBtn">Reset All</button>
        </div>
      </div>`;
    }

    let genreDropdownHTML = '';
    if (activePage === 'catalog') {
      genreDropdownHTML = `
        <div class="cs-wrap">
          <button class="cs-btn" id="genreSearchBtn" aria-expanded="false">
            <span class="genre-btn-text" id="genreSearchLabel">All Genres</span>
            ${_icon('chevron')}
          </button>
          <div class="cs-opts" id="genreSearchOpts" role="listbox">
            <div class="cs-opt" data-genre="All">All Genres</div>
            <div class="cs-opt" data-genre="Anthology">Anthology</div>
            <div class="cs-opt" data-genre="Biography">Biography</div>
            <div class="cs-opt" data-genre="Children's Literature">Children's Literature</div>
            <div class="cs-opt" data-genre="Fiction">Fiction</div>
            <div class="cs-opt" data-genre="General Reference">General Reference</div>
            <div class="cs-opt" data-genre="Inspirational">Inspirational</div>
            <div class="cs-opt" data-genre="Journal">Journal</div>
            <div class="cs-opt" data-genre="Non-Fiction">Non-Fiction</div>
            <div class="cs-opt" data-genre="Poetry">Poetry</div>
          </div>
        </div>
        <span></span>
      `;
    }

    searchPanel.innerHTML = `
      ${genreDropdownHTML}
      ${_icon('search')}
      <input type="search" id="searchInput" placeholder="Search for titles and authors here..." autocomplete="off" aria-label="Search publications">
      <button class="clear-btn" id="clearBtn" aria-label="Clear search" style="display:none">×</button>
      ${filterDropdownHTML}
      <div class="search-predictions" id="searchPreds" role="listbox"></div>
    `;

    // Append directly in the page flow body
    if (activePage === 'catalog') {
      const grid = document.getElementById('catalogGrid');
      if (grid && grid.parentNode) {
        const searchRow = document.createElement('div');
        const countLabel = document.createElement('span');
        countLabel.id = 'searchTotalCount';
        countLabel.textContent = '0 titles';
        
        searchRow.appendChild(searchPanel);
        searchRow.appendChild(countLabel);
        grid.parentNode.insertBefore(searchRow, grid);
      }
    }
  }

  // Inject Privacy Policy Modal
  const privacyModal = document.createElement('dialog');
  privacyModal.className = 'modal-overlay';
  privacyModal.id = 'privacyModal';
  privacyModal.setAttribute('aria-labelledby', 'pmTitle');
  privacyModal.innerHTML = `
    <article class="modal-card max-width-600">
      <div class="modal-close"><button class="modal-close-btn" id="privacyCloseBtn" aria-label="Close">×</button></div>
      <div class="modal-body">
        <div class="policy-header">
          <div class="policy-icon-wrap">
            <svg class="icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="currentColor" style="width:24px;height:24px;">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
          </div>
          <div class="policy-title-container">
            <h2 class="policy-title" id="pmTitle">Privacy Policy</h2>
            <span class="policy-badge">Last Updated: June 2026</span>
          </div>
        </div>

        <div class="policy-scroll-area">
          <details class="policy-section" open>
            <summary class="policy-sec-title">
              <span class="policy-sec-title-left">
                ${_icon('document')}
                <span>1. Information Collected</span>
              </span>
              <span class="accordion-icon">${_icon('chevron')}</span>
            </summary>
            <div class="policy-sec-content">
              <p class="policy-sec-text">We do not collect personal identifying information when you browse. The shopping cart stores selected titles locally on your browser using localStorage. When you choose to check out, shipping details are requested solely to generate a copyable checkout message for Facebook Messenger and are not saved on any database server.</p>
            </div>
          </details>
          <details class="policy-section">
            <summary class="policy-sec-title">
              <span class="policy-sec-title-left">
                ${_icon('share')}
                <span>2. External Widgets &amp; Cookies</span>
              </span>
              <span class="accordion-icon">${_icon('chevron')}</span>
            </summary>
            <div class="policy-sec-content">
              <p class="policy-sec-text">We use Google Sheets CSV API as a database source. We also render Facebook content and maps. These third-party plugins may place cookies or access your IP address as necessary to load their respective components.</p>
            </div>
          </details>
          <details class="policy-section">
            <summary class="policy-sec-title">
              <span class="policy-sec-title-left">
                ${_icon('check')}
                <span>3. Your Consent</span>
              </span>
              <span class="accordion-icon">${_icon('chevron')}</span>
            </summary>
            <div class="policy-sec-content">
              <p class="policy-sec-text">By using our site, you consent to our use of local storage for cart memory and browser cookies required by third-party widgets.</p>
            </div>
          </details>
        </div>
      </div>
    </article>
  `;
  container.appendChild(privacyModal);

  // Inject Cookie Consent Banner if not accepted yet
  if (!localStorage.getItem('sap-cookie-consent')) {
    const banner = document.createElement('div');
    banner.className = 'cookie-consent-banner';
    banner.id = 'cookieConsentBanner';
    banner.innerHTML = `
      <div class="cc-inner">
        <p class="cc-text">We use cookies to enhance your shopping cart experience. By continuing to browse, you agree to our <a href="#" id="cookiePrivacyLink" class="cc-link">Privacy Policy</a>.</p>
        <div class="cc-buttons">
          <button class="btn-outline btn-sm cc-btn-decline" id="cookieDeclineBtn">Decline</button>
          <button class="btn-primary btn-sm cc-accept-btn" id="cookieAcceptBtn">Accept</button>
        </div>
      </div>
    `;
    container.appendChild(banner);
  }

  injectFooter();
  bindDynamicEvents(activePage);
  window.updateCartBadge();
}

/* ── DOM Event Bindings to Comply with Strict CSP ── */
function bindDynamicEvents(activePage) {
  const getEl = (id) => document.getElementById(id);

  // Logo fallback listener
  const logoImg = getEl('topbarLogoImg');
  if (logoImg) {
    logoImg.addEventListener('error', function () {
      this.classList.add('hidden');
      const fb = getEl('topbarLogoFallback');
      if (fb) fb.classList.remove('hidden');
    });
  }

  // Header and Navigation toggles
  if (getEl('burgerBtn'))
    getEl('burgerBtn').addEventListener('click', toggleBurgerMenu);
  if (getEl('burgerBackdrop'))
    getEl('burgerBackdrop').addEventListener('click', closeBurgerMenu);
  if (getEl('desktopSearchToggleBtn'))
    getEl('desktopSearchToggleBtn').addEventListener(
      'click',
      toggleDesktopSearch
    );
  if (getEl('cartToggleBtn'))
    getEl('cartToggleBtn').addEventListener('click', toggleCartDrawer);
  if (getEl('themeToggleBtn'))
    getEl('themeToggleBtn').addEventListener('click', toggleTheme);

  // Cart Drawer internal bindings
  if (getEl('cartCloseBtn'))
    getEl('cartCloseBtn').addEventListener('click', toggleCartDrawer);
  if (getEl('btnUseLocation')) {
    getEl('btnUseLocation').addEventListener('click', () => {
      if (navigator.geolocation) {
        getEl('btnUseLocation').innerHTML =
          `<span class="loading-spinner" style="width:10px;height:10px;border-width:2px;display:inline-block;border-top-color:var(--terra);"></span> Detecting...`;
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
            )
              .then((r) => r.json())
              .then((d) => {
                if (d && d.display_name) {
                  const addr = document.getElementById('coAddress');
                  addr.value = d.display_name;
                  addr.classList.remove('invalid');
                }
              })
              .finally(() => {
                getEl('btnUseLocation').innerHTML =
                  `<svg class="icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg> Use My Location`;
              });
          },
          () => {
            getEl('btnUseLocation').innerHTML =
              `<svg class="icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg> Use My Location`;
            window.showToast('Location access denied or unavailable.');
          }
        );
      }
    });
  }
  if (getEl('backToCartBtn'))
    getEl('backToCartBtn').addEventListener('click', showCartView);
  if (getEl('successBackBtn'))
    getEl('successBackBtn').addEventListener('click', showCartView);
  if (getEl('successMsgBtn'))
    getEl('successMsgBtn').addEventListener('click', clearCartAndClose);
  // Custom Payment Dropdown bindings
  const coPaymentBtn = getEl('coPaymentBtn');
  const coPaymentOpts = getEl('coPaymentOpts');
  if (coPaymentBtn && coPaymentOpts) {
    coPaymentBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = coPaymentOpts.classList.toggle('show');
      coPaymentBtn.setAttribute('aria-expanded', open);
    });
    coPaymentOpts.addEventListener('click', (e) => {
      const opt = e.target.closest('.cs-opt');
      if (opt) {
        const val = opt.dataset.value;
        const label = document.getElementById('coPaymentLabel');
        const hiddenInput = document.getElementById('coPayment');
        if (label) label.textContent = val;
        if (hiddenInput) {
          hiddenInput.value = val;
          hiddenInput.dispatchEvent(new Event('change'));
        }
        coPaymentOpts.classList.remove('show');
        coPaymentBtn.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('click', (e) => {
      if (
        !coPaymentBtn.contains(e.target) &&
        !coPaymentOpts.contains(e.target)
      ) {
        coPaymentOpts.classList.remove('show');
        coPaymentBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  const checkoutBtn = getEl('cartCheckoutBtn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', function () {
      if (this.dataset.mode === 'confirm') {
        submitCheckout();
      } else {
        showCheckoutForm();
      }
    });
  }

  // Cart item events (delegated for dynamic buttons)
  const cartItemsList = getEl('cartItemsList');
  if (cartItemsList) {
    cartItemsList.addEventListener('click', (e) => {
      const target = e.target;
      if (target.classList.contains('qty-btn')) {
        const itemId = target.dataset.id;
        const newQty = parseInt(target.dataset.qty, 10);
        updateCartQty(itemId, newQty);
      } else if (target.classList.contains('cart-item-remove')) {
        const itemId = target.dataset.id;
        removeFromCart(itemId);
      }
    });
  }

  // Search & Filters (only if searchPanel is loaded)
  if (getEl('searchInput')) {
    getEl('searchInput').addEventListener('input', handleSearch);
  }
  if (getEl('clearBtn')) {
    getEl('clearBtn').addEventListener('click', clearSearch);
  }

  if (activePage === 'catalog') {
    if (getEl('filterBtn'))
      getEl('filterBtn').addEventListener('click', toggleFilter);
    if (getEl('yearBtn'))
      getEl('yearBtn').addEventListener('click', toggleYearOpts);
    if (getEl('genreBtn'))
      getEl('genreBtn').addEventListener('click', toggleGenreOpts);
    if (getEl('sortBtn'))
      getEl('sortBtn').addEventListener('click', toggleSortOpts);
    if (getEl('resetFiltersBtn'))
      getEl('resetFiltersBtn').addEventListener('click', resetFilters);

    const minPriceInput = getEl('minPrice');
    const maxPriceInput = getEl('maxPrice');
    const triggerFilter = () => {
      if (typeof applyFilters === 'function') applyFilters();
    };
    if (minPriceInput) minPriceInput.addEventListener('input', triggerFilter);
    if (maxPriceInput) maxPriceInput.addEventListener('input', triggerFilter);

    const sortOpts = getEl('sortOpts');
    if (sortOpts) {
      sortOpts.addEventListener('click', (e) => {
        const opt = e.target.closest('.cs-opt');
        if (opt && opt.dataset.sort) {
          selectSort(opt.dataset.sort);
        }
      });
    }

    const yearOpts = getEl('yearOpts');
    if (yearOpts) {
      yearOpts.addEventListener('click', (e) => {
        const opt = e.target.closest('.cs-opt');
        if (opt) {
          selectYear(opt.dataset.year || 'All');
        }
      });
    }
  }

  // Smooth scroll to top on Brand Name click (if on homepage)
  const brandLink = document.querySelector('.topbar-center');
  if (brandLink) {
    brandLink.addEventListener('click', (e) => {
      const isIndex =
        window.location.pathname.endsWith('index.html') ||
        window.location.pathname === '/' ||
        window.location.pathname.endsWith('/');
      if (isIndex) {
        e.preventDefault();
        const mc = getEl('mainContent');
        if (mc) {
          mc.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    });
  }

  // Privacy Policy and Cookie Acceptance
  if (getEl('privacyCloseBtn'))
    getEl('privacyCloseBtn').addEventListener('click', () =>
      closeModal('privacyModal')
    );
  if (getEl('cookiePrivacyLink')) {
    getEl('cookiePrivacyLink').addEventListener('click', (e) => {
      e.preventDefault();
      openPrivacyModal();
    });
  }
  if (getEl('cookieAcceptBtn'))
    getEl('cookieAcceptBtn').addEventListener('click', acceptCookies);
  if (getEl('cookieDeclineBtn'))
    getEl('cookieDeclineBtn').addEventListener('click', declineCookies);
}

window.openPrivacyModal = function () {
  openModal('privacyModal');
};

window.acceptCookies = function () {
  const banner = document.getElementById('cookieConsentBanner');
  if (banner) {
    banner.classList.add('hide');
    setTimeout(() => banner.remove(), 300);
  }
  localStorage.setItem('sap-cookie-consent', 'accepted');
};

window.declineCookies = function () {
  const banner = document.getElementById('cookieConsentBanner');
  if (banner) {
    banner.classList.add('hide');
    setTimeout(() => banner.remove(), 300);
  }
  localStorage.setItem('sap-cookie-consent', 'declined');
};

/* ── Inject Back To Top Button ── */
function injectBackToTop() {
  if (document.getElementById('backToTop')) return;
  const btt = document.createElement('button');
  btt.id = 'backToTop';
  btt.className = 'back-to-top-btn';
  btt.setAttribute('aria-label', 'Back to Top');
  btt.setAttribute('tabindex', '0');
  btt.innerHTML = `
    <svg class="icon" aria-hidden="true" focusable="false"><use href="#icon-chevron-up"></use></svg>
    <span class="btt-tooltip">Back to Top</span>
  `;
  btt.addEventListener('click', () => {
    const mc = document.getElementById('mainContent');
    if (mc) {
      mc.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  document.body.appendChild(btt);
}

/* ── Theme management ── */
function updateAboutLogo() {
  const logo = document.querySelector('.about-logo-img');
  if (!logo) return;
  if (window.isDark) {
    logo.src = 'images/San Anselmo Press Logo White.png';
  } else {
    logo.src = 'images/San Anselmo Press logo.webp';
  }
}

function updateThemeUI() {
  const isDark = window.isDark;
  const label = document.getElementById('panelThemeToggleLabel');
  if (label) {
    const lang = document.body.dataset.lang || 'en';
    label.textContent = isDark
      ? (lang === 'fil' ? 'Naka-on' : 'On')
      : (lang === 'fil' ? 'Naka-off' : 'Off');
  }
  const btn = document.getElementById('panelThemeToggleBtn');
  if (btn) {
    btn.classList.toggle('active', isDark);
  }
}

function initTheme() {
  window.isDark = window.isDark || false;
  const saved = localStorage.getItem('sap-theme');
  const isDarkSystem =
    saved === 'dark' ||
    (!saved &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDarkSystem) {
    window.isDark = true;
    document.body.classList.add('dark');
  } else {
    window.isDark = false;
    document.body.classList.remove('dark');
  }
  updateThemeUI();
  updateAboutLogo();

  const themeBtn = document.getElementById('panelThemeToggleBtn');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
  }
}

function toggleTheme() {
  window.isDark = !window.isDark;
  document.body.classList.toggle('dark', window.isDark);
  localStorage.setItem('sap-theme', window.isDark ? 'dark' : 'light');
  updateThemeUI();
  updateAboutLogo();
}

/* ── Mobile Burger Menu ── */
function initBurgerMenu() {
  const btn = document.getElementById('burgerBtn');
  if (btn) btn.addEventListener('click', toggleBurgerMenu);
}

function toggleBurgerMenu() {
  const menu = document.getElementById('burgerMenu');
  const btn = document.getElementById('burgerBtn');
  const bd = document.getElementById('burgerBackdrop');
  if (!menu) return;
  const open = menu.classList.contains('open');
  if (open) {
    closeBurgerMenu();
  } else {
    if (typeof window.closeAllOverlaysExcept === 'function') {
      window.closeAllOverlaysExcept('burgerMenu');
    }
    menu.classList.add('open');
    if (btn) {
      btn.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
    if (bd) bd.classList.add('show');
    menu.removeAttribute('aria-hidden');
  }
}

function closeBurgerMenu() {
  const menu = document.getElementById('burgerMenu');
  const btn = document.getElementById('burgerBtn');
  const bd = document.getElementById('burgerBackdrop');
  if (menu) {
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
  }
  if (btn) {
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }
  if (bd) bd.classList.remove('show');
}

/* ── Settings Menu ── */
window.closeAllOverlaysExcept = function (exceptId) {
  if (exceptId !== 'burgerMenu' && typeof closeBurgerMenu === 'function') {
    closeBurgerMenu();
  }
  if (exceptId !== 'cartDrawer') {
    const cartDrawer = document.getElementById('cartDrawer');
    if (cartDrawer && cartDrawer.classList.contains('open')) {
      if (typeof window.toggleCartDrawer === 'function') {
        window.toggleCartDrawer();
      }
    }
  }
  if (exceptId !== 'settingsPanel') {
    if (typeof closeSettingsMenu === 'function') {
      closeSettingsMenu();
    }
  }
};

function initSettingsMenu() {
  const btn = document.getElementById('settingsToggleBtn');
  if (btn) btn.addEventListener('click', toggleSettingsMenu);
  
  const closeBtn = document.getElementById('settingsCloseBtn');
  if (closeBtn) closeBtn.addEventListener('click', closeSettingsMenu);
  
  const bd = document.getElementById('settingsBackdrop');
  if (bd) bd.addEventListener('click', closeSettingsMenu);
}

function toggleSettingsMenu() {
  const panel = document.getElementById('settingsPanel');
  const btn = document.getElementById('settingsToggleBtn');
  const bd = document.getElementById('settingsBackdrop');
  if (!panel) return;
  
  const open = panel.classList.contains('open');
  if (open) {
    closeSettingsMenu();
  } else {
    if (typeof window.closeAllOverlaysExcept === 'function') {
      window.closeAllOverlaysExcept('settingsPanel');
    }
    panel.style.display = 'flex';
    panel.classList.add('open');
    if (btn) {
      btn.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
    if (bd) bd.classList.add('show');
  }
}

function closeSettingsMenu() {
  const panel = document.getElementById('settingsPanel');
  const btn = document.getElementById('settingsToggleBtn');
  const bd = document.getElementById('settingsBackdrop');
  if (!panel) return;
  
  panel.style.display = 'none';
  panel.classList.remove('open');
  if (btn) {
    btn.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }
  if (bd) bd.classList.remove('show');
}

/* ── High-Performance Scroll Handlers (rAF Ticking) ── */
let ticking = false;
function initScrollHandlers() {
  const handler = () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        const mc = document.getElementById('mainContent');
        const sy =
          (mc ? mc.scrollTop : 0) ||
          window.scrollY ||
          document.documentElement.scrollTop;
        const sh = mc
          ? mc.scrollHeight - mc.clientHeight
          : document.documentElement.scrollHeight -
            document.documentElement.clientHeight;

        // Scroll progress bar
        const progress = document.getElementById('scrollProgress');
        if (progress && sh > 0) {
          const pct = (sy / sh) * 100;
          progress.style.width = pct + '%';
        }

        const btt = document.getElementById('backToTop');
        const tb = document.getElementById('topbar');
        if (btt) btt.classList.toggle('show', sy > 400);
        if (tb) tb.classList.toggle('scrolled', sy > 20);

        // Debounce saving scroll state to session history
        if (window._saveScrollTimeout) clearTimeout(window._saveScrollTimeout);
        window._saveScrollTimeout = setTimeout(() => {
          const state = window.history.state || {};
          if (state.scrollY !== sy) {
            window.history.replaceState(
              Object.assign({}, state, { scrollY: sy }),
              ''
            );
          }
        }, 150);

        ticking = false;
      });
      ticking = true;
    }
  };

  const mc = document.getElementById('mainContent');
  if (mc) mc.addEventListener('scroll', handler);
  window.addEventListener('scroll', handler);
  handler();
}

window.restoreScrollDepth = function () {
  const state = window.history.state;
  if (state && typeof state.scrollY === 'number') {
    const mc = document.getElementById('mainContent');
    const targetY = state.scrollY;
    if (mc && mc.scrollHeight > targetY) {
      mc.scrollTop = targetY;
    }
    window.scrollTo(0, targetY);
  }
};

/* ── Text display and Category match fallback helpers ── */
window.getSlug = function (text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

function initials(n) {
  return n
    .replace(/Atty\.\s*/, '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function authorDisplay(b) {
  if (b.editor && !b.author) return 'Ed. ' + b.editor;
  if (b.author) {
    if (/\(ed\.\)/i.test(b.author))
      return 'Ed. ' + b.author.replace(/\s*\(ed\.\)\s*/i, '').trim();
    return b.author;
  }
  if (b.editor) return 'Ed. ' + b.editor;
  return null;
}

function stockHtml(b) {
  if (b.stock === 0 || (b.note && b.note.toLowerCase().includes('sold out'))) {
    const sub =
      b.note && b.note.includes('2nd') ? ' — Awaiting 2nd Printing' : '';
    return `<span class="badge-label badge-soldout">Sold Out${sub}</span>`;
  }
  if (
    b.stock === -2 ||
    (b.note && b.note.toLowerCase().includes('not available'))
  )
    return `<span class="badge-label badge-unavail">Currently Not Available</span>`;
  return `<span class="badge-label badge-avail">Available</span>`;
}

function openModal(id) {
  const el = document.getElementById(id);
  if (el) {
    window._lastActiveElement = document.activeElement;
    if (typeof el.showModal === 'function') {
      el.showModal();
    } else {
      el.classList.add('open');
    }
    document.body.style.overflow = 'hidden';

    // Focus lock: first focusable element inside the modal
    const first = el.querySelector(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex="0"]'
    );
    if (first) {
      setTimeout(() => first.focus(), 50);
    }
  }
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (!el) return;

  if (id === 'detailModal' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
    const speakBtn = document.getElementById('mSpeakBtn');
    if (speakBtn) {
      speakBtn.classList.remove('speaking');
      speakBtn.setAttribute('data-tooltip', 'Listen');
      const textSpan = speakBtn.querySelector('.btn-text');
      if (textSpan) textSpan.textContent = 'Listen';
    }
  }

  if (el.tagName === 'DIALOG' && el.open) {
    el.close();
  }
  el.classList.remove('open');
  document.body.style.overflow = '';
  if (id === 'detailModal') {
    document.title =
      window._originalTitle || 'San Anselmo Publications — Catalog';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && window._originalMetaDesc) {
      metaDesc.content = window._originalMetaDesc;
    }
    const url = new URL(window.location.href);
    if (url.searchParams.has('book')) {
      url.searchParams.delete('book');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
    const dyn = document.getElementById('bookSchema');
    if (dyn) dyn.remove();
  }
  if (id === 'authorModal') {
    const url = new URL(window.location.href);
    if (url.searchParams.has('author')) {
      url.searchParams.delete('author');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  }

  if (window._lastActiveElement) {
    try {
      window._lastActiveElement.focus();
    } catch (e) {}
    window._lastActiveElement = null;
  }
}

function trapFocus(modalEl, event) {
  if (event.key !== 'Tab') return;
  const focusables = modalEl.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex="0"]'
  );
  if (!focusables.length) {
    event.preventDefault();
    return;
  }
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (event.shiftKey) {
    if (document.activeElement === first) {
      last.focus();
      event.preventDefault();
    }
  } else {
    if (document.activeElement === last) {
      first.focus();
      event.preventDefault();
    }
  }
}

/* Global Listeners & View Transitions API wrapper */
window.transitionTo = function (updateDOM) {
  if (document.startViewTransition) {
    document.startViewTransition(updateDOM);
  } else {
    updateDOM();
  }
};

window.initTeamPage = async function () {
  const teamData = await SheetsCMS.getTeam().catch(() =>
    typeof TEAM !== 'undefined' ? TEAM : []
  );
  const grid = document.getElementById('teamGrid');
  if (grid) {
    grid.innerHTML = teamData
      .map((t) => {
        const sName = sanitizeText(t.name);
        const sRole = sanitizeText(t.role);
        const sImg = t.img ? sanitizeUrl(t.img) : '';
        return `<div class="team-card" role="listitem">
        <div class="team-avatar" aria-hidden="true">${sImg ? `<img src="${sImg}" alt="${sName}" loading="eager" decoding="async" onerror="this.parentElement.textContent='${initials(t.name)}'">` : initials(t.name)}</div>
        <div class="team-name">${sName}</div>
        <div class="team-role">${sRole}</div>
      </div>`;
      })
      .join('');
  }
};

window.initNewsPage = function () {
  const newsListCol = document.getElementById('newsListCol');
  if (newsListCol) {
    const newsData = [...(typeof NEWS !== 'undefined' ? NEWS : [])].sort(
      (a, b) => new Date(b.date) - new Date(a.date)
    );
    if (newsData.length === 0) {
      newsListCol.innerHTML =
        '<p class="no-news-msg">No news announcements posted yet.</p>';
    } else {
      newsListCol.innerHTML = newsData
        .map((n) => {
          const sTitle = sanitizeText(n.title);
          const sCat = sanitizeText(n.category);
          const sContent = sanitizeText(n.content);
          const d = new Date(n.date);
          const timeStr = d.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          });
          const sImg = n.img ? sanitizeUrl(n.img) : '';
          return `
          <article class="news-card-item">
            ${sImg ? `<div class="news-card-img-wrap"><img class="news-card-img" src="${sImg}" alt="${sTitle}" loading="lazy"></div>` : ''}
            <div class="news-card-content">
              <div class="news-card-header">
                <span class="news-card-cat">${sCat}</span>
                <span class="news-card-date">${timeStr}</span>
              </div>
              <h2 class="news-card-title">${sTitle}</h2>
              <p class="news-card-text">${sContent}</p>
            </div>
          </article>
        `;
        })
        .join('');
    }
  }

  const fbFrame = document.getElementById('fbEmbed');
  if (fbFrame && fbFrame.dataset.src) {
    const loadFb = () => {
      const container = fbFrame.parentElement;
      const containerWidth = container
        ? Math.floor(container.getBoundingClientRect().width)
        : 500;
      const targetWidth = Math.max(180, Math.min(containerWidth, 500));
      fbFrame.src = fbFrame.dataset.src.replace(
        'width=500',
        'width=' + targetWidth
      );
    };

    if ('IntersectionObserver' in window) {
      const mainContent = document.getElementById('mainContent');
      const isMobile = window.innerWidth <= 900;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              loadFb();
              observer.disconnect();
            }
          });
        },
        {
          root: isMobile ? null : mainContent,
          rootMargin: '200px',
        }
      );
      observer.observe(fbFrame);
    } else {
      loadFb();
    }
  }
};

window.initOrderAccordion = function () {
  const container = document.getElementById('orderAccordion');
  if (!container) return;

  container.addEventListener('click', (e) => {
    const header = e.target.closest('.accordion-header');
    if (!header) return;

    const item = header.parentElement;
    const panel = item.querySelector('.accordion-panel');
    if (!panel) return;

    const isActive = item.classList.contains('active');

    // Close all other items
    container.querySelectorAll('.accordion-item').forEach((otherItem) => {
      if (otherItem !== item && otherItem.classList.contains('active')) {
        otherItem.classList.remove('active');
        const otherPanel = otherItem.querySelector('.accordion-panel');
        const otherHeader = otherItem.querySelector('.accordion-header');
        if (otherPanel) otherPanel.style.maxHeight = null;
        if (otherHeader) otherHeader.setAttribute('aria-expanded', 'false');
      }
    });

    // Toggle current item
    if (isActive) {
      item.classList.remove('active');
      panel.style.maxHeight = null;
      header.setAttribute('aria-expanded', 'false');
    } else {
      item.classList.add('active');
      panel.style.maxHeight = panel.scrollHeight + 'px';
      header.setAttribute('aria-expanded', 'true');
    }
  });

  container.addEventListener('keydown', (e) => {
    const header = e.target.closest('.accordion-header');
    if (!header) return;

    const headers = Array.from(container.querySelectorAll('.accordion-header'));
    const index = headers.indexOf(header);

    let targetHeader = null;
    if (e.key === 'ArrowDown') {
      targetHeader = headers[(index + 1) % headers.length];
    } else if (e.key === 'ArrowUp') {
      targetHeader = headers[(index - 1 + headers.length) % headers.length];
    } else if (e.key === 'Home') {
      targetHeader = headers[0];
    } else if (e.key === 'End') {
      targetHeader = headers[headers.length - 1];
    }

    if (targetHeader) {
      e.preventDefault();
      targetHeader.focus();
    }
  });

  // Set initial height of the active panel
  const activePanel = container.querySelector(
    '.accordion-item.active .accordion-panel'
  );
  if (activePanel) {
    activePanel.style.maxHeight = activePanel.scrollHeight + 'px';
  }
};

document.addEventListener('astro:page-load', () => {
  // Inject Organization JSON-LD Schema
  if (!document.getElementById('sapOrgSchema')) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'sapOrgSchema';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'BookStore',
      name: 'San Anselmo Publications, Inc.',
      url: window.location.origin,
      logo: window.location.origin + '/images/sap logo only.webp',
      description:
        'Browse our complete catalog of Filipino literature, poetry, fiction, and journals.',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Quezon City',
        addressCountry: 'PH',
      },
    });
    document.head.appendChild(script);
  }

  // Handle native dialog close events (e.g. triggered via ESC key)
  document.addEventListener(
    'close',
    (e) => {
      if (e.target && e.target.tagName === 'DIALOG') {
        closeModal(e.target.id);
      }
    },
    true
  );

  // Close when clicking on dialog backdrop
  document.addEventListener('click', (e) => {
    if (
      e.target &&
      e.target.tagName === 'DIALOG' &&
      e.target.classList.contains('modal-overlay')
    ) {
      closeModal(e.target.id);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      window.handleGlobalEscapeExit();
    }
    const openMod =
      document.querySelector('dialog[open]') ||
      document.querySelector('.modal-overlay.open') ||
      document.querySelector('.settings-panel.open');
    if (openMod) {
      trapFocus(openMod, e);
    }
  });

  // Automatically initialize page based on body data attribute (eliminates inline page script execution blocks)
  const page = document.body.dataset.page;
  if (page) {
    injectNav(page);
    injectBackToTop();
    initTheme();
    initBurgerMenu();
    initSettingsMenu();
    initScrollHandlers();
    injectAccessibility();
    initPageTransitions();
    initScrollProgress();

    if (page === 'team' && typeof window.initTeamPage === 'function') {
      window.initTeamPage();
    }
    if (page === 'news' && typeof window.initNewsPage === 'function') {
      window.initNewsPage();
    }
    if (page === 'order' && typeof window.initOrderAccordion === 'function') {
      window.initOrderAccordion();
    }
  }

  // Programmatically bind native dialog close buttons
  const detailModalClose = document.getElementById('detailModalCloseBtn');
  if (detailModalClose) {
    detailModalClose.addEventListener('click', () => closeModal('detailModal'));
  }
  const authorModalClose = document.getElementById('authorModalCloseBtn');
  if (authorModalClose) {
    authorModalClose.addEventListener('click', () => closeModal('authorModal'));
  }
});

/* ── Search Handler ── */
function handleSearch() {
  const input = document.getElementById('searchInput');
  if (!input) return;
  const v = input.value;
  const clearBtn = document.getElementById('clearBtn');
  if (clearBtn) clearBtn.style.display = v ? 'block' : 'none';

  if (window._isAuthorsPage) {
    if (window._searchTimeout) clearTimeout(window._searchTimeout);
    window._searchTimeout = setTimeout(() => {
      if (typeof window._authorSearch === 'function') window._authorSearch(v);
      if (typeof window._authorSearchPreds === 'function')
        window._authorSearchPreds(v);
    }, 200);
    return;
  }

  if (!window._isCatalogPage && !window._isAuthorsPage && v.length > 2) {
    window.location.href = window.resolveUrl('index.html?q=' + encodeURIComponent(v));
    return;
  }

  if (window._isCatalogPage) {
    if (window._searchTimeout) clearTimeout(window._searchTimeout);
    window._searchTimeout = setTimeout(() => {
      if (typeof window._catalogSearch === 'function') window._catalogSearch(v);
      if (typeof window.applyFilters === 'function') window.applyFilters();
    }, 200);
  } else {
    if (typeof window._catalogSearch === 'function') window._catalogSearch(v);
  }
}

function closePreds() {
  const p = document.getElementById('searchPreds');
  if (p) p.style.display = 'none';
}

function clearSearch() {
  const input = document.getElementById('searchInput');
  if (input) input.value = '';
  const cb = document.getElementById('clearBtn');
  if (cb) cb.style.display = 'none';
  closePreds();

  const bar = document.querySelector('.topbar-search');
  if (bar) {
    bar.classList.remove('open');
    document.body.classList.remove('search-is-open');
    const btn = document.getElementById('desktopSearchToggleBtn');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  }

  if (window._searchTimeout) clearTimeout(window._searchTimeout);

  if (window._isCatalogPage && typeof window.applyFilters === 'function') {
    window.applyFilters();
  }
  if (window._isAuthorsPage && typeof window._authorSearch === 'function') {
    window._authorSearch('');
  }
}

window.toggleDesktopSearch = function () {
  const bar = document.querySelector('.topbar-search');
  if (!bar) return;
  const isOpen = bar.classList.toggle('open');
  document.body.classList.toggle('search-is-open', isOpen);
  const btn = document.getElementById('desktopSearchToggleBtn');
  if (btn) btn.setAttribute('aria-expanded', isOpen);
  if (!isOpen) {
    closePreds();
    const fd = document.getElementById('filterDropdown');
    if (fd) fd.classList.remove('show');
    const fb = document.getElementById('filterBtn');
    if (fb) fb.setAttribute('aria-expanded', 'false');
  }
};

/* Close search panel and predictions on outside click */
document.addEventListener('click', (e) => {
  const bar = document.querySelector('.topbar-search');
  const btn = document.getElementById('desktopSearchToggleBtn');
  if (
    bar &&
    bar.classList.contains('open') &&
    !bar.contains(e.target) &&
    btn &&
    !btn.contains(e.target)
  ) {
    bar.classList.remove('open');
    document.body.classList.remove('search-is-open');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    closePreds();
    const fd = document.getElementById('filterDropdown');
    if (fd) fd.classList.remove('show');
    const fb = document.getElementById('filterBtn');
    if (fb) fb.setAttribute('aria-expanded', 'false');
  }
  if (bar && !bar.contains(e.target)) {
    closePreds();
  }
});

/* ── Inject Footer ── */
function injectFooter() {
  const main = document.getElementById('mainContent');
  if (!main) return;
  if (document.getElementById('globalFooter')) return;

  const lang = document.body.dataset.lang || 'en';

  const footer = document.createElement('footer');
  footer.className = 'footer-simple';
  footer.id = 'globalFooter';
  footer.setAttribute('role', 'contentinfo');
  footer.innerHTML = `
    <div class="footer-simple-inner">
      <div class="footer-simple-brand">
        <img src="/images/sap logo only.webp" alt="San Anselmo Publications Logo" class="footer-simple-logo" width="26" height="26" loading="lazy" decoding="async">
        <span class="footer-simple-title">San Anselmo Publications</span>
      </div>
      
      <div class="footer-newsletter-wrap">
        <h4 class="footer-newsletter-title">${lang === 'fil' ? 'Mag-subscribe sa aming Newsletter' : 'Subscribe to our Newsletter'}</h4>
        <form class="footer-newsletter-form" id="newsletterForm" novalidate>
          <div class="footer-newsletter-input-group">
            <input type="email" id="newsletterEmail" placeholder="${lang === 'fil' ? 'Iyong email address' : 'Your email address'}" aria-label="${lang === 'fil' ? 'Iyong email address' : 'Your email address'}" required />
            <button type="submit" class="btn-primary newsletter-submit-btn">${lang === 'fil' ? 'Mag-subscribe' : 'Subscribe'}</button>
          </div>
          <div class="newsletter-status" id="newsletterStatus" role="status" aria-live="polite"></div>
        </form>
      </div>

      <div class="footer-simple-copyright">
        &copy; 2026 San Anselmo Publications, Inc. All rights reserved. &middot; Version 2.40.8 &middot; <a href="https://fb.com/edzfrnc" target="_blank" rel="noopener" class="footer-simple-credit-link">Developed and designed by Edzel Frince Bual.</a>
      </div>
    </div>`;
  main.appendChild(footer);

  // Wire newsletter submission and validation
  const form = document.getElementById('newsletterForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const emailInput = document.getElementById('newsletterEmail');
      const statusDiv = document.getElementById('newsletterStatus');
      if (!emailInput || !statusDiv) return;

      const email = emailInput.value.trim();
      statusDiv.className = 'newsletter-status';
      statusDiv.textContent = '';

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email) {
        statusDiv.textContent =
          lang === 'fil'
            ? 'Mangyaring ilagay ang iyong email.'
            : 'Please enter your email.';
        statusDiv.classList.add('error');
        return;
      }
      if (!emailRegex.test(email)) {
        statusDiv.textContent =
          lang === 'fil'
            ? 'Hindi wastong email format.'
            : 'Invalid email format.';
        statusDiv.classList.add('error');
        return;
      }

      statusDiv.textContent =
        lang === 'fil'
          ? 'Salamat sa pag-subscribe!'
          : 'Thanks for subscribing!';
      statusDiv.classList.add('success');
      emailInput.value = '';
    });
  }
}

/* ── Shopping Cart Logic (Float-Free Math & Proxy State Management) ── */
(function () {
  const rawCart = (function () {
    try {
      const stored = localStorage.getItem('sap-cart');
      const parsed = stored ? JSON.parse(stored) : [];
      return parsed.map((item) => {
        if (item.priceCents === undefined) {
          item.priceCents = Math.round((item.price || 0) * 100);
        }
        delete item.price;
        return item;
      });
    } catch {
      return [];
    }
  })();

  const handler = {
    set(target, prop, value, receiver) {
      const success = Reflect.set(target, prop, value, receiver);
      if (success && (prop === 'length' || !isNaN(Number(prop)))) {
        try {
          localStorage.setItem('sap-cart', JSON.stringify(target));
        } catch (e) {
          console.warn('localStorage save failed', e);
        }
        window.updateCartBadge();
        window.renderCartItems();
      }
      return success;
    },
    deleteProperty(target, prop) {
      const success = Reflect.deleteProperty(target, prop);
      if (success) {
        try {
          localStorage.setItem('sap-cart', JSON.stringify(target));
        } catch (e) {
          console.warn('localStorage save failed', e);
        }
        window.updateCartBadge();
        window.renderCartItems();
      }
      return success;
    },
  };

  window.cartState = new Proxy(rawCart, handler);
})();

window.getCart = function () {
  return window.cartState;
};

window.saveCart = function (cart) {
  window.cartState.length = 0;
  cart.forEach((item) => {
    if (item.priceCents === undefined) {
      item.priceCents = Math.round((item.price || 0) * 100);
    }
    delete item.price;
    window.cartState.push(item);
  });
};

window.addToCart = function (id, title, price, img) {
  const cart = window.cartState;
  const existing = cart.find((item) => item.id === id);
  if (existing) {
    existing.qty += 1;
    window.saveCart([...cart]);
  } else {
    const priceCents = Math.round(Number(price) * 100);
    cart.push({ id, title, priceCents, img, qty: 1 });
    window.saveCart([...cart]);
  }
  window.showToast(`"${title}" added to cart!`);
  if (typeof window.playAudioConfirmation === 'function') {
    window.playAudioConfirmation();
  }
};

window.removeFromCart = function (id) {
  const cart = window.cartState;
  const filtered = cart.filter((x) => x.id !== id);
  window.saveCart(filtered);
  const item = cart.find((x) => x.id === id);
  if (item) window.showToast(`Removed "${item.title}" from cart`);
};

window.updateCartQty = function (id, qty) {
  const cart = window.cartState;
  const item = cart.find((x) => x.id === id);
  if (!item) return;
  const newQty = parseInt(qty, 10);
  if (isNaN(newQty) || newQty <= 0) {
    const filtered = cart.filter((x) => x.id !== id);
    window.saveCart(filtered);
  } else {
    item.qty = newQty;
    window.saveCart([...cart]);
  }
};

window.toggleCartDrawer = function () {
  const drawer = document.getElementById('cartDrawer');
  const backdrop = document.getElementById('cartBackdrop');
  if (!drawer) return;
  const isOpen = drawer.classList.contains('open');
  if (isOpen) {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    if (backdrop) backdrop.classList.remove('show');
    document.body.classList.remove('cart-is-open');
  } else {
    if (typeof window.closeAllOverlaysExcept === 'function') {
      window.closeAllOverlaysExcept('cartDrawer');
    }
    drawer.classList.add('open');
    drawer.removeAttribute('aria-hidden');
    if (backdrop) backdrop.classList.add('show');
    document.body.classList.add('cart-is-open');
    window.renderCartItems();
    window.showCartView();
  }
};

window.updateCartBadge = function () {
  const cart = window.getCart();
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);

  const badge = document.getElementById('cartBadge');
  if (badge) {
    if (totalQty > 0) {
      badge.textContent = totalQty;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }
};

window.renderCartItems = function () {
  const list = document.getElementById('cartItemsList');
  const totalVal = document.getElementById('cartTotalVal');
  if (!list) return;
  const cart = window.getCart();
  if (cart.length === 0) {
    list.innerHTML = `<div class="cart-empty-msg">Your cart is empty.</div>`;
    if (totalVal) totalVal.textContent = '₱0';
    return;
  }

  let html = '';
  let totalCents = 0;
  cart.forEach((item) => {
    const itemPrice = item.priceCents / 100;
    const subtotalCents = item.priceCents * item.qty;
    totalCents += subtotalCents;
    const sId = sanitizeText(item.id);
    html += `
      <div class="cart-item">
        ${item.img ? `<img src="${sanitizeUrl(item.img)}" alt="${sanitizeText(item.title)}" class="cart-item-img">` : '<div class="cart-item-img fallback-cover-cart">No Cover</div>'}
        <div class="cart-item-details">
          <div class="cart-item-title">${sanitizeText(item.title)}</div>
          <div class="cart-item-price">₱${itemPrice.toLocaleString()}</div>
          <div class="cart-item-qty-row">
            <button class="qty-btn" data-id="${sId}" data-qty="${item.qty - 1}">-</button>
            <span class="qty-val">${item.qty}</span>
            <button class="qty-btn" data-id="${sId}" data-qty="${item.qty + 1}">+</button>
          </div>
        </div>
        <button class="cart-item-remove" data-id="${sId}" aria-label="Remove item">×</button>
      </div>`;
  });
  list.innerHTML = html;
  if (totalVal)
    totalVal.textContent = `₱${(totalCents / 100).toLocaleString()}`;
};

window.showCartView = function () {
  const cartItemsList = document.getElementById('cartItemsList');
  const cartCheckoutForm = document.getElementById('cartCheckoutForm');
  const cartSuccessScreen = document.getElementById('cartSuccessScreen');
  const cartCheckoutBtn = document.getElementById('cartCheckoutBtn');
  const cartFooter = document.getElementById('cartFooter');

  if (cartItemsList && cartCheckoutForm && cartCheckoutBtn) {
    cartItemsList.classList.remove('hidden');
    cartCheckoutForm.classList.add('hidden');
    if (cartSuccessScreen) cartSuccessScreen.classList.add('hidden');
    if (cartFooter) cartFooter.classList.remove('hidden');
    cartCheckoutBtn.textContent = 'Checkout via Messenger';
    cartCheckoutBtn.dataset.mode = 'checkout';
  }
};

window.showCheckoutForm = function () {
  const cart = window.getCart();
  if (cart.length === 0) {
    window.showToast('Your cart is empty!');
    return;
  }
  const cartItemsList = document.getElementById('cartItemsList');
  const cartCheckoutForm = document.getElementById('cartCheckoutForm');
  const cartSuccessScreen = document.getElementById('cartSuccessScreen');
  const cartCheckoutBtn = document.getElementById('cartCheckoutBtn');
  const cartFooter = document.getElementById('cartFooter');

  if (cartItemsList && cartCheckoutForm && cartCheckoutBtn) {
    cartItemsList.classList.add('hidden');
    cartCheckoutForm.classList.remove('hidden');
    if (cartSuccessScreen) cartSuccessScreen.classList.add('hidden');
    if (cartFooter) cartFooter.classList.remove('hidden');
    cartCheckoutBtn.textContent = 'Confirm & Send Order';
    cartCheckoutBtn.dataset.mode = 'confirm';
  }
};

window.showSuccessScreen = function () {
  const cartItemsList = document.getElementById('cartItemsList');
  const cartCheckoutForm = document.getElementById('cartCheckoutForm');
  const cartSuccessScreen = document.getElementById('cartSuccessScreen');
  const cartFooter = document.getElementById('cartFooter');

  if (cartItemsList && cartCheckoutForm && cartSuccessScreen) {
    cartItemsList.classList.add('hidden');
    cartCheckoutForm.classList.add('hidden');
    cartSuccessScreen.classList.remove('hidden');
    if (cartFooter) cartFooter.classList.add('hidden');
  }
};

window.clearCartAndClose = function () {
  window.saveCart([]);
  window.toggleCartDrawer();
};

window.submitCheckout = function () {
  const cart = window.getCart();
  if (cart.length === 0) {
    window.showToast('Your cart is empty!');
    return;
  }

  const inName = document.getElementById('coName');
  const inPhone = document.getElementById('coPhone');
  const inEmail = document.getElementById('coEmail');
  const inAddress = document.getElementById('coAddress');
  const inPayment = document.getElementById('coPayment');

  const name = inName.value.trim();
  const phone = inPhone.value.trim();
  const email = inEmail.value.trim();
  const address = inAddress.value.trim();
  const payment = inPayment.value;

  let valid = true;
  if (!name) {
    inName.classList.add('invalid');
    valid = false;
  }
  if (!phone) {
    inPhone.classList.add('invalid');
    valid = false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    inEmail.classList.add('invalid');
    valid = false;
  }

  if (!address) {
    inAddress.classList.add('invalid');
    valid = false;
  }
  if (!payment) {
    window.showToast('Please select a payment method.');
    valid = false;
  }

  if (!valid) return;

  let orderSlip = '*San Anselmo Publications Order*\n\n';
  orderSlip += '*Items Ordered:*\n';
  let totalCents = 0;
  cart.forEach((item) => {
    const subtotalCents = item.priceCents * item.qty;
    totalCents += subtotalCents;
    orderSlip += `- ${item.qty}x ${item.title} (₱${(subtotalCents / 100).toLocaleString()})\n`;
  });
  orderSlip += `\n*Total Net Price:* ₱${(totalCents / 100).toLocaleString()}\n\n`;
  orderSlip += '*Customer Details:*\n';
  orderSlip += `- Name: ${name}\n`;
  orderSlip += `- Phone: ${phone}\n`;
  orderSlip += `- Email: ${email}\n`;
  orderSlip += `- Delivery Address: ${address}\n`;
  orderSlip += `- Mode of Payment: ${payment}`;

  navigator.clipboard
    .writeText(orderSlip)
    .then(() => {
      window.showToast('Order slip copied to clipboard!');
      if (typeof window.playAudioConfirmation === 'function') {
        window.playAudioConfirmation();
      }
    })
    .catch(() => {
      const el = document.createElement('textarea');
      el.value = orderSlip;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      window.showToast('Order slip copied to clipboard!');
      if (typeof window.playAudioConfirmation === 'function') {
        window.playAudioConfirmation();
      }
    });

  window.showSuccessScreen();
};

window.showToast = function (msg, type = 'info') {
  const activeDialog = document.querySelector('dialog[open]');
  const targetContainer = activeDialog ? activeDialog : document.body;
  let container = targetContainer.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    targetContainer.appendChild(container);
  }
  const t = document.createElement('div');
  t.className = `toast-notification toast-${type}`;

  let iconStr = '';
  if (type === 'success')
    iconStr = `<svg class="icon" aria-hidden="true" style="color:#10B981"><use href="#icon-check"></use></svg>`;
  else if (type === 'error')
    iconStr = `<svg class="icon" aria-hidden="true" style="color:#EF4444"><use href="#icon-cross"></use></svg>`;
  else if (type === 'info')
    iconStr = `<svg class="icon" aria-hidden="true" style="color:var(--gold)"><use href="#icon-info"></use></svg>`;

  t.innerHTML = `<div style="display:flex; align-items:center; gap:0.5rem;">${iconStr}<span>${msg}</span></div>`;

  container.appendChild(t);
  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, 3000);
};

window.initPageTransitions = function () {
  document.body.classList.remove('page-leaving');
  document.body.classList.add('page-loaded');
  
  if (!window._bfcacheListenerAdded) {
    window.addEventListener('pageshow', (event) => {
      if (event.persisted) {
        document.body.classList.remove('page-leaving');
      }
    });
    window._bfcacheListenerAdded = true;
  }

  document.addEventListener('click', (e) => {
    if (window.location.protocol === 'file:') return;
    const link = e.target.closest('a');
    if (link && link.href) {
      if (
        link.target === '_blank' ||
        link.hasAttribute('download') ||
        link.href.includes('mailto:') ||
        link.href.includes('tel:')
      )
        return;
      const hrefAttr = link.getAttribute('href') || '';
      if (
        link.origin === window.location.origin &&
        !link.hash &&
        !hrefAttr.startsWith('#') &&
        hrefAttr !== ''
      ) {
        e.preventDefault();
        document.body.classList.add('page-leaving');
        setTimeout(() => {
          window.location.href = window.resolveUrl(link.href);
        }, 250);
      }
    }
  });
};

window.initScrollProgress = function () {
  const bar = document.createElement('div');
  bar.className = 'scroll-progress-bar';
  document.body.appendChild(bar);
  window.addEventListener(
    'scroll',
    () => {
      const winScroll =
        document.body.scrollTop || document.documentElement.scrollTop;
      const height =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      bar.style.width = scrolled + '%';
    },
    { passive: true }
  );
};

// Register Service Worker for PWA (HTTP/HTTPS only) - Relocated to BaseLayout.astro

/* ── Cross-Page Preference Sync Class ── */
class PrefsSync {
  static KEYS = {
    search: 'sap-pref-search',
    genre: 'sap-pref-genre',
    year: 'sap-pref-year',
    sort: 'sap-pref-sort',
    minPrice: 'sap-pref-minprice',
    maxPrice: 'sap-pref-maxprice',
  };

  static save(prefs) {
    try {
      if (prefs.search !== undefined)
        sessionStorage.setItem(this.KEYS.search, prefs.search);
      if (prefs.genre !== undefined)
        sessionStorage.setItem(this.KEYS.genre, prefs.genre);
      if (prefs.year !== undefined)
        sessionStorage.setItem(this.KEYS.year, prefs.year);
      if (prefs.sort !== undefined)
        sessionStorage.setItem(this.KEYS.sort, prefs.sort);
      if (prefs.minPrice !== undefined)
        sessionStorage.setItem(this.KEYS.minPrice, prefs.minPrice);
      if (prefs.maxPrice !== undefined)
        sessionStorage.setItem(this.KEYS.maxPrice, prefs.maxPrice);
    } catch (e) {
      console.warn('sessionStorage not available', e);
    }
  }

  static load() {
    try {
      return {
        search: sessionStorage.getItem(this.KEYS.search) || '',
        genre: sessionStorage.getItem(this.KEYS.genre) || 'All',
        year: sessionStorage.getItem(this.KEYS.year) || 'All',
        sort: sessionStorage.getItem(this.KEYS.sort) || 'newest',
        minPrice: sessionStorage.getItem(this.KEYS.minPrice) || '',
        maxPrice: sessionStorage.getItem(this.KEYS.maxPrice) || '',
      };
    } catch {
      return {
        search: '',
        genre: 'All',
        year: 'All',
        sort: 'newest',
        minPrice: '',
        maxPrice: '',
      };
    }
  }

  static clear() {
    try {
      Object.values(this.KEYS).forEach((k) => sessionStorage.removeItem(k));
    } catch {}
  }
}
window.PrefsSync = PrefsSync;

/* ── Global Media Error Capturing Listener ── */
(function () {
  const svgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 180" width="120" height="180">
  <rect width="120" height="180" fill="#F5EFE4" />
  <rect x="0" y="0" width="8" height="180" fill="#8C3D1F" opacity="0.15" />
  <line x1="8" y1="0" x2="8" y2="180" stroke="#8C3D1F" stroke-width="0.5" opacity="0.3" />
  <rect x="12" y="12" width="96" height="156" fill="none" stroke="#B8882C" stroke-width="1" rx="2" />
  <rect x="18" y="18" width="84" height="144" fill="#FEFCF9" opacity="0.6" rx="1" />
  <g transform="translate(42, 60)" fill="#8C3D1F">
    <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1z" transform="scale(0.85)" />
  </g>
  <text x="60" y="105" font-family="'Cormorant Garamond', Georgia, serif" font-weight="bold" font-size="7.5" fill="#8C3D1F" text-anchor="middle" letter-spacing="0.08em">SAN ANSELMO</text>
  <text x="60" y="113" font-family="'Libre Franklin', sans-serif" font-weight="600" font-size="5" fill="#6B5C4D" text-anchor="middle" letter-spacing="0.12em">PRESS</text>
  <line x1="30" y1="123" x2="90" y2="123" stroke="#B8882C" stroke-width="0.5" opacity="0.6" />
</svg>`;

  const cameraSvgString = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 250" width="100%" height="100%">
  <rect width="100%" height="100%" fill="#F5EFE4" />
  <g transform="translate(188, 113) scale(2)" fill="#8C3D1F" opacity="0.6">
    <path d="M12 8c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7-13h-2.72l-1.44-2.88c-.37-.74-1.12-1.12-1.95-1.12H11.1c-.83 0-1.58.38-1.95 1.12L7.72 5H5c-1.66 0-3 1.34-3 3v12c0 1.66 1.34 3 3 3h14c1.66 0 3-1.34 3-3V8c0-1.66-1.34-3-3-3zm1 15c0 .55-.45 1-1 1H5c-.55 0-1-.45-1-1V8c0-.55.45-1 1-1h3.14l1.44-2.88c.12-.25.37-.38.65-.38h5.54c.28 0 .53.13.65.38L18.86 7H22c.55 0 1 .45 1 1v12z"/>
  </g>
</svg>`;

  let base64Svg;
  let base64CameraSvg;
  try {
    base64Svg = 'data:image/svg+xml;base64,' + btoa(svgString);
  } catch (e) {
    base64Svg = 'data:image/svg+xml;utf8,' + encodeURIComponent(svgString);
  }

  try {
    base64CameraSvg = 'data:image/svg+xml;base64,' + btoa(cameraSvgString);
  } catch (e) {
    base64CameraSvg =
      'data:image/svg+xml;utf8,' + encodeURIComponent(cameraSvgString);
  }

  window.addEventListener(
    'error',
    function (event) {
      if (event.target && event.target.tagName === 'IMG') {
        const img = event.target;
        if (
          img.classList.contains('book-cover-img') ||
          img.id === 'mCover' ||
          img.classList.contains('cart-item-img') ||
          img.classList.contains('det-cover')
        ) {
          event.preventDefault();
          event.stopImmediatePropagation();
          img.src = base64Svg;
        } else if (img.classList.contains('event-card-img')) {
          event.preventDefault();
          event.stopImmediatePropagation();
          img.src = base64CameraSvg;
        } else if (
          img.classList.contains('topbar-logo') ||
          img.classList.contains('about-logo-img')
        ) {
          event.preventDefault();
          event.stopImmediatePropagation();
          img.classList.add('hidden');
          const fallback = img.nextElementSibling;
          if (fallback) fallback.classList.remove('hidden');
        }
      }
    },
    true
  ); // Use capture phase because image error events do not bubble
})();

/* ── Standardized Keyboard Exits (Escape Key) ── */
window.handleGlobalEscapeExit = function () {
  document.querySelectorAll('dialog[open]').forEach((dialog) => {
    closeModal(dialog.id);
  });
  document.querySelectorAll('.modal-overlay.open').forEach((modal) => {
    closeModal(modal.id);
  });

  if (typeof closeBurgerMenu === 'function') {
    closeBurgerMenu();
  }

  if (typeof closeSettingsMenu === 'function') {
    closeSettingsMenu();
  }

  const cartDrawer = document.getElementById('cartDrawer');
  if (cartDrawer && cartDrawer.classList.contains('open')) {
    toggleCartDrawer();
  }

  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.blur();
  }
  closePreds();

  const searchBar = document.querySelector('.topbar-search');
  const searchToggleBtn = document.getElementById('desktopSearchToggleBtn');
  if (searchBar && searchBar.classList.contains('open')) {
    searchBar.classList.remove('open');
    document.body.classList.remove('search-is-open');
    if (searchToggleBtn) {
      searchToggleBtn.setAttribute('aria-expanded', 'false');
    }
    const fd = document.getElementById('filterDropdown');
    if (fd) fd.classList.remove('show');
    const fb = document.getElementById('filterBtn');
    if (fb) fb.setAttribute('aria-expanded', 'false');
  }
};

/* ── Visual Viewport Virtual Keyboard Height Module ── */
(function () {
  if (typeof window === 'undefined' || !window.visualViewport) return;

  let lastOffset = null;
  const handleViewportChange = () => {
    const scale = window.visualViewport.scale || 1;
    // Only calculate keyboard height if scale is approximately 1 (not pinch-zoomed)
    const keyboardHeight = (scale > 0.95 && scale < 1.05)
      ? Math.max(0, window.innerHeight - window.visualViewport.height)
      : 0;
    const newOffset = `${keyboardHeight}px`;
    if (newOffset !== lastOffset) {
      lastOffset = newOffset;
      document.documentElement.style.setProperty(
        '--keyboard-offset',
        newOffset
      );
    }
  };

  window.visualViewport.addEventListener('resize', handleViewportChange);
  window.visualViewport.addEventListener('scroll', handleViewportChange);
  window.addEventListener('orientationchange', () => {
    setTimeout(handleViewportChange, 100);
  });

  // Initial run
  handleViewportChange();
})();

window.injectAccessibility = function () {
  /* ── Settings ── */
  const defaultSettings = {
    font: 'default',
    size: 'default',
    theme: 'default',
    links: false,
    spacing: false,
    cursor: false,
    ruler: false,
    audio: false,
    motion: false,
  };

  let settings =
    JSON.parse(localStorage.getItem('sap-a11y-settings')) || defaultSettings;
  if (typeof settings.audio === 'undefined') settings.audio = false;
  if (typeof settings.motion === 'undefined') settings.motion = false;

  // Global Audio Confirmation Chime Player
  window.playAudioConfirmation = function () {
    const currentSettings = JSON.parse(
      localStorage.getItem('sap-a11y-settings')
    );
    if (currentSettings && currentSettings.audio) {
      if (
        typeof AudioContext === 'undefined' &&
        typeof webkitAudioContext === 'undefined'
      )
        return;
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();

        // Chime Note 1
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        gain1.gain.setValueAtTime(0, ctx.currentTime);
        gain1.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.05);
        gain1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);

        osc1.connect(gain1);
        gain1.connect(ctx.destination);

        // Chime Note 2
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(880.0, ctx.currentTime + 0.08); // A5
        gain2.gain.setValueAtTime(0, ctx.currentTime + 0.08);
        gain2.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.13);
        gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.4);
        osc2.start(ctx.currentTime + 0.08);
        osc2.stop(ctx.currentTime + 0.5);
      } catch (e) {
        console.warn('AudioContext playback blocked or failed:', e);
      }
    }
  };

  const applySettings = () => {
    document.body.classList.remove('a11y-font-serif', 'a11y-font-dyslexic');
    if (settings.font === 'serif')
      document.body.classList.add('a11y-font-serif');
    if (settings.font === 'dyslexic')
      document.body.classList.add('a11y-font-dyslexic');

    document.body.classList.remove('a11y-fs-lg', 'a11y-fs-xl');
    if (settings.size === 'large') document.body.classList.add('a11y-fs-lg');
    if (settings.size === 'extra') document.body.classList.add('a11y-fs-xl');

    const toggleLinks = document.getElementById('a11yToggleLinks');
    const toggleSpacing = document.getElementById('a11yToggleSpacing');
    const toggleCursor = document.getElementById('a11yToggleCursor');
    const toggleRuler = document.getElementById('a11yToggleRuler');
    const toggleAudio = document.getElementById('a11yToggleAudio');
    const toggleMotion = document.getElementById('a11yToggleMotion');

    if (settings.links) {
      document.body.classList.add('a11y-links-highlight');
      if (toggleLinks) toggleLinks.classList.add('active');
    } else {
      document.body.classList.remove('a11y-links-highlight');
      if (toggleLinks) toggleLinks.classList.remove('active');
    }

    if (settings.spacing) {
      document.body.classList.add('a11y-spacing-wide');
      if (toggleSpacing) toggleSpacing.classList.add('active');
    } else {
      document.body.classList.remove('a11y-spacing-wide');
      if (toggleSpacing) toggleSpacing.classList.remove('active');
    }

    if (settings.cursor) {
      document.body.classList.add('a11y-cursor-large');
      if (toggleCursor) toggleCursor.classList.add('active');
    } else {
      document.body.classList.remove('a11y-cursor-large');
      if (toggleCursor) toggleCursor.classList.remove('active');
    }

    if (settings.audio) {
      if (toggleAudio) toggleAudio.classList.add('active');
    } else {
      if (toggleAudio) toggleAudio.classList.remove('active');
    }

    if (settings.motion) {
      document.body.classList.add('a11y-reduce-motion');
      if (toggleMotion) toggleMotion.classList.add('active');
    } else {
      document.body.classList.remove('a11y-reduce-motion');
      if (toggleMotion) toggleMotion.classList.remove('active');
    }

    let rulerEl = document.getElementById('a11yReadingRuler');
    if (settings.ruler) {
      if (toggleRuler) toggleRuler.classList.add('active');
      if (!rulerEl) {
        rulerEl = document.createElement('div');
        rulerEl.id = 'a11yReadingRuler';
        rulerEl.className = 'a11y-reading-ruler';
        document.body.appendChild(rulerEl);
      }
      if (!window._rulerMoveListener) {
        window._rulerMoveListener = (e) => {
          rulerEl.style.top = e.clientY + 'px';
        };
        window.addEventListener('mousemove', window._rulerMoveListener);
      }
    } else {
      if (toggleRuler) toggleRuler.classList.remove('active');
      if (rulerEl) rulerEl.remove();
      if (window._rulerMoveListener) {
        window.removeEventListener('mousemove', window._rulerMoveListener);
        window._rulerMoveListener = null;
      }
    }

    const panel = document.getElementById('settingsPanel');
    if (panel) {
      panel.querySelectorAll('.a11y-btn[data-a11y-font]').forEach((b) => {
        b.classList.toggle('active', b.dataset.a11yFont === settings.font);
      });
      panel.querySelectorAll('.a11y-btn[data-a11y-size]').forEach((b) => {
        b.classList.toggle('active', b.dataset.a11ySize === settings.size);
      });
    }
  };

  applySettings();

  const panel = document.getElementById('settingsPanel');
  if (panel) {
    const trigger = panel.querySelector('#a11yAccordionTrigger');
    const content = panel.querySelector('#a11yAccordionContent');
    if (trigger && content) {
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const expanded = trigger.getAttribute('aria-expanded') === 'true';
        trigger.setAttribute('aria-expanded', !expanded);
        content.classList.toggle('open', !expanded);
      });
    }

    panel.addEventListener('click', (e) => {
      const target = e.target.closest('.a11y-btn');
      if (target) {
        if (target.id === 'panelThemeToggleBtn') return;

        e.stopPropagation();
        if (target.dataset.a11yFont) {
          settings.font = target.dataset.a11yFont;
        } else if (target.dataset.a11ySize) {
          settings.size = target.dataset.a11ySize;
        } else if (target.id === 'a11yToggleLinks') {
          settings.links = !settings.links;
        } else if (target.id === 'a11yToggleSpacing') {
          settings.spacing = !settings.spacing;
        } else if (target.id === 'a11yToggleCursor') {
          settings.cursor = !settings.cursor;
        } else if (target.id === 'a11yToggleRuler') {
          settings.ruler = !settings.ruler;
        } else if (target.id === 'a11yToggleMotion') {
          settings.motion = !settings.motion;
        } else if (target.id === 'a11yToggleAudio') {
          settings.audio = !settings.audio;
          if (settings.audio) {
            setTimeout(() => {
              if (typeof window.playAudioConfirmation === 'function') {
                window.playAudioConfirmation();
              }
            }, 50);
          }
        } else if (target.id === 'a11yResetBtn') {
          settings = {
            font: 'default',
            size: 'default',
            theme: 'default',
            links: false,
            spacing: false,
            cursor: false,
            ruler: false,
            audio: false,
            motion: false,
          };
          localStorage.setItem('sap-a11y-settings', JSON.stringify(settings));
          localStorage.removeItem('sap-theme');
          window.isDark = false;
          document.body.classList.remove('dark');
          updateThemeUI();
          updateAboutLogo();
          applySettings();
          
          if (trigger && content) {
            trigger.setAttribute('aria-expanded', 'false');
            content.classList.remove('open');
          }
          return;
        }
        localStorage.setItem('sap-a11y-settings', JSON.stringify(settings));
        applySettings();
      }
    });
  }
};
