'use strict';

/* ── Catalog Page Logic ────────────────────────────────────── */
window._isCatalogPage = true;

const _booksRaw = [];
const _books = new Proxy(_booksRaw, {
  set(target, property, value, receiver) {
    const success = Reflect.set(target, property, value, receiver);
    if (
      success &&
      window._initCompleted &&
      (property === 'length' || !isNaN(Number(property)))
    ) {
      if (window._booksProxyTimeout) clearTimeout(window._booksProxyTimeout);
      window._booksProxyTimeout = setTimeout(() => {
        if (typeof window.applyFilters === 'function') window.applyFilters();
      }, 50);
    }
    return success;
  },
});
window.yearFilter = window.yearFilter || 'All';
const CAT_ORDER_DEFAULT = [
  'Journal',
  'Poetry',
  'Fiction',
  'Non-Fiction',
  'Biography',
  'Inspirational',
  'Anthology',
  "Children's Literature",
  'General Reference',
];

let searchWorker = null;
let pagefind = null;
async function initPagefind() {
  if (pagefind) return pagefind;
  try {
    // Check if pagefind metadata exists before loading to prevent unhandled rejection errors in dev/cached modes
    const check = await fetch(window.resolveAssetUrl('/pagefind/pagefind-metadata.json'), { method: 'HEAD' });
    if (!check.ok) {
      return null;
    }
    pagefind = await import(window.resolveAssetUrl('/pagefind/pagefind.js'));
    await pagefind.init();
    return pagefind;
  } catch (err) {
    console.warn(
      'Pagefind initialization failed (normal on dev server or file:// protocol):',
      err
    );
    return null;
  }
}

async function searchWithPagefind(
  q,
  genres,
  yearFilter,
  minPrice,
  maxPrice,
  sortVal
) {
  const pf = await initPagefind();
  if (!pf) return null;

  const searchResult = await pf.search(q);
  const matchedIds = new Set();
  for (const item of searchResult.results) {
    const match = item.url.match(/\/books\/(b\d+)\.html/);
    if (match) {
      matchedIds.add(match[1]);
    }
  }

  const showAll = genres.includes('All') || genres.length === 0;
  const filtered = _books.filter((b) => {
    const mQ = matchedIds.has(b.id);
    const mY = yearFilter === 'All' || b.year.toString() === yearFilter;
    const mPrice = Number(b.price) >= minPrice && Number(b.price) <= maxPrice;
    const mGenre = showAll || genres.includes(b.category);
    return mQ && mY && mPrice && mGenre;
  });

  filtered.sort((a, b) => {
    if (q) {
      const indexA = searchResult.results.findIndex((item) =>
        item.url.includes(`/books/${a.id}.html`)
      );
      const indexB = searchResult.results.findIndex((item) =>
        item.url.includes(`/books/${b.id}.html`)
      );
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
    }
    if (sortVal === 'price-asc') return a.price - b.price;
    if (sortVal === 'price-desc') return b.price - a.price;
    if (sortVal === 'title-asc') return a.title.localeCompare(b.title);
    return b.year - a.year;
  });

  return filtered;
}

// Initialize Background Web Worker with gracefull local file:// fallback
try {
  if (window.Worker) {
    searchWorker = new Worker('js/search-worker.js');
    searchWorker.onmessage = function (e) {
      if (e.data.type === 'results') {
        const filtered = e.data.books;
        window.transitionTo(() => {
          renderShelves(filtered, 'All');
        });
      }
    };
  }
} catch (err) {
  console.warn(
    'Fuzzy search worker creation failed (likely local file:// protocol CORS limit). Running search on UI thread.',
    err
  );
}

/* ── Dynamic JSON-LD SEO ItemList Injection ── */
function injectSchemaAll(books) {
  const oldSchema = document.getElementById('sapBooksSchemaAll');
  if (oldSchema) oldSchema.remove();

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'sapBooksSchemaAll';
  script.text = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'San Anselmo Publications Book Catalog',
    numberOfItems: books.length,
    itemListElement: books.map((b, index) => {
      const ad = b._authorDisplay || '';
      const bookUrl =
        window.resolveUrl(window.location.origin + '/index.html?book=' + window.getSlug(b.title));
      const imgUrl = b.img ? window.location.origin + '/' + b.img : '';
      return {
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Book',
          '@id': bookUrl,
          name: b.title,
          url: bookUrl,
          image: imgUrl,
          description: b.blurb || '',
          author: {
            '@type': 'Person',
            name: ad || 'Various writers',
          },
          publisher: {
            '@type': 'Organization',
            name: 'San Anselmo Publications, Inc.',
            logo: window.location.origin + '/images/sap logo only.webp',
          },
          workExample: {
            '@type': 'Book',
            isbn: b.isbn || '',
            inLanguage: b.lang || 'English & Filipino',
          },
          offers: {
            '@type': 'Offer',
            price: Number(b.price),
            priceCurrency: 'PHP',
            url: bookUrl,
            availability:
              b.stock === 0 || b.stock === -2
                ? 'https://schema.org/OutOfStock'
                : 'https://schema.org/InStock',
            seller: {
              '@type': 'Organization',
              name: 'San Anselmo Publications, Inc.',
            },
          },
        },
      };
    }),
  });
  document.head.appendChild(script);
}

/* ── Main Thread Fuzzy Search Fallback (for file:// CORS protocol limits) ── */
function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let r0 = Array(b.length + 1)
    .fill(0)
    .map((_, i) => i);
  let r1 = Array(b.length + 1).fill(0);
  for (let i = 0; i < a.length; i++) {
    r1[0] = i + 1;
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      r1[j + 1] = Math.min(r1[j] + 1, r0[j + 1] + 1, r0[j] + cost);
    }
    r0 = [...r1];
  }
  return r0[b.length];
}

function fuzzyMatch(words, query) {
  if (!query) return true;
  const qWords = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (!qWords.length) return true;
  const wArr = Array.isArray(words) ? words : [];
  return qWords.every((qw) => {
    return wArr.some((tw) => {
      if (tw.startsWith(qw) || tw.includes(qw)) return true;
      const maxDist = qw.length <= 4 ? 1 : 2;
      // Math optimization: if length difference is larger than maxDist, Levenshtein is guaranteed to be larger
      if (Math.abs(qw.length - tw.length) > maxDist) return false;
      const dist = levenshtein(qw, tw);
      return dist <= maxDist;
    });
  });
}

function getRelevanceScore(b, query) {
  if (!query) return 0;
  const q = query.toLowerCase().trim();
  let score = 0;
  const title = b.title.toLowerCase();
  const author = (b._authorDisplay || '').toLowerCase();
  const cat = b.category.toLowerCase();
  const blurb = (b.blurb || '').toLowerCase();

  if (title === q) score += 30;
  else if (title.startsWith(q)) score += 20;
  else if (title.includes(q)) score += 10;

  if (author.includes(q)) score += 8;
  if (cat.includes(q)) score += 5;
  if (blurb.includes(q)) score += 2;

  const qWords = q.split(/\s+/).filter(Boolean);
  qWords.forEach((qw) => {
    if (title.includes(qw)) score += 5;
    if (author.includes(qw)) score += 3;
    if (blurb.includes(qw)) score += 1;
  });
  return score;
}

/* ── Search predictions ── */
window._catalogSearch = function (v) {
  const pred = document.getElementById('searchPreds');
  if (!pred) return;
  if (v.length > 0) {
    const q = v.toLowerCase().trim();
    const m = _books
      .filter((b) => fuzzyMatch(b._searchWords || [], q))
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
        .map((b) => {
          const sTitle = highlight(sanitizeText(b.title));
          const sAuthor = highlight(
            sanitizeText(b._authorDisplay || 'Various')
          );
          const sId = sanitizeText(b.id);
          const bImg = b.img ? sanitizeUrl(b.img) : '';
          const coverHtml = bImg
            ? `<img class="pred-thumb" src="${bImg}" alt="${sanitizeText(b.title)}" loading="lazy" width="30" height="45">`
            : `<div class="pred-thumb-placeholder">${initials(b.title)}</div>`;
          const genrePill = b.category
            ? `<span class="pred-cat-pill">${sanitizeText(b.category)}</span>`
            : '';
          return `<div class="pred-item" role="option" tabindex="0" data-id="${sId}">
          ${coverHtml}
          <div class="pred-text-wrap">
            <div class="pred-title" style="display:flex; align-items:center;">${sTitle} ${genrePill}</div>
            <div class="pred-meta">${sAuthor} · ${b.year} · ₱${Number(b.price).toLocaleString()}</div>
          </div>
        </div>`;
        })
        .join('');
      pred.style.display = 'block';
    } else pred.style.display = 'none';
  } else pred.style.display = 'none';
};

/* ── Bookshelf Visual Overlays and Zero-Bleed Heights ── */
window.updateShelfOverlays = function () {
  const shelves = document.querySelectorAll('.shelf-section');
  shelves.forEach((shelf) => {
    const totalCount = parseInt(shelf.getAttribute('data-count') || '0', 10);
    const shelfRow = shelf.querySelector('.shelf-row-books');
    const isExpanded = shelfRow && shelfRow.classList.contains('expanded');
    const cards = shelf.querySelectorAll('.book-card');

    // First, remove any existing overlays from all cards in this shelf
    cards.forEach((card) => {
      const existing = card.querySelector('.shelf-more-overlay');
      if (existing) existing.remove();
    });

    if (isExpanded) {
      return; // No overlay when expanded
    }

    // Determine viewport columns
    let cols = 6;
    if (window.innerWidth <= 768) {
      cols = 3;
    } else if (window.innerWidth <= 1024) {
      cols = 4;
    }

    if (totalCount > cols && cards.length >= cols) {
      const targetCard = cards[cols - 1];
      const coverWrap = targetCard.querySelector('.book-cover-wrap');
      if (coverWrap) {
        const n = totalCount - cols;
        const overlay = document.createElement('div');
        overlay.className = 'shelf-more-overlay';
        overlay.innerHTML = `<span class="more-num">+${n}</span><span class="more-lbl">more titles</span>`;
        coverWrap.appendChild(overlay);
      }
    }
  });
};

window.updateCollapsedHeights = function () {
  const rows = document.querySelectorAll('.shelf-row-books');
  rows.forEach((row) => {
    const firstCard = row.querySelector('.book-card');
    if (firstCard) {
      const cardHeight = firstCard.offsetHeight;
      const isMobile = window.innerWidth <= 768;
      const padding = isMobile ? 38.4 : 48;
      const collapsedHeight = cardHeight + padding + 1;
      row.style.setProperty('--collapsed-height', `${collapsedHeight}px`);
    }
  });
};

/* ── Bookshelf Rendering ── */
function renderCatShelfHTML(cat, catBooks, genreFilter, isFirstCategory) {
  if (!catBooks || !catBooks.length) return '';
  if (genreFilter !== 'All' && cat.toLowerCase() !== genreFilter.toLowerCase())
    return '';

  const sCat = sanitizeText(cat);
  const booksHTML = catBooks.map((b, idx) => renderCard(b, isFirstCategory && idx < 2)).join('');

  return `<div class="shelf-section" data-cat="${sCat}" data-count="${catBooks.length}" role="listitem">
    <div class="shelf-header">
      <div style="display: inline-flex; align-items: baseline; gap: 0.5rem;">
        <h2 class="shelf-cat-title">${sCat}</h2>
        <span class="shelf-count">· ${catBooks.length} title${catBooks.length !== 1 ? 's' : ''}</span>
      </div>
      <button class="shelf-see-all" data-genre="${sCat}" aria-expanded="false">SEE ALL &rarr;</button>
    </div>
    <div class="shelf-wrap">
      <div class="shelf-row-books" role="list" aria-label="${sCat}">
        ${booksHTML}
      </div>
      <div class="shelf-plank" aria-hidden="true"></div>
    </div>
  </div>`;
}

function renderShelves(books, genreFilter) {
  const grid = document.getElementById('catalogGrid');
  if (!grid) return;

  const totalCountEl = document.getElementById('searchTotalCount');
  if (totalCountEl) {
    totalCountEl.textContent = `${books.length} title${books.length !== 1 ? 's' : ''}`;
  }



  window._currentRenderId = (window._currentRenderId || 0) + 1;
  const renderId = window._currentRenderId;

  if (!books.length) {
    grid.innerHTML = `<div class="no-results premium-empty-state" style="padding: 4rem 1rem; text-align: center; color: var(--sepia);">
      <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.3; margin-bottom: 1rem; color: var(--terra); margin: 0 auto;">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
      <h3 style="font-family: var(--font-heading); color: var(--terra); font-size: 1.5rem; margin-bottom: 0.5rem; margin-top: 1rem;">No titles found</h3>
      <p style="margin-bottom: 1.5rem;">We couldn't find any books matching your current filters.</p>
      <button class="btn-outline" onclick="window.resetFilters()" style="margin: 0 auto;">Clear Filters</button>
    </div>`;
    if (typeof window.restoreScrollDepth === 'function') {
      window.restoreScrollDepth();
    }
    return;
  }

  const catOrder = [...new Set(books.map((b) => b.category))].sort((a, b) => {
    const ai = CAT_ORDER_DEFAULT.indexOf(a),
      bi = CAT_ORDER_DEFAULT.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const grouped = {};
  catOrder.forEach((c) => (grouped[c] = []));
  books.forEach((b) => {
    if (grouped[b.category]) grouped[b.category].push(b);
  });

  if (grouped['Journal'])
    grouped['Journal'].sort((a, b) => (b.issueNum || 0) - (a.issueNum || 0));

  const isSingleGenre = genreFilter !== 'All';
  const immediateCats = isSingleGenre
    ? catOrder.filter((c) => c === genreFilter)
    : catOrder.slice(0, 2);
  const deferredCats = isSingleGenre ? [] : catOrder.slice(2);

  let html = '';
  immediateCats.forEach((cat, index) => {
    html += renderCatShelfHTML(cat, grouped[cat], genreFilter, index === 0);
  });

  grid.innerHTML =
    html ||
    `<div class="no-results premium-empty-state" style="padding: 4rem 1rem; text-align: center; color: var(--sepia);">
    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.3; margin-bottom: 1rem; color: var(--terra); margin: 0 auto;">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
    <h3 style="font-family: var(--font-heading); color: var(--terra); font-size: 1.5rem; margin-bottom: 0.5rem; margin-top: 1rem;">No titles found</h3>
    <p style="margin-bottom: 1.5rem;">We couldn't find any books matching your current filters.</p>
    <button class="btn-outline" onclick="window.resetFilters()" style="margin: 0 auto;">Clear Filters</button>
  </div>`;

  if (deferredCats.length > 0) {
    let idx = 0;

    // requestIdleCallback yield strategy with standard microtask fallback for Safari compatibility
    const scheduleIdle =
      window.requestIdleCallback ||
      function (cb) {
        return setTimeout(
          () => cb({ timeRemaining: () => 50, didTimeout: true }),
          1
        );
      };

    const processNextBatch = (deadline) => {
      if (window._currentRenderId !== renderId) return;

      while (
        idx < deferredCats.length &&
        (deadline.timeRemaining() > 1 || deadline.didTimeout)
      ) {
        const cat = deferredCats[idx];
        const shelfHtml = renderCatShelfHTML(
          cat,
          grouped[cat],
          genreFilter,
          false
        );
        if (shelfHtml) {
          const temp = document.createElement('div');
          temp.innerHTML = shelfHtml;
          while (temp.firstChild) {
            grid.appendChild(temp.firstChild);
          }
        }
        idx++;
      }

      if (idx < deferredCats.length) {
        scheduleIdle(processNextBatch);
      } else {
        if (typeof window.updateCollapsedHeights === 'function') {
          window.updateCollapsedHeights();
        }
        if (typeof window.updateShelfOverlays === 'function') {
          window.updateShelfOverlays();
        }
        if (typeof window.restoreScrollDepth === 'function') {
          window.restoreScrollDepth();
        }
      }
    };
    scheduleIdle(processNextBatch);
  } else {
    if (typeof window.updateCollapsedHeights === 'function') {
      window.updateCollapsedHeights();
    }
    if (typeof window.updateShelfOverlays === 'function') {
      window.updateShelfOverlays();
    }
    if (typeof window.restoreScrollDepth === 'function') {
      window.restoreScrollDepth();
    }
  }
}

function renderCard(b, isLcp) {
  const ad = b._authorDisplay || '';
  const sTitle = sanitizeText(b.title);
  const sAuthor = sanitizeText(ad);
  const sId = sanitizeText(b.id);
  const imgSrc = b.img ? sanitizeUrl(b.img) : '';
  const encodedImgSrc = imgSrc.replace(/ /g, '%20');
  const webpSrc = encodedImgSrc.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  const loadingAttr = isLcp ? 'fetchpriority="high"' : 'loading="lazy"';

  return `<div class="book-card" role="button" tabindex="0" data-id="${sId}" aria-label="${sTitle}${ad ? ' by ' + sAuthor : ''}">
    <div class="book-cover-wrap">
      ${
        imgSrc
          ? `<picture class="book-cover-picture">
           <source srcset="${webpSrc}" type="image/webp" sizes="(max-width: 600px) 90px, 120px">
           <img class="book-cover-img" src="${encodedImgSrc}" alt="Cover of ${sTitle}" width="120" height="180" ${loadingAttr} sizes="(max-width: 600px) 90px, 120px">
         </picture>`
          : ''
      }
      <div class="bk-placeholder ${imgSrc ? 'hidden' : 'flex-column-center'}" aria-hidden="true">
        <svg class="icon" aria-hidden="true" focusable="false"><use href="#icon-book"></use></svg>
        <span class="ph-t">${sTitle}</span>
      </div>
    </div>
    <div class="book-title-txt">${sTitle}</div>
    <div class="book-author-txt">${sAuthor}</div>
    <div class="book-price-txt" style="margin-top: auto;">₱${Number(b.price).toLocaleString()}</div>
  </div>`;
}

/* ── View Book ── */
window.viewBook = function (id) {
  const b = _books.find((x) => x.id === id);
  if (!b) return;
  const ad = b._authorDisplay || '';

  document.getElementById('mCategory').textContent = b.category;
  document.getElementById('mTitle').textContent = b.title;

  const mA = document.getElementById('mAuthor');
  if (ad) {
    mA.textContent = ad;
    mA.style.display = '';
  } else mA.style.display = 'none';

  document.getElementById('mPrice').textContent =
    `₱${Number(b.price).toLocaleString()}`;
  document.getElementById('mYear').textContent = b.year;
  document.getElementById('mLang').textContent = b.lang || '—';
  document.getElementById('mBlurb').textContent = b.blurb;
  const mStock = document.getElementById('mStock');
  if (mStock) {
    mStock.innerHTML = `<span class="badge-label badge-checking" style="background: var(--ash); color: var(--charcoal); display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.8rem; font-weight: 500; padding: 0.2rem 0.5rem; border-radius: 4px;">
      <span class="loading-spinner" style="width: 8px; height: 8px; border-width: 1.5px; border-top-color: var(--terra); display: inline-block; animation: spin 0.8s linear infinite;"></span> Checking...
    </span>`;
  }

  // Fetch live inventory status with fallback
  (async function () {
    try {
      const response = await fetch(
        window.resolveAssetUrl(`/api/inventory?id=${encodeURIComponent(b.id)}`)
      );
      if (response.ok) {
        const data = await response.json();
        if (data && typeof data.stock !== 'undefined') {
          b.stock = data.stock;
          if (data.note) b.note = data.note;
        }
      }
    } catch (err) {
      // Fallback is expected when offline or running statically
    } finally {
      const currentModal = document.getElementById('detailModal');
      if (currentModal && currentModal.open && mStock) {
        mStock.innerHTML = stockHtml(b);

        // Disable cart button if out of stock
        const addToCartBtn = document.getElementById('mAddToCartBtn');
        if (addToCartBtn) {
          if (
            b.stock === 0 ||
            b.stock === -2 ||
            (b.note && b.note.toLowerCase().includes('sold out'))
          ) {
            addToCartBtn.disabled = true;
            addToCartBtn.classList.add('disabled');
            addToCartBtn.innerHTML = `<svg class="icon" aria-hidden="true" focusable="false"><use href="#icon-cart"></use></svg> Out of Stock`;
          } else {
            addToCartBtn.disabled = false;
            addToCartBtn.classList.remove('disabled');
            addToCartBtn.innerHTML = `<svg class="icon" aria-hidden="true" focusable="false"><use href="#icon-cart"></use></svg> Add to Cart`;
          }
        }
      }
    }
  })();

  const iw = document.getElementById('mIsbnWrap');
  if (b.isbn && b.isbn.trim()) {
    document.getElementById('mISBN').textContent = b.isbn;
    iw.style.display = '';
  } else iw.style.display = 'none';

  const gw = document.getElementById('mGumroadBtn');
  if (b.gumroad) {
    gw.href = sanitizeUrl(b.gumroad);
    gw.style.display = 'inline-flex';
    if (!document.getElementById('gumroadScript')) {
      const gscript = document.createElement('script');
      gscript.src = 'https://gumroad.com/js/gumroad.js';
      gscript.id = 'gumroadScript';
      gscript.async = true;
      document.body.appendChild(gscript);
    }
  } else {
    gw.style.display = 'none';
  }

  // Reset TTS button state on view
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  const speakBtn = document.getElementById('mSpeakBtn');
  if (speakBtn) {
    speakBtn.classList.remove('speaking');
    speakBtn.setAttribute('data-tooltip', 'Listen');
    const textSpan = speakBtn.querySelector('.btn-text');
    if (textSpan) textSpan.textContent = 'Listen';

    speakBtn.onclick = () => {
      if (!window.speechSynthesis) {
        window.showToast('Text-to-speech is not supported in this browser.');
        return;
      }
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        speakBtn.classList.remove('speaking');
        speakBtn.setAttribute('data-tooltip', 'Listen');
        if (textSpan) textSpan.textContent = 'Listen';
        return;
      }

      const textToSpeak = `${b.title} by ${ad || 'Various writers'}. ${b.blurb}`;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const isTagalog =
        (b.lang &&
          (b.lang.toLowerCase().includes('filipino') ||
            b.lang.toLowerCase().includes('tagalog'))) ||
        (b.blurb &&
          (b.blurb.includes('ng ') ||
            b.blurb.includes('mga ') ||
            b.blurb.includes('sa ')));
      utterance.lang = isTagalog ? 'tl-PH' : 'en-US';

      utterance.onend = () => {
        speakBtn.classList.remove('speaking');
        speakBtn.setAttribute('data-tooltip', 'Listen');
        if (textSpan) textSpan.textContent = 'Listen';
      };
      utterance.onerror = () => {
        speakBtn.classList.remove('speaking');
        speakBtn.setAttribute('data-tooltip', 'Listen');
        if (textSpan) textSpan.textContent = 'Listen';
      };

      speakBtn.classList.add('speaking');
      speakBtn.setAttribute('data-tooltip', 'Stop');
      if (textSpan) textSpan.textContent = 'Stop';
      window.speechSynthesis.speak(utterance);
    };
  }

  const shareBtn = document.getElementById('mShareBtn');
  if (shareBtn) {
    shareBtn.setAttribute('data-tooltip', 'Share');
    shareBtn.classList.remove('copied');
    shareBtn.onclick = () => {
      if (shareBtn.classList.contains('copied')) return;
      const shareUrl = `${window.location.origin}${window.location.pathname}?book=${window.getSlug(b.title)}`;
      const origHTML = shareBtn.innerHTML;
      const copySuccess = () => {
        window.showToast('Link copied to clipboard!');
        if (typeof window.playAudioConfirmation === 'function') {
          window.playAudioConfirmation();
        }
        shareBtn.setAttribute('data-tooltip', 'Copied!');
        shareBtn.classList.add('copied');
        shareBtn.innerHTML = `
          <svg class="icon" aria-hidden="true" focusable="false" style="animation: pop 0.25s var(--spring) both; color: var(--gold);">
            <use href="#icon-check"></use>
          </svg>
        `;
        setTimeout(() => {
          shareBtn.setAttribute('data-tooltip', 'Share');
          shareBtn.classList.remove('copied');
          shareBtn.innerHTML = origHTML;
        }, 2000);
      };
      const copyFail = () => {
        const textInput = document.createElement('textarea');
        textInput.value = shareUrl;
        textInput.style.position = 'fixed';
        document.body.appendChild(textInput);
        textInput.focus();
        textInput.select();
        try {
          document.execCommand('copy');
          copySuccess();
        } catch (err) {
          window.showToast('Unable to copy link.');
        }
        document.body.removeChild(textInput);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(shareUrl)
          .then(copySuccess)
          .catch(copyFail);
      } else {
        copyFail();
      }
    };
  }

  const cv = document.getElementById('mCover'),
    ph = cv.parentElement.nextElementSibling;
  const webpSrc = document.getElementById('mCoverWebp');
  if (b.img) {
    cv.parentElement.style.display = 'none';
    ph.style.display = 'flex';
    cv.onload = null;

    const sImg = sanitizeUrl(b.img);
    if (webpSrc) webpSrc.srcset = sImg;
    cv.src = sImg;

    cv.onload = () => {
      cv.parentElement.style.display = '';
      ph.style.display = 'none';
    };
  } else {
    cv.parentElement.style.display = 'none';
    ph.style.display = 'flex';
  }

  // Bind dynamic add-to-cart listener
  const addToCartBtn = document.getElementById('mAddToCartBtn');
  if (addToCartBtn) {
    addToCartBtn.onclick = () => {
      window.addToCart(b.id, b.title, b.price, b.img);
    };
  }

  // SEO Updates
  if (!window._originalTitle) window._originalTitle = document.title;
  document.title = `${b.title} — San Anselmo Publications, Inc.`;

  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) {
    metaDesc = document.createElement('meta');
    metaDesc.name = 'description';
    document.head.appendChild(metaDesc);
  }
  if (!window._originalMetaDesc) {
    window._originalMetaDesc = metaDesc.content;
  }
  const descContent = `${b.title} by ${ad || 'Various'}. ${b.blurb.slice(0, 150)}...`;
  metaDesc.content = descContent;

  // Dynamic OG updates
  let ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.content = `${b.title} — San Anselmo Publications, Inc.`;
  let ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.content = descContent;
  let ogImg = document.querySelector('meta[property="og:image"]');
  if (ogImg && b.img) {
    ogImg.content = b.img.startsWith('http')
      ? b.img
      : window.location.origin + '/' + b.img;
  }
  let twTitle = document.querySelector('meta[name="twitter:title"]');
  if (twTitle) twTitle.content = `${b.title} — San Anselmo Publications, Inc.`;
  let twDesc = document.querySelector('meta[name="twitter:description"]');
  if (twDesc) twDesc.content = descContent;
  let twImg = document.querySelector('meta[name="twitter:image"]');
  if (twImg && b.img) {
    twImg.content = b.img.startsWith('http')
      ? b.img
      : window.location.origin + '/' + b.img;
  }

  // Inject dynamic book JSON-LD
  const oldSchema = document.getElementById('bookSchema');
  if (oldSchema) oldSchema.remove();

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'bookSchema';
  script.text = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Book',
    name: b.title,
    author: {
      '@type': 'Person',
      name: ad || 'Various writers',
    },
    workExample: {
      '@type': 'Book',
      isbn: b.isbn || '',
      inLanguage: b.lang || 'English & Filipino',
    },
    offers: {
      '@type': 'Offer',
      price: Number(b.price),
      priceCurrency: 'PHP',
      availability:
        b.stock === 0 || b.stock === -2
          ? 'https://schema.org/OutOfStock'
          : 'https://schema.org/InStock',
    },
  });
  document.head.appendChild(script);

  // Deep linking URL state update
  const url = new URL(window.location.href);
  const slug = window.getSlug(b.title);
  if (url.searchParams.get('book') !== slug) {
    url.searchParams.set('book', slug);
    window.history.replaceState({}, '', url.pathname + url.search);
  }

  openModal('detailModal');
};

/* ── View Author ── */
window.viewAuthor = function (name) {
  const allAuthors = typeof AUTHORS !== 'undefined' ? AUTHORS : [];
  const a = allAuthors.find((x) => x.name === name);
  if (!a) return;
  const key = a.name.split(',')[0].split('(')[0].trim();
  const books = _books.filter(
    (b) =>
      (b.author && b.author.includes(key)) ||
      (b.editor && b.editor.includes(key))
  );

  const sAuthorName = sanitizeText(a.name);
  const sAvatarEl = document.getElementById('amAvatar');
  if (sAvatarEl) {
    sAvatarEl.innerHTML = a.img
      ? `<img src="${sanitizeUrl(a.img)}" alt="${sAuthorName}" loading="lazy" onerror="this.parentElement.textContent='${initials(a.name)}'">`
      : initials(a.name);
  }
  document.getElementById('amName').textContent = a.name;
  document.getElementById('amBio').textContent = a.bio;

  const amBooksEl = document.getElementById('amBooks');
  if (amBooksEl) {
    amBooksEl.innerHTML = books.length
      ? books
          .map((b) => {
            const sBookTitle = sanitizeText(b.title);
            const sId = sanitizeText(b.id);
            const sImg = b.img ? sanitizeUrl(b.img) : '';
            return `<div role="listitem" class="cursor-pointer am-book-card" data-id="${sId}" tabindex="0">
            <div class="am-book-cover-wrap">
              ${sImg ? `<img class="det-cover" src="${sImg}" alt="${sBookTitle}" loading="lazy">` : `<div class="am-book-placeholder">${sBookTitle}</div>`}
            </div>
            <div class="am-book-title">${sBookTitle}</div>
          </div>`;
          })
          .join('')
      : '<p class="am-no-books">No listed publications.</p>';
  }

  // URL state update
  const urlAuthor = new URL(window.location.href);
  const slugAuthor = window.getSlug(a.name);
  if (urlAuthor.searchParams.get('author') !== slugAuthor) {
    urlAuthor.searchParams.set('author', slugAuthor);
    window.history.replaceState({}, '', urlAuthor.pathname + urlAuthor.search);
  }

  openModal('authorModal');
};

/* ── Interactive Filters ── */
window.applyFilters = async function () {
  const minVal = document.getElementById('minPrice')?.value;
  const maxVal = document.getElementById('maxPrice')?.value;
  const minPrice = minVal ? Number(minVal) : 0;
  const maxPrice = maxVal ? Number(maxVal) : Infinity;

  const activeGenre = window.activeGenre || 'All';
  const genres = [activeGenre];

  const showAll = activeGenre === 'All';
  const input = document.getElementById('searchInput');
  const q = input ? input.value.toLowerCase().trim() : '';

  // Save sessionStorage preferences
  if (typeof PrefsSync !== 'undefined') {
    PrefsSync.save({
      search: q,
      genre: activeGenre,
      year: window.yearFilter || 'All',
      sort: window._selectedSort || 'newest',
      minPrice: minVal || '',
      maxPrice: maxVal || '',
    });
  }

  // Update URL params
  const url = new URL(window.location.href);
  if (q) url.searchParams.set('q', q);
  else url.searchParams.delete('q');
  if (activeGenre !== 'All') url.searchParams.set('genre', activeGenre);
  else url.searchParams.delete('genre');
  if (window.yearFilter && window.yearFilter !== 'All')
    url.searchParams.set('year', window.yearFilter);
  else url.searchParams.delete('year');
  if (window._selectedSort && window._selectedSort !== 'newest')
    url.searchParams.set('sort', window._selectedSort);
  else url.searchParams.delete('sort');
  if (minVal) url.searchParams.set('minPrice', minVal);
  else url.searchParams.delete('minPrice');
  if (maxVal) url.searchParams.set('maxPrice', maxVal);
  else url.searchParams.delete('maxPrice');
  window.history.replaceState(
    window.history.state || {},
    '',
    url.pathname + url.search
  );

  const sortVal = window._selectedSort || 'newest';

  // Use Pagefind index search first if a query string exists
  if (q) {
    try {
      const pagefindResults = await searchWithPagefind(
        q,
        genres,
        window.yearFilter || 'All',
        minPrice,
        maxPrice,
        sortVal
      );
      if (pagefindResults !== null) {
        window.transitionTo(() => {
          renderShelves(pagefindResults, 'All');
        });
        return;
      }
    } catch (err) {
      console.warn(
        'Pagefind search failed, falling back to local search worker:',
        err
      );
    }
  }

  // Fallback to Worker or UI Thread search if no query or Pagefind not available
  if (searchWorker) {
    searchWorker.postMessage({
      type: 'search',
      query: q,
      yearFilter: window.yearFilter || 'All',
      minPrice: minPrice,
      maxPrice: maxPrice,
      genres: genres,
      sortVal: sortVal,
    });
  } else {
    // UI Thread Fallback (CORS restrictions on local file:// paths)
    const filtered = _books
      .map((b) => {
        const score = q ? getRelevanceScore(b, q) : 0;
        return { ...b, _score: score };
      })
      .filter((b) => {
        const mY =
          window.yearFilter === 'All' ||
          b.year.toString() === window.yearFilter;
        const mPrice =
          Number(b.price) >= minPrice && Number(b.price) <= maxPrice;
        const mGenre = showAll || genres.includes(b.category);
        const mQ = !q || b._score > 0 || fuzzyMatch(b._searchWords || [], q);
        return mY && mPrice && mGenre && mQ;
      });

    filtered.sort((a, b) => {
      if (q) {
        const diff = b._score - a._score;
        if (diff !== 0) return diff;
      }
      if (sortVal === 'price-asc') return a.price - b.price;
      if (sortVal === 'price-desc') return b.price - a.price;
      if (sortVal === 'title-asc') return a.title.localeCompare(b.title);
      return b.year - a.year; // newest
    });

    window.transitionTo(() => {
      renderShelves(filtered, 'All');
    });
  }
};

window.toggleGenreSearchOpts = function () {
  const o = document.getElementById('genreSearchOpts');
  if (!o) return;
  const open = o.classList.toggle('show');
  const btn = document.getElementById('genreSearchBtn');
  if (btn) btn.setAttribute('aria-expanded', open);
};

window.selectGenreSearch = function (g) {
  window.activeGenre = g;
  const lbl = document.getElementById('genreSearchLabel');
  if (lbl) lbl.textContent = g === 'All' ? 'All Genres' : g;
  const o = document.getElementById('genreSearchOpts');
  if (o) o.classList.remove('show');
  const btn = document.getElementById('genreSearchBtn');
  if (btn) btn.setAttribute('aria-expanded', 'false');
  applyFilters();
};

window.toggleFilter = function () {
  const dd = document.getElementById('filterDropdown');
  if (!dd) return;
  const open = dd.classList.toggle('show');
  const btn = document.getElementById('filterBtn');
  if (btn) btn.setAttribute('aria-expanded', open);
};

window.toggleYearOpts = function () {
  const o = document.getElementById('yearOpts');
  if (!o) return;
  const open = o.classList.toggle('show');
  const btn = document.getElementById('yearBtn');
  if (btn) btn.setAttribute('aria-expanded', open);
};

window.toggleSortOpts = function () {
  const o = document.getElementById('sortOpts');
  if (!o) return;
  const open = o.classList.toggle('show');
  const btn = document.getElementById('sortBtn');
  if (btn) btn.setAttribute('aria-expanded', open);
};

window.selectYear = function (y) {
  window.yearFilter = y;
  const lbl = document.getElementById('yearLabel');
  if (lbl) lbl.textContent = y === 'All' ? 'All Years' : y;
  const o = document.getElementById('yearOpts');
  if (o) o.classList.remove('show');
  applyFilters();
};

window.selectSort = function (s) {
  window._selectedSort = s;
  const labels = {
    newest: 'Newest',
    'price-asc': 'Price: Low to High',
    'price-desc': 'Price: High to Low',
    'title-asc': 'Title: A-Z',
  };
  const lbl = document.getElementById('sortLabel');
  if (lbl) lbl.textContent = labels[s] || 'Newest';
  const o = document.getElementById('sortOpts');
  if (o) o.classList.remove('show');
  applyFilters();
};

window.resetFilters = function () {
  window.yearFilter = 'All';
  const lbl = document.getElementById('yearLabel');
  if (lbl) lbl.textContent = 'All Years';

  const mn = document.getElementById('minPrice');
  if (mn) mn.value = '';
  const mx = document.getElementById('maxPrice');
  if (mx) mx.value = '';

  window._selectedSort = 'newest';
  const sl = document.getElementById('sortLabel');
  if (sl) sl.textContent = 'Newest';

  window.activeGenre = 'All';
  const genreSearchLabel = document.getElementById('genreSearchLabel');
  if (genreSearchLabel) {
    genreSearchLabel.textContent = 'All Genres';
  }

  clearSearch();
  applyFilters();
};

window.setViewMode = function (mode) {
  const grid = document.getElementById('catalogGrid');
  const btnG = document.getElementById('btnGridView');
  const btnL = document.getElementById('btnListView');
  if (!grid || !btnG || !btnL) return;

  if (mode === 'list') {
    grid.classList.add('list-view');
    btnL.classList.add('active');
    btnG.classList.remove('active');
  } else {
    grid.classList.remove('list-view');
    btnG.classList.add('active');
    btnL.classList.remove('active');
  }
};

/* ── DOM Init ── */
document.addEventListener('astro:page-load', async () => {
  if (document.body.dataset.page !== 'catalog') return;
  window._initCompleted = false;

  // Event Delegation for book grid clicks (removes inline onclick attributes)
  const grid = document.getElementById('catalogGrid');
  if (grid) {
    grid.addEventListener('click', (e) => {
      const seeAll = e.target.closest('.shelf-see-all');
      if (seeAll) {
        e.preventDefault();
        const shelfSection = seeAll.closest('.shelf-section');
        if (shelfSection) {
          const shelfRow = shelfSection.querySelector('.shelf-row-books');
          if (shelfRow) {
            const isExpanded = shelfRow.classList.toggle('expanded');
            seeAll.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');
            seeAll.innerHTML = isExpanded ? 'SHOW LESS &uarr;' : 'SEE ALL &rarr;';
            if (typeof window.updateShelfOverlays === 'function') {
              window.updateShelfOverlays();
            }
          }
        }
        return;
      }

      const overlay = e.target.closest('.shelf-more-overlay');
      if (overlay) {
        e.preventDefault();
        const shelfSection = overlay.closest('.shelf-section');
        if (shelfSection) {
          const seeAllBtn = shelfSection.querySelector('.shelf-see-all');
          if (seeAllBtn) {
            seeAllBtn.click();
          }
        }
        return;
      }

      const card = e.target.closest('.book-card');
      if (card && card.dataset.id) {
        viewBook(card.dataset.id);
      }
    });

    grid.addEventListener('keydown', (e) => {
      const card = e.target.closest('.book-card');
      if (card && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        viewBook(card.dataset.id);
      }
    });
  }

  // Event Delegation for predictions
  const preds = document.getElementById('searchPreds');
  if (preds) {
    preds.addEventListener('click', (e) => {
      const item = e.target.closest('.pred-item');
      if (item && item.dataset.id) {
        viewBook(item.dataset.id);
        closePreds();
      }
    });
    preds.addEventListener('keydown', (e) => {
      const item = e.target.closest('.pred-item');
      if (item && e.key === 'Enter') {
        viewBook(item.dataset.id);
        closePreds();
      }
    });
  }

  // Event Delegation for Author Books inside modal
  const amBooks = document.getElementById('amBooks');
  if (amBooks) {
    amBooks.addEventListener('click', (e) => {
      const item = e.target.closest('.am-book-card');
      if (item && item.dataset.id) {
        closeModal('authorModal');
        viewBook(item.dataset.id);
      }
    });
    amBooks.addEventListener('keydown', (e) => {
      const item = e.target.closest('.am-book-card');
      if (item && e.key === 'Enter') {
        closeModal('authorModal');
        viewBook(item.dataset.id);
      }
    });
  }

  // Load books from SheetsCMS
  let fetched;
  if (window.BOOKS_CACHE && window.BOOKS_CACHE.length > 0) {
    fetched = window.BOOKS_CACHE;
  } else {
    fetched = await SheetsCMS.getBooks().catch(() =>
      typeof BOOKS !== 'undefined' ? BOOKS : []
    );
    window.BOOKS_CACHE = fetched;
  }
  fetched.forEach((b) => {
    const ad = authorDisplay(b) || '';
    b._authorDisplay = ad;
    const rawStr = [
      b.title,
      ad,
      b.editor || '',
      b.category,
      b.year ? b.year.toString() : '',
    ]
      .join(' ')
      .toLowerCase();
    b._searchStr = rawStr;
    b._searchWords = rawStr.split(/[^\w\d\u00C0-\u00FF]+/).filter(Boolean);
  });

  _books.length = 0;
  _books.push(...fetched);

  // Initialize background worker with books data
  if (searchWorker) {
    searchWorker.postMessage({ type: 'init', books: fetched });
  }

  // Inject dynamic unified JSON-LD ItemList schema for SEO crawlers
  injectSchemaAll(_books);

  const loadRemaining = () => {
    // Dynamically find the first category and preload its first 2 covers as .webp to optimize LCP
    const catOrder = [...new Set(_books.map((b) => b.category))].sort(
      (a, b) => {
        const ai = CAT_ORDER_DEFAULT.indexOf(a),
          bi = CAT_ORDER_DEFAULT.indexOf(b);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      }
    );

    if (catOrder.length > 0) {
      const firstCat = catOrder[0];
      const firstCatBooks = _books.filter((b) => b.category === firstCat);
      if (firstCat === 'Journal') {
        firstCatBooks.sort((a, b) => (b.issueNum || 0) - (a.issueNum || 0));
      }

      firstCatBooks.slice(0, 2).forEach((b) => {
        if (b.img) {
          const webpUrl = b.img.replace(/\.(png|jpg|jpeg)$/i, '.webp');
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'image';
          link.href = webpUrl;
          document.head.appendChild(link);
        }
      });
    }

    // Populate Year options
    const years = [...new Set(_books.map((b) => b.year))].sort().reverse();
    const yearOpts = document.getElementById('yearOpts');
    if (yearOpts) {
      yearOpts.innerHTML =
        `<div class="cs-opt" data-year="All">All Years</div>` +
        years
          .map((y) => `<div class="cs-opt" data-year="${y}">${y}</div>`)
          .join('');
    }

    // Add Search Bar Genre Dropdown event listeners
    const gsb = document.getElementById('genreSearchBtn');
    if (gsb) {
      gsb.addEventListener('click', window.toggleGenreSearchOpts);
    }
    const gso = document.getElementById('genreSearchOpts');
    if (gso) {
      gso.addEventListener('click', (e) => {
        const opt = e.target.closest('.cs-opt');
        if (opt && opt.dataset.genre) {
          window.selectGenreSearch(opt.dataset.genre);
        }
      });
    }

    // Restore preferences
    const params = new URLSearchParams(window.location.search);
    const savedPrefs =
      typeof PrefsSync !== 'undefined'
        ? PrefsSync.load()
        : {
            search: '',
            genre: 'All',
            year: 'All',
            sort: 'newest',
            maxPrice: '2000',
          };

    const qParam = params.get('q');
    const searchVal = qParam !== null ? qParam : savedPrefs.search;
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.value = searchVal;
      const cb = document.getElementById('clearBtn');
      if (cb) cb.style.display = searchVal ? 'block' : 'none';
    }

    const genreParam = params.get('genre') || params.get('category');
    const activeGenre = genreParam !== null ? genreParam : savedPrefs.genre;
    window.activeGenre = activeGenre;
    const genreSearchLabel = document.getElementById('genreSearchLabel');
    if (genreSearchLabel) {
      genreSearchLabel.textContent = activeGenre === 'All' ? 'All Genres' : activeGenre;
    }

    const yearParam = params.get('year');
    const activeYear = yearParam !== null ? yearParam : savedPrefs.year;
    window.yearFilter = activeYear;
    const yearLbl = document.getElementById('yearLabel');
    if (yearLbl) {
      yearLbl.textContent = activeYear === 'All' ? 'All Years' : activeYear;
    }

    const sortParam = params.get('sort');
    const activeSort = sortParam !== null ? sortParam : savedPrefs.sort;
    window._selectedSort = activeSort;
    const sortLabels = {
      newest: 'Newest',
      'price-asc': 'Price: Low to High',
      'price-desc': 'Price: High to Low',
      'title-asc': 'Title: A-Z',
    };
    const sortLbl = document.getElementById('sortLabel');
    if (sortLbl) {
      sortLbl.textContent = sortLabels[activeSort] || 'Newest';
    }

    const minParam = params.get('minPrice');
    const activeMin = minParam !== null ? minParam : savedPrefs.minPrice;
    const minPriceInput = document.getElementById('minPrice');
    if (minPriceInput) {
      minPriceInput.value = activeMin;
    }

    const priceParam = params.get('maxPrice') || params.get('price');
    const activePrice = priceParam !== null ? priceParam : savedPrefs.maxPrice;
    const maxPriceInput = document.getElementById('maxPrice');
    if (maxPriceInput) {
      maxPriceInput.value = activePrice;
    }

    // Apply filters initial load
    applyFilters();

    // Dynamic Welcome Greeting based on local time
    const subtitleEl = document.querySelector('.page-subtitle');
    if (subtitleEl) {
      const hr = new Date().getHours();
      let greeting = 'Hello!';
      if (hr >= 5 && hr < 12) {
        greeting = 'Good morning!';
      } else if (hr >= 12 && hr < 17) {
        greeting = 'Good afternoon!';
      } else if (hr >= 17 && hr < 22) {
        greeting = 'Good evening!';
      } else {
        greeting = 'Quiet night?';
      }

      const prompts = [
        'Feel free to browse our books. 📖',
        'Do you have a book in mind that goes well with cozy weather? ☕',
        'Find a warm read to match your day. ☀️',
        'A perfect time to discover your next favorite story. 🌟',
        'Cozy up with some great Filipino literature. 🛋️',
        "Let's find a story that speaks to your heart today. 📖",
        'A book is a dream you hold in your hands. 💭',
        'Grab a warm cup of coffee and explore our shelves. ☕',
        'Discovering local writers is a journey of its own. 🇵🇭',
        'What kind of literature are you in the mood for? 📚',
        'Every page is a new window to the world. 🪟',
        'Nothing beats the smell of new pages. 👃',
        "Welcome! Let's search for a hidden gem today. 💎",
        'A cozy reader is a happy reader. 🛋️',
        'Explore the rich heritage of Filipino storytelling. 📜',
        'Which title will join your reading list today? 📝',
        'Escape into the beautiful world of poetry. ✍️',
        'Every author has a unique story to share with you. 🗣️',
        'Reading is a passport to countless adventures. ✈️',
        'May your day be filled with wonderful sentences. 🌸',
        'Find inspiration in the voices of our local artists. 🎨',
        'A quiet moment with a book is never wasted. ⏳',
        'Step inside our library and let your mind wander. 🌾',
        'Discover the literature that shapes our culture. 🏛️',
        'Books are quiet and constant friends. 🤝',
        'Ready to start a new reading journey? 🧭',
        'Filipino stories have a warmth like no other. ☀️',
        'A classic tale or a modern masterpiece? You choose. 🎭',
        'Find a cozy corner and let the stories unfold. 🕯️',
        'Every book is a conversation with a brilliant mind. 🧠',
        'Uncover local narratives that resonate deeply. 🌊',
        'Let the magic of words brighten your day. ✨',
        'Perfect weather to stay in and read a new title. 🌧️',
        'Welcome to a world of words and wonder. 🌌',
        'What page will you turn next? 📄',
        'A good book gives you a place to go when you have to stay. 🏡',
        'Explore the beauty of Tagalog and English writing. 🗣️',
        'Stories are the threads that bind us together. 🧵',
        "Let's celebrate the power of independent publishing. ✊",
        'A beautiful day to fall in love with a new author. ❤️',
        'What library adventures await you today? 🏰',
        'May your reading list always grow longer. 📈',
        'Find a narrative that challenges and inspires you. 🏔️',
        'A good story stays with you long after the final page. 🕰️',
        "Welcome! Let's find your next late-night read. 🌙",
        'Immerse yourself in history, fiction, and art. 🎭',
        'Books make the perfect companions for quiet afternoons. 🌇',
        'Discover the voices that keep our history alive. 🕯️',
        'Let these stories paint a picture in your mind. 🖼️',
        'Celebrate the diversity of Filipino authors. 🌈',
        'There is always space on the shelf for one more book. 🗄️',
        'Read to learn, read to feel, read to grow. 🌱',
        'Unwind with some of the finest local journals. 📓',
        'Let these verses speak to your soul today. 🎻',
        'Welcome back! What are we reading next? 🤔',
        'Every book catalog has a secret waiting to be found. 🗝️',
        'Let the local literature sweep you off your feet. 🍃',
        'A good book is like a warm hug for your mind. 🤗',
        'Feed your curiosity with our non-fiction section. 🍎',
        'Every chapter brings a new perspective. 🔍',
        'Find a quiet sanctuary in these printed pages. ⛪',
        'Let local writers take you on a journey home. 🏠',
        'Which cover catches your eye today? 👁️',
        'There is no friend as loyal as a book. 🐶',
        'Let the words flow like a gentle river. 🌊',
        'A cozy spot and a great book are all we need. 🧺',
        "Let's support our local literary community together. 🤝",
        'Each book in our catalog is curated with love. 💖',
        'Bring home a piece of Filipino culture today. 🇵🇭',
        'Let the rhythm of poetry guide your thoughts. 🥁',
        'Every book is a treasure chest of ideas. 🦪',
        'Welcome! We have a shelf full of wonders for you. 🌠',
        'Discover the joy of reading independent press. 🕊️',
        'Get lost in a story and find yourself. 🗺️',
        'A book is like a garden carried in the pocket. 🌻',
        'Let the authors share their wisdom with you. 🦉',
        'Reading is a peaceful escape from the busy world. 🧘',
        "Let's celebrate Filipino creativity, one page at a time. 🎨",
        'Find a cozy tale to read under the stars. 🌌',
        'A reader lives a thousand lives before he dies. 🦁',
        'Explore our latest publications and classic favorites. 🔖',
        "Welcome! Let's make today a reading day. 📅",
        'Stories have the power to change how we see the world. 🌍',
        'Find your next great literary adventure here. 🧗',
        'Let local voices inspire your own creative journey. ✍️',
        'A blank page is full of endless possibilities. 🏳️',
        'Lose yourself in the art of Filipino essay writing. ✒️',
        'A book is a gift you can open again and again. 🎁',
        "Welcome! Let's fill your virtual cart with stories. 🛒",
        'Reading is the ultimate form of slow living. 🐢',
        'Let these words bring peace to your busy mind. 🍃',
        'Discover the magic of storytelling from our homeland. 🏡',
        'A wonderful day to explore new books. 🌤️',
        'Every book has a heartbeat of its own. 💓',
        'Explore the heights of Filipino poetry and drama. 🎭',
        'Read something today that makes you smile. 😊',
        "Welcome! Let's find the perfect book for your weekend. 🏖️",
        'Reading is a spark that ignites the imagination. ⚡',
        "Let's keep the love for printed books alive. 🌲",
        'Every book is a piece of art waiting to be held. 👐',
        'Find a story that mirrors your own experiences. 🪞',
        'Let these pages be a comfort to your day. 🍵',
        'Welcome! We are honored to share these stories with you. 🎖️',
        'May your reading session be uninterrupted and sweet. 🍬',
        'Let the adventure begin on the very first page. 🏁',
        'Dive deep into the pages of Philippine history today. 📜',
        'A good book is a companion that never leaves your side. 🕯️',
        'Discover the power of local indie publications. ✊',
        'A day spent reading is a day well lived. 📅',
        'May your coffee be strong and your reading list be long. ☕',
        'Open a page and let your mind set sail. ⛵',
        'Explore how local writers capture the essence of our islands. 🏝️',
        'Looking for a literary masterpiece? You’ve come to the right place. 🏛️',
        'What beautiful sentences will you discover today? ✍️',
        'Find your peace in the flow of local prose. 🌊',
        'Uncover stories of resilience, love, and community. 🌱',
        'Let the sound of turning pages soothe your mind. 🍃',
        'A wonderful hour to browse through some local poetry. 🎻',
        'Read a book today that makes you think a little deeper. 🧠',
        'Every book is an invitation to walk in someone else’s shoes. 👣',
        'Let the ink on these pages transport you to another world. 🌌',
        'Indulge in the luxury of a slow, quiet read. 🧘',
        'Discover the stories that define our generation. 🗣️',
        'Let your imagination run wild in our catalog. 🐎',
        'Support independent writers and their beautiful craft. 💖',
        'A library is a hospital for the mind. 🏥',
        'Find a book that feels like a conversation with a friend. 💬',
        'Explore modern takes on Filipino folklore and mythology. 🐉',
        'Which story will capture your imagination today? 🌠',
        'Books are a unique portable magic. 🪄',
        'Get cozy and let the narrative pull you in. 🛋️',
        'Read something written with passion and purpose. 🔥',
        'There is no scent as wonderful as a printed page. 👃',
        'Expand your horizons with our non-fiction collection. 🧭',
        'Stories are the light that guides us through the dark. 🕯️',
        'Discover a voice that speaks directly to you. 🎙️',
        'Let these words paint a bright picture in your day. 🎨',
        'A good story has no expiration date. 🕰️',
        'Find a book that you simply cannot put down. 📚',
        'Let local literature be the soundtrack of your day. 🎵',
        'Every paragraph holds a hidden world of meaning. 🗝️',
        'Reading gives us someplace to go when we have to stay. 🏡',
        'Unwind with a collection of short stories or essays. 📓',
        'Find a narrative that matches the rhythm of your heart. 💓',
        'Let the wisdom of our elders guide your reading today. 🦉',
        'Books are the legacy that authors leave to the world. 🏛️',
        'Enjoy a peaceful escape between these digital shelves. 🌾',
        'Ready to fall in love with a new literary genre? 🎭',
        'Let these pages warm your heart and spark your mind. ☀️',
        'A book is a device to ignite the imagination. 💥',
        'Discover the magic of regional Filipino literature. 🗺️',
        'May your reading journey be filled with unexpected joy. 🌸',
        'Let every word build a bridge to new understanding. 🌉',
        'Let these pages inspire your next big idea. 💡',
        'Explore a collection of raw and honest perspectives. 🔬',
        'A catalog of narratives that deserve to be heard. 📣',
        'Start a new chapter in your reading journey today. 🏁',
      ];
      const idx = new Date().getMinutes() % prompts.length;
      const raw = `${greeting} ${prompts[idx]}`;
      // Remove emoji characters from the subtitle line entirely
      const rendered = raw.replace(
        /([\p{Emoji_Presentation}\p{Extended_Pictographic}])/gu,
        ''
      ).replace(/\s+/g, ' ').trim();
      subtitleEl.innerHTML = rendered;
    }

    // Deep link modals
    const bookParam = params.get('book');
    if (bookParam) {
      const matchedBook = _books.find(
        (b) => window.getSlug(b.title) === bookParam || b.id === bookParam
      );
      if (matchedBook) {
        viewBook(matchedBook.id);
      } else {
        params.delete('book');
        window.history.replaceState(
          {},
          '',
          window.location.pathname +
            (params.toString() ? '?' + params.toString() : '')
        );
      }
    }
    const authorParam = params.get('author');
    if (authorParam) {
      const allAuthors = typeof AUTHORS !== 'undefined' ? AUTHORS : [];
      const matchedAuthor = allAuthors.find(
        (a) => window.getSlug(a.name) === authorParam
      );
      if (matchedAuthor) {
        viewAuthor(matchedAuthor.name);
      } else {
        params.delete('author');
        window.history.replaceState(
          {},
          '',
          window.location.pathname +
            (params.toString() ? '?' + params.toString() : '')
        );
      }
    }

    window._initCompleted = true;
  };

  const scheduleIdle =
    window.requestIdleCallback ||
    function (cb) {
      return setTimeout(
        () => cb({ timeRemaining: () => 50, didTimeout: true }),
        1
      );
    };
  scheduleIdle(loadRemaining);

  // Close filter dropdowns on outside click
  document.addEventListener('click', (e) => {
    const fd = document.getElementById('filterDropdown');
    const fb = document.getElementById('filterBtn');
    if (fd && !fd.contains(e.target) && fb && !fb.contains(e.target)) {
      fd.classList.remove('show');
      if (fb) fb.setAttribute('aria-expanded', 'false');
    }
    const yo = document.getElementById('yearOpts');
    const yb = document.getElementById('yearBtn');
    if (yo && !yo.contains(e.target) && yb && !yb.contains(e.target)) {
      yo.classList.remove('show');
      if (yb) yb.setAttribute('aria-expanded', 'false');
    }
    const gso = document.getElementById('genreSearchOpts');
    const gsb = document.getElementById('genreSearchBtn');
    if (gso && !gso.contains(e.target) && gsb && !gsb.contains(e.target)) {
      gso.classList.remove('show');
      if (gsb) gsb.setAttribute('aria-expanded', 'false');
    }
  });

  // Debounced rAF window resize handler
  let isMobileCached = window.innerWidth <= 600;
  let resizeTicking = false;
  window.addEventListener('resize', () => {
    if (!resizeTicking) {
      window.requestAnimationFrame(() => {
        const isMobile = window.innerWidth <= 600;
        if (isMobile !== isMobileCached) {
          isMobileCached = isMobile;
          if (typeof applyFilters === 'function') {
            applyFilters();
          }
        }

        if (typeof window.updateCollapsedHeights === 'function') {
          window.updateCollapsedHeights();
        }
        if (typeof window.updateShelfOverlays === 'function') {
          window.updateShelfOverlays();
        }

        resizeTicking = false;
      });
      resizeTicking = true;
    }
  });
});
