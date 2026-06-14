'use strict';

window._isAuthorsPage = true;
let _authBooks = [];
window._allAuthors = [];

function renderAuthorGrid(authors, books) {
  const grid = document.getElementById('authorGrid');
  if (!grid) return;

  function getCleanSortName(name) {
    return name.replace(/^(Atty\.|Dr\.|Fr\.|Hon\.|JD|PhD)\s+/i, '').trim();
  }

  function getStartingLetter(name) {
    const cleanName = getCleanSortName(name);
    if (!cleanName) return '#';
    const firstChar = cleanName.charAt(0).toUpperCase();
    if (firstChar >= 'A' && firstChar <= 'Z') {
      return firstChar;
    }
    return '#';
  }

  // Sort alphabetically by clean sort name
  const sortedAuthors = [...authors].sort((a, b) => {
    const nameA = getCleanSortName(a.name);
    const nameB = getCleanSortName(b.name);
    return nameA.localeCompare(nameB);
  });

  // Group by starting letter
  const grouped = {};
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  alphabet.forEach((letter) => {
    grouped[letter] = [];
  });
  grouped['#'] = [];

  sortedAuthors.forEach((a) => {
    const letter = getStartingLetter(a.name);
    if (grouped[letter]) {
      grouped[letter].push(a);
    } else {
      grouped['#'].push(a);
    }
  });

  // Build index bar HTML
  const indexBar = document.getElementById('authorIndexBar');
  if (indexBar) {
    indexBar.innerHTML = alphabet
      .map((letter) => {
        const hasAuthors = grouped[letter] && grouped[letter].length > 0;
        if (hasAuthors) {
          return `<button class="index-letter" data-letter="${letter}">${letter}</button>`;
        } else {
          return `<button class="index-letter" disabled>${letter}</button>`;
        }
      })
      .join('');

    // Bind event listener (event delegation) once
    if (!indexBar.dataset.listenerBound) {
      indexBar.dataset.listenerBound = 'true';
      indexBar.addEventListener('click', (e) => {
        const btn = e.target.closest('.index-letter');
        if (btn && !btn.disabled) {
          const letter = btn.dataset.letter;
          const targetHeader = document.getElementById(`group-${letter}`);
          const mainContent = document.getElementById('mainContent');
          if (targetHeader) {
            const isDesktop = window.innerWidth > 900;
            const topbarHeight =
              document.querySelector('.topbar')?.offsetHeight || 58;
            const barHeight = indexBar.offsetHeight || 38;
            const gap = 12; // breathing room below sticky bar
            if (
              isDesktop &&
              mainContent &&
              mainContent.scrollHeight > mainContent.clientHeight
            ) {
              // Desktop: mainContent is the scroll container
              const rect = targetHeader.getBoundingClientRect();
              const containerRect = mainContent.getBoundingClientRect();
              const topOffset =
                mainContent.scrollTop +
                rect.top -
                containerRect.top -
                barHeight -
                gap;
              mainContent.scrollTo({
                top: Math.max(0, topOffset),
                behavior: 'smooth',
              });
            } else {
              // Mobile / fallback: window is the scroll container
              const rect = targetHeader.getBoundingClientRect();
              const topOffset =
                window.scrollY + rect.top - topbarHeight - barHeight - gap;
              window.scrollTo({
                top: Math.max(0, topOffset),
                behavior: 'smooth',
              });
            }
          }
        }
      });
    }
  }

  // Build grid HTML with group headers
  let gridHTML = '';
  alphabet.forEach((letter) => {
    const list = grouped[letter];
    if (list && list.length > 0) {
      gridHTML += `<h2 class="author-group-header" id="group-${letter}" style="grid-column: 1 / -1;">${letter}</h2>`;
      gridHTML += list
        .map((a) => {
          const key = a.name.split(',')[0].split('(')[0].trim();
          const cnt = books.filter(
            (b) =>
              (b.author && b.author.includes(key)) ||
              (b.editor && b.editor.includes(key))
          ).length;
          const sName = sanitizeText(a.name);
          const sBio = sanitizeText(a.bio);
          const sImg = a.img ? sanitizeUrl(a.img) : '';

          return `<div class="author-card cursor-pointer" role="listitem" data-name="${sName}" tabindex="0">
          <div class="author-card-avatar">
            ${sImg ? `<img src="${sImg}" alt="${sName}" loading="eager" decoding="async" onerror="this.parentElement.textContent='${initials(a.name)}'">` : initials(a.name)}
          </div>
          <div class="author-card-details">
            <div class="author-card-name">${sName}</div>
            <div class="author-card-bio">${sBio}</div>
          </div>
          ${cnt ? `<div class="author-card-count">${cnt} title${cnt !== 1 ? 's' : ''}</div>` : ''}
        </div>`;
        })
        .join('');
    }
  });

  // Handle '#' group if any
  const hashList = grouped['#'];
  if (hashList && hashList.length > 0) {
    gridHTML += `<h2 class="author-group-header" id="group-hash" style="grid-column: 1 / -1;">#</h2>`;
    gridHTML += hashList
      .map((a) => {
        const key = a.name.split(',')[0].split('(')[0].trim();
        const cnt = books.filter(
          (b) =>
            (b.author && b.author.includes(key)) ||
            (b.editor && b.editor.includes(key))
        ).length;
        const sName = sanitizeText(a.name);
        const sBio = sanitizeText(a.bio);
        const sImg = a.img ? sanitizeUrl(a.img) : '';

        return `<div class="author-card cursor-pointer" role="listitem" data-name="${sName}" tabindex="0">
        <div class="author-card-avatar">
          ${sImg ? `<img src="${sImg}" alt="${sName}" loading="eager" decoding="async" onerror="this.parentElement.textContent='${initials(a.name)}'">` : initials(a.name)}
        </div>
        <div class="author-card-details">
          <div class="author-card-name">${sName}</div>
          <div class="author-card-bio">${sBio}</div>
        </div>
        ${cnt ? `<div class="author-card-count">${cnt} title${cnt !== 1 ? 's' : ''}</div>` : ''}
      </div>`;
      })
      .join('');
  }

  grid.innerHTML = gridHTML;

  if (typeof window.restoreScrollDepth === 'function') {
    window.restoreScrollDepth();
  }
}

window.viewAuthorOnPage = function (name) {
  const allAuthors = typeof AUTHORS !== 'undefined' ? AUTHORS : [];
  const a = allAuthors.find((x) => x.name === name);
  if (!a) return;
  const key = a.name.split(',')[0].split('(')[0].trim();
  const books = _authBooks.filter(
    (b) =>
      (b.author && b.author.includes(key)) ||
      (b.editor && b.editor.includes(key))
  );

  const sImg = a.img ? sanitizeUrl(a.img) : '';
  const sName = sanitizeText(a.name);

  const avatarEl = document.getElementById('amAvatar');
  if (avatarEl) {
    avatarEl.innerHTML = sImg
      ? `<img src="${sImg}" alt="${sName}" loading="eager" onerror="this.parentElement.textContent='${initials(a.name)}'">`
      : initials(a.name);
  }
  document.getElementById('amName').textContent = a.name;
  document.getElementById('amBio').textContent = a.bio;

  const booksEl = document.getElementById('amBooks');
  if (booksEl) {
    booksEl.innerHTML = books.length
      ? books
          .map((b) => {
            const sTitle = sanitizeText(b.title);
            const slug = window.getSlug(b.title);
            const bImg = b.img ? sanitizeUrl(b.img) : '';
            return `<div role="listitem" class="cursor-pointer am-book-card" data-slug="${slug}" tabindex="0">
            <div class="am-book-cover-wrap">
              ${bImg ? `<img class="det-cover" src="${bImg}" alt="${sTitle}" loading="eager">` : `<div class="am-book-placeholder">${sTitle}</div>`}
            </div>
            <div class="am-book-title">${sTitle}</div>
          </div>`;
          })
          .join('')
      : '<p class="am-no-books">No listed publications.</p>';
  }

  // URL state update
  const url = new URL(window.location.href);
  const slug = window.getSlug(a.name);
  if (url.searchParams.get('author') !== slug) {
    url.searchParams.set('author', slug);
    window.history.replaceState({}, '', url.pathname + url.search);
  }

  openModal('authorModal');
};

window._authorSearch = function (query) {
  if (!query) {
    window.transitionTo(() => {
      renderAuthorGrid(window._allAuthors, _authBooks);
    });
    return;
  }
  const q = query.toLowerCase().trim();
  const filtered = window._allAuthors.filter(
    (a) =>
      a.name.toLowerCase().includes(q) ||
      (a.bio && a.bio.toLowerCase().includes(q))
  );
  window.transitionTo(() => {
    renderAuthorGrid(filtered, _authBooks);
  });
};

window._authorSearchPreds = function (v) {
  const pred = document.getElementById('searchPreds');
  if (!pred) return;
  const q = v.toLowerCase().trim();
  if (q) {
    const m = window._allAuthors
      .filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.bio && a.bio.toLowerCase().includes(q))
      )
      .slice(0, 7);
    if (m.length) {
      const escapedQuery = q.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const highlightReg = escapedQuery
        ? new RegExp(`(${escapedQuery})`, 'gi')
        : null;
      const highlight = (txt) => {
        if (!highlightReg || !txt) return txt;
        return txt.replace(highlightReg, '<strong>$1</strong>');
      };
      pred.innerHTML = m
        .map((a) => {
          const sName = sanitizeText(a.name);
          const sNameHighlighted = highlight(sName);
          const sImg = a.img ? sanitizeUrl(a.img) : '';
          const avatarHtml = sImg
            ? `<img class="pred-thumb author-thumb" src="${sImg}" alt="${sName}" loading="lazy" width="30" height="30">`
            : `<div class="pred-thumb-placeholder author-thumb-placeholder">${initials(a.name)}</div>`;
          return `<div class="pred-item author-pred-item" role="option" tabindex="0" data-name="${sName}">
          ${avatarHtml}
          <div class="pred-text-wrap">
            <div class="pred-title">${sNameHighlighted}</div>
            <div class="pred-meta">${highlight(sanitizeText(a.bio || ''))}</div>
          </div>
        </div>`;
        })
        .join('');
      pred.style.display = 'block';
    } else pred.style.display = 'none';
  } else pred.style.display = 'none';
};

document.addEventListener('astro:page-load', async () => {
  if (document.body.dataset.page !== 'authors') return;
  // Bind dynamic event listeners to comply with CSP
  const grid = document.getElementById('authorGrid');
  if (grid) {
    grid.addEventListener('click', (e) => {
      const card = e.target.closest('.author-card');
      if (card && card.dataset.name) {
        viewAuthorOnPage(card.dataset.name);
      }
    });
    grid.addEventListener('keydown', (e) => {
      const card = e.target.closest('.author-card');
      if (card && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        viewAuthorOnPage(card.dataset.name);
      }
    });
  }

  const amBooks = document.getElementById('amBooks');
  if (amBooks) {
    amBooks.addEventListener('click', (e) => {
      const card = e.target.closest('.am-book-card');
      if (card && card.dataset.slug) {
        closeModal('authorModal');
        window.location.href = window.resolveUrl('index.html?book=' + card.dataset.slug);
      }
    });
    amBooks.addEventListener('keydown', (e) => {
      const card = e.target.closest('.am-book-card');
      if (card && e.key === 'Enter') {
        closeModal('authorModal');
        window.location.href = window.resolveUrl('index.html?book=' + card.dataset.slug);
      }
    });
  }

  const amCloseBtn = document.getElementById('authorModalCloseBtn');
  if (amCloseBtn) {
    amCloseBtn.addEventListener('click', () => closeModal('authorModal'));
  }

  // Search Predictions interaction handler
  const preds = document.getElementById('searchPreds');
  if (preds) {
    preds.addEventListener('click', (e) => {
      const item = e.target.closest('.pred-item');
      if (item && item.dataset.name) {
        viewAuthorOnPage(item.dataset.name);
        closePreds();
      }
    });
    preds.addEventListener('keydown', (e) => {
      const item = e.target.closest('.pred-item');
      if (item && e.key === 'Enter') {
        viewAuthorOnPage(item.dataset.name);
        closePreds();
      }
    });
  }

  let authorsData;
  if (window.AUTHORS_CACHE && window.AUTHORS_CACHE.length > 0) {
    authorsData = window.AUTHORS_CACHE;
  } else {
    authorsData = await SheetsCMS.getAuthors().catch(() =>
      typeof AUTHORS !== 'undefined' ? AUTHORS : []
    );
    window.AUTHORS_CACHE = authorsData;
  }
  window._allAuthors = authorsData;

  if (window.BOOKS_CACHE && window.BOOKS_CACHE.length > 0) {
    _authBooks = window.BOOKS_CACHE;
  } else {
    _authBooks = await SheetsCMS.getBooks().catch(() =>
      typeof BOOKS !== 'undefined' ? BOOKS : []
    );
    window.BOOKS_CACHE = _authBooks;
  }

  window.transitionTo(() => {
    renderAuthorGrid(authorsData, _authBooks);
  });

  const params = new URLSearchParams(window.location.search);
  const authorParam = params.get('author');
  if (authorParam) {
    const matchedAuthor = authorsData.find(
      (a) => window.getSlug(a.name) === authorParam
    );
    if (matchedAuthor) viewAuthorOnPage(matchedAuthor.name);
  }
});
