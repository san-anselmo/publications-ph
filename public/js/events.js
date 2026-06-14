'use strict';

/* ── Events Page Logic (CSP Compliant & Sanitize-Hardened) ── */

let _events = [];
window.timeFilter = window.timeFilter || 'upcoming';
window.typeFilter = window.typeFilter || 'All';

function checkImageExists(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

async function findFirstEventImage(slug) {
  const extensions = ['webp', 'jpg', 'jpeg', 'png'];
  for (const ext of extensions) {
    const url = `images/${slug}-1.${ext}`;
    const exists = await checkImageExists(url);
    if (exists) return url;
  }
  return null;
}

async function getEventImages(slug) {
  const images = [];
  const extensions = ['webp', 'jpg', 'jpeg', 'png'];

  // Dynamic scanning for uploaded assets named slug-1 to slug-5
  for (let i = 1; i <= 5; i++) {
    for (const ext of extensions) {
      const url = `images/${slug}-${i}.${ext}`;
      const exists = await checkImageExists(url);
      if (exists) {
        images.push(url);
        break; // found one format for index i, skip to next format
      }
    }
  }

  return images;
}

function renderEvents() {
  const list = document.getElementById('eventsList');
  if (!list) return;
  const now = new Date();
  const nowZero = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const filtered = _events.filter((e) => {
    const d = new Date(e.date);
    const dZero = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const tOk =
      window.timeFilter === 'upcoming'
        ? dZero >= nowZero
        : window.timeFilter === 'past'
          ? dZero < nowZero
          : true;
    const yOk = window.typeFilter === 'All' || e.type === window.typeFilter;
    return tOk && yOk;
  });

  filtered.sort((a, b) => {
    const da = new Date(a.date).getTime();
    const db = new Date(b.date).getTime();
    if (window.timeFilter === 'upcoming') {
      return da - db; // closest first
    } else {
      return db - da; // most recent first
    }
  });

  if (!filtered.length) {
    list.innerHTML = `<div class="no-results"><div class="nr-icon" aria-hidden="true">◌</div><h2>No events found</h2><p>Try adjusting filters.</p></div>`;
    if (typeof window.restoreScrollDepth === 'function') {
      window.restoreScrollDepth();
    }
    return;
  }

  list.innerHTML = filtered
    .map((e) => {
      const d = new Date(e.date);
      const sFormattedDate = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const sType = sanitizeText(e.type);
      const sTitle = sanitizeText(e.title);
      const sLoc = sanitizeText(e.location);
      const slug = window.getSlug(e.title);
      const sImg = e.img ? sanitizeUrl(e.img) : '';

      return `<a href="?event=${slug}" class="event-card-link w-100" data-slug="${slug}">
      <article class="event-card" role="listitem">
        <div class="event-card-media flex-center" id="media-card-${slug}">
          ${
            sImg
              ? `<img class="event-card-img" src="${sImg}" alt="${sTitle}" loading="lazy">`
              : `
            <div class="event-map-fallback">
              <svg class="event-fallback-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" fill="currentColor"/>
                <circle cx="12" cy="12" r="3" fill="currentColor"/>
              </svg>
              <div class="event-fallback-text">San Anselmo Publications</div>
            </div>
          `
          }
        </div>
        <div class="event-card-content">
          <div class="evt-cat-pill">${sType}</div>
          <h2 class="event-card-title">${sTitle}</h2>
          <div class="event-card-metadata">
            <span class="evt-meta-date">
              <svg class="icon" width="14" height="14" aria-hidden="true" focusable="false"><use href="#icon-cal"></use></svg>
              ${sFormattedDate}
            </span>
            <span class="evt-meta-loc" title="${sLoc}">
              <svg class="icon" width="14" height="14" aria-hidden="true" focusable="false"><use href="#icon-pin"></use></svg>
              <span class="evt-meta-loc-text">${sLoc}</span>
            </span>
          </div>
        </div>
      </article>
    </a>`;
    })
    .join('');

  // Progressive loading of uploaded custom images (for events without static img fields)
  filtered.forEach(async (evt) => {
    const s = window.getSlug(evt.title);
    if (evt.img) return;
    const customImg = await findFirstEventImage(s);
    if (customImg) {
      const mediaEl = document.getElementById(`media-card-${s}`);
      if (mediaEl) {
        mediaEl.innerHTML = `<img class="event-card-img" src="${customImg}" alt="${sanitizeText(evt.title)}" loading="lazy">`;
      }
    }
  });

  if (typeof window.restoreScrollDepth === 'function') {
    window.restoreScrollDepth();
  }
}

async function renderSingleEvent() {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('event');
  const wrapper = document.getElementById('eventsGridWrapper');
  const singleView = document.getElementById('singleEventView');
  const layoutContainer = document.getElementById('eventsLayoutContainer');

  if (!wrapper || !singleView) return;

  if (slug) {
    const e = _events.find((evt) => window.getSlug(evt.title) === slug);
    if (e) {
      wrapper.classList.add('hidden');
      singleView.classList.remove('hidden');
      if (layoutContainer) layoutContainer.classList.remove('desktop-split');

      const d = new Date(e.date);
      const sFormattedDate = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const sType = sanitizeText(e.type);
      const sTitle = sanitizeText(e.title);
      const sLoc = sanitizeText(e.location);
      const sDesc = e.description
        ? sanitizeText(e.description)
        : `Join San Anselmo Publications at the ${sTitle} event. We are excited to engage with our readers, showcase our publications, and foster a vibrant community of literature lovers. Don't miss this opportunity to connect with us at ${sLoc}.`;

      document.title = `${sTitle} — San Anselmo Publications, Inc.`;

      // Set initial layout with loading spinner
      singleView.innerHTML = `
        <div class="single-event-container">
          <div class="single-event-actions-bar" style="display: flex; gap: 0.75rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
            <button class="btn-outline back-events-btn" id="btnBackToEvents" aria-label="Back to events list">
              <svg class="icon" width="16" height="16" aria-hidden="true" focusable="false" viewBox="0 0 24 24">
                <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z" fill="currentColor"/>
              </svg>
              Back to Events
            </button>
          </div>
          <div class="single-event-grid">
            <div class="single-event-details-col">
              <div class="evt-cat-pill">${sType}</div>
              <div class="det-title-row" style="display:flex; align-items:center; gap:1rem; margin-bottom:1rem;">
                <h2 class="single-event-title" style="margin:0;">${sTitle}</h2>
                <div class="det-title-actions" style="display:flex; gap:0.5rem;">
                  <button id="evtSpeakBtn" class="det-action-icon-btn" aria-label="Listen to event description" data-tooltip="Listen">
                    <svg class="icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                    </svg>
                  </button>
                  <button id="evtShareBtn" class="det-action-icon-btn" aria-label="Share event" data-tooltip="Share">
                    <svg class="icon" aria-hidden="true" focusable="false"><use href="#icon-share"></use></svg>
                  </button>
                </div>
              </div>
              <div class="single-event-meta-info">
                <div class="single-evt-meta-item">
                  <svg class="icon" width="18" height="18" aria-hidden="true" focusable="false"><use href="#icon-cal"></use></svg>
                  <span><strong>Date:</strong> ${sFormattedDate}</span>
                </div>
                <div class="single-evt-meta-item">
                  <svg class="icon" width="18" height="18" aria-hidden="true" focusable="false"><use href="#icon-pin"></use></svg>
                  <span><strong>Location:</strong> ${sLoc}</span>
                </div>
                <div style="margin-top: 1rem;">
                  <button id="evtAddCalendarBtn" class="btn-outline" style="font-size: 0.85rem; padding: 0.4rem 0.8rem; display: inline-flex; align-items: center; gap: 0.5rem;">
                    <svg class="icon" width="16" height="16" aria-hidden="true" focusable="false"><use href="#icon-cal"></use></svg>
                    Add to Calendar
                  </button>
                </div>
              </div>
              <div class="single-event-desc">
                <div style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.3rem;">
                  <svg class="icon" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/></svg>
                  ${Math.max(1, Math.ceil(sDesc.split(/\\s+/).length / 200))} min read
                </div>
                <p>${sDesc}</p>
              </div>
            </div>
            <div class="single-event-media-col">
              <div id="singleEventGalleryContainer">
                <div class="single-event-fallback-wrap flex-center" style="height:350px;">
                  <div class="loading-spinner"></div>
                </div>
              </div>
              
              <!-- Reactions & Comments Discussion Section (Moved below Gallery) -->
              <div class="event-social-section">
                <div class="event-reactions-bar" id="eventReactions">
                  <button class="react-btn" data-reaction="like" aria-label="Like">
                    <span class="react-emoji">👍</span> <span class="react-count" id="react-count-like">0</span>
                  </button>
                  <button class="react-btn" data-reaction="love" aria-label="Love">
                    <span class="react-emoji">❤️</span> <span class="react-count" id="react-count-love">0</span>
                  </button>
                  <button class="react-btn" data-reaction="haha" aria-label="Haha">
                    <span class="react-emoji">😆</span> <span class="react-count" id="react-count-haha">0</span>
                  </button>
                  <button class="react-btn" data-reaction="wow" aria-label="Wow">
                    <span class="react-emoji">😮</span> <span class="react-count" id="react-count-wow">0</span>
                  </button>
                </div>
                <div class="event-comments-section">
                  <h2 class="social-section-title">Discussion</h2>
                  <form class="event-comment-form" id="eventCommentForm">
                    <div class="comment-input-row">
                      <input type="text" id="commentAuthor" class="comment-author-input" placeholder="Your Name" required>
                      <div style="position: relative; width: 100%;">
                        <textarea id="commentText" class="comment-text-input" placeholder="Add a comment..." rows="2" required maxlength="500"></textarea>
                        <div class="char-counter" id="commentCharCounter">0/500</div>
                      </div>
                    </div>
                    <button type="submit" class="submit-comment-btn">Post Comment</button>
                  </form>
                  <div class="event-comments-list" id="eventCommentsList"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      initEventSocial(slug);

      // Bind back button
      const backBtn = document.getElementById('btnBackToEvents');
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          if (window.history.state && window.history.state.event) {
            window.history.back();
          } else {
            const url = new URL(window.location.href);
            url.searchParams.delete('event');
            window.history.replaceState({}, '', url.pathname + url.search);
            singleView.classList.add('hidden');
            wrapper.classList.remove('hidden');
            if (layoutContainer) layoutContainer.classList.add('desktop-split');
            document.title = 'Events - San Anselmo Publications, Inc.';
            renderEvents();
          }
        });
      }

      const addCalBtn = document.getElementById('evtAddCalendarBtn');
      if (addCalBtn) {
        addCalBtn.onclick = () => {
          const startDate = new Date(e.date)
            .toISOString()
            .replace(/-|:|\\.\\d+/g, '');
          const endDate = new Date(
            new Date(e.date).getTime() + 2 * 60 * 60 * 1000
          )
            .toISOString()
            .replace(/-|:|\\.\\d+/g, '');
          const icsContent = [
            'BEGIN:VCALENDAR',
            'VERSION:2.0',
            'BEGIN:VEVENT',
            `DTSTART:${startDate}`,
            `DTEND:${endDate}`,
            `SUMMARY:${sTitle}`,
            `DESCRIPTION:${sDesc}`,
            `LOCATION:${sLoc}`,
            'END:VEVENT',
            'END:VCALENDAR',
          ].join('\n');
          const blob = new Blob([icsContent], { type: 'text/calendar' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${slug}.ics`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          window.showToast('Added to Calendar');
        };
      }

      // Bind share button
      const evtShareBtn = document.getElementById('evtShareBtn');
      if (evtShareBtn) {
        evtShareBtn.setAttribute('data-tooltip', 'Share');
        evtShareBtn.classList.remove('copied');
        evtShareBtn.addEventListener('click', () => {
          if (evtShareBtn.classList.contains('copied')) return;
          const shareUrl = window.location.href;
          const origHTML = evtShareBtn.innerHTML;
          const copySuccess = () => {
            window.showToast('Event link copied to clipboard!');
            if (typeof window.playAudioConfirmation === 'function') {
              window.playAudioConfirmation();
            }
            evtShareBtn.setAttribute('data-tooltip', 'Copied!');
            evtShareBtn.classList.add('copied');
            evtShareBtn.innerHTML = `
              <svg class="icon" aria-hidden="true" focusable="false" style="animation: pop 0.25s var(--spring) both; color: var(--gold);">
                <use href="#icon-check"></use>
              </svg>
            `;
            setTimeout(() => {
              evtShareBtn.setAttribute('data-tooltip', 'Share');
              evtShareBtn.classList.remove('copied');
              evtShareBtn.innerHTML = origHTML;
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
        });
      }

      // Bind speak button
      const evtSpeakBtn = document.getElementById('evtSpeakBtn');
      if (evtSpeakBtn) {
        evtSpeakBtn.classList.remove('speaking');
        evtSpeakBtn.setAttribute('data-tooltip', 'Listen');

        evtSpeakBtn.addEventListener('click', () => {
          if (!window.speechSynthesis) {
            window.showToast(
              'Text-to-speech is not supported in this browser.'
            );
            return;
          }

          if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            evtSpeakBtn.classList.remove('speaking');
            evtSpeakBtn.setAttribute('data-tooltip', 'Listen');
            return;
          }

          const title = sTitle;
          const loc = sLoc;
          const dateStr = sFormattedDate;
          const desc = e.description
            ? e.description.replace(/<[^>]+>/g, '')
            : sDesc.replace(/<[^>]+>/g, '');
          const textToSpeak =
            title + '. Date: ' + dateStr + '. Location: ' + loc + '. ' + desc;

          const utterance = new SpeechSynthesisUtterance(textToSpeak);
          utterance.lang = 'en-US';
          utterance.rate = 1.0;

          utterance.onend = () => {
            evtSpeakBtn.classList.remove('speaking');
            evtSpeakBtn.setAttribute('data-tooltip', 'Listen');
          };
          utterance.onerror = () => {
            evtSpeakBtn.classList.remove('speaking');
            evtSpeakBtn.setAttribute('data-tooltip', 'Listen');
          };

          evtSpeakBtn.classList.add('speaking');
          evtSpeakBtn.setAttribute('data-tooltip', 'Stop');
          window.speechSynthesis.speak(utterance);
        });
      }

      // Fetch images and update media column
      const images = await getEventImages(slug);
      const mediaCol = document.getElementById('singleEventGalleryContainer');
      if (mediaCol) {
        if (images.length > 0) {
          mediaCol.innerHTML = `
            <div class="event-gallery-carousel" id="eventCarousel">
              <div class="carousel-track" id="carouselTrack">
                ${images
                  .map(
                    (img, idx) => `
                  <div class="carousel-slide ${idx === 0 ? 'active' : ''}">
                    <img src="${img}" alt="Event gallery image ${idx + 1}" loading="eager">
                  </div>
                `
                  )
                  .join('')}
              </div>
              ${
                images.length > 1
                  ? `
                <button class="carousel-btn prev-btn" id="carouselPrevBtn" aria-label="Previous image">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <button class="carousel-btn next-btn" id="carouselNextBtn" aria-label="Next image">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
                <div class="carousel-dots" id="carouselDots">
                  ${images
                    .map(
                      (_, idx) => `
                    <span class="carousel-dot ${idx === 0 ? 'active' : ''}" data-idx="${idx}"></span>
                  `
                    )
                    .join('')}
                </div>
              `
                  : ''
              }
            </div>
          `;

          if (images.length > 1) {
            initCarouselEvents();
          }
        } else {
          // Render the branded vector camera fallback
          mediaCol.innerHTML = `
            <div class="single-event-fallback-wrap">
              <svg class="event-fallback-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" fill="currentColor"/>
                <circle cx="12" cy="12" r="3" fill="currentColor"/>
              </svg>
              <div class="event-fallback-text">Gallery Coming Soon</div>
            </div>
          `;

          const fallbackEl = mediaCol.querySelector(
            '.single-event-fallback-wrap'
          );
          if (fallbackEl) {
            fallbackEl.style.display = 'flex';
            fallbackEl.style.flexDirection = 'column';
            fallbackEl.style.alignItems = 'center';
            fallbackEl.style.justifyContent = 'center';
          }
        }
      }
      return;
    } else {
      const newParams = new URLSearchParams(window.location.search);
      newParams.delete('event');
      window.history.replaceState(
        {},
        '',
        window.location.pathname +
          (newParams.toString() ? '?' + newParams.toString() : '')
      );
    }
  }

  wrapper.classList.remove('hidden');
  singleView.classList.add('hidden');
  if (layoutContainer) layoutContainer.classList.remove('desktop-split');
  document.title = 'Events — San Anselmo Publications, Inc.';

  // Clear active classes from list
  document.querySelectorAll('.event-card-link').forEach((link) => {
    link.classList.remove('active');
  });

  renderEvents();
}

function initCarouselEvents() {
  const track = document.getElementById('carouselTrack');
  const prevBtn = document.getElementById('carouselPrevBtn');
  const nextBtn = document.getElementById('carouselNextBtn');
  const dotsContainer = document.getElementById('carouselDots');
  if (!track || !prevBtn || !nextBtn || !dotsContainer) return;

  const slides = Array.from(track.children);
  const dots = Array.from(dotsContainer.children);
  let currentIndex = 0;

  function goToSlide(index) {
    slides[currentIndex].classList.remove('active');
    dots[currentIndex].classList.remove('active');

    currentIndex = (index + slides.length) % slides.length;

    slides[currentIndex].classList.add('active');
    dots[currentIndex].classList.add('active');
  }

  prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
  nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));
  dotsContainer.addEventListener('click', (e) => {
    const dot = e.target.closest('.carousel-dot');
    if (dot) {
      goToSlide(parseInt(dot.dataset.idx, 10));
    }
  });
}

window.setEventFilter = function (kind, val) {
  if (kind === 'time') {
    window.timeFilter = val;
    ['efUpcoming', 'efPast', 'efAll'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('active');
    });
    const map = { upcoming: 'efUpcoming', past: 'efPast', all: 'efAll' };
    const active = document.getElementById(map[val]);
    if (active) active.classList.add('active');
  }
  if (kind === 'type') window.typeFilter = val;

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('event')) {
    window.history.pushState(null, '', window.location.pathname);
  }
  window.transitionTo(renderSingleEvent);
};

window.toggleEvtTypeOpts = function () {
  const o = document.getElementById('evtTypeOpts');
  if (!o) return;
  const open = o.classList.toggle('show');
  const btn = document.getElementById('evtTypeBtn');
  if (btn) btn.setAttribute('aria-expanded', open);
};

window.setEventTypeFromDropdown = function (t) {
  window.typeFilter = t;
  const lbl = document.getElementById('evtTypeLabel');
  if (lbl) lbl.textContent = t;
  const o = document.getElementById('evtTypeOpts');
  if (o) o.classList.remove('show');

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('event')) {
    window.history.pushState(null, '', window.location.pathname);
  }
  window.transitionTo(renderSingleEvent);
};

document.addEventListener('astro:page-load', async () => {
  if (document.body.dataset.page !== 'events') return;
  // CSP Bindings for timing filter buttons
  const upcomingBtn = document.getElementById('efUpcoming');
  if (upcomingBtn)
    upcomingBtn.addEventListener('click', () =>
      setEventFilter('time', 'upcoming')
    );

  const pastBtn = document.getElementById('efPast');
  if (pastBtn)
    pastBtn.addEventListener('click', () => setEventFilter('time', 'past'));

  const allBtn = document.getElementById('efAll');
  if (allBtn)
    allBtn.addEventListener('click', () => setEventFilter('time', 'all'));

  // CSP Bindings for type filter buttons
  const typeBtn = document.getElementById('evtTypeBtn');
  if (typeBtn) typeBtn.addEventListener('click', toggleEvtTypeOpts);

  const typeOpts = document.getElementById('evtTypeOpts');
  if (typeOpts) {
    typeOpts.addEventListener('click', (e) => {
      const opt = e.target.closest('.cs-opt');
      if (opt && opt.dataset.t) {
        setEventTypeFromDropdown(opt.dataset.t);
      }
    });
  }

  // Intercept click on event cards
  const list = document.getElementById('eventsList');
  if (list) {
    list.addEventListener('click', (e) => {
      const cardLink = e.target.closest('.event-card-link');
      if (cardLink) {
        e.preventDefault();
        const slug = cardLink.dataset.slug;
        window.history.pushState({ event: slug }, '', '?event=' + slug);
        renderSingleEvent();
      }
    });
  }

  // Popstate navigation listener
  window.addEventListener('popstate', renderSingleEvent);

  // Resize layout listener
  window.addEventListener('resize', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('event');
    if (slug) {
      const wrapper = document.getElementById('eventsGridWrapper');
      const singleView = document.getElementById('singleEventView');
      const layoutContainer = document.getElementById('eventsLayoutContainer');
      wrapper.classList.add('hidden');
      layoutContainer.classList.remove('desktop-split');
    }
  });

  // Load events
  if (window.EVENTS_CACHE && window.EVENTS_CACHE.length > 0) {
    _events = window.EVENTS_CACHE;
  } else {
    _events = await SheetsCMS.getEvents().catch(() =>
      typeof EVENTS !== 'undefined' ? EVENTS : []
    );
    window.EVENTS_CACHE = _events;
  }

  const types = [
    'All',
    'Outreach',
    'Book Fair',
    'Book Launch',
    'Book Signing',
    'Book Talk',
    'Workshop',
    'Exhibition',
  ];
  if (typeOpts) {
    typeOpts.innerHTML = types
      .map((t) => `<div class="cs-opt" data-t="${t}">${t}</div>`)
      .join('');
  }

  // Initial load route
  window.transitionTo(renderSingleEvent);

  // Close dropdown on outside click
  document.addEventListener('click', (e) => {
    const o = document.getElementById('evtTypeOpts');
    const b = document.getElementById('evtTypeBtn');
    if (o && !o.contains(e.target) && b && !b.contains(e.target)) {
      o.classList.remove('show');
      if (b) b.setAttribute('aria-expanded', 'false');
    }

    // Close kebab dropdowns when clicking outside
    document.querySelectorAll('.kebab-dropdown-menu.show').forEach((menu) => {
      const container = menu.closest('.kebab-container');
      if (container && !container.contains(e.target)) {
        menu.classList.remove('show');
      }
    });
  });
});

function initEventSocial(slug) {
  const reactsKey = `sap-event-reacts-${slug}`;
  const myReactKey = `sap-my-react-${slug}`;
  const commentsKey = `sap-event-comments-${slug}`;

  const titleSum = slug
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const defaultReacts = {
    like: 0,
    love: 0,
    haha: 0,
    wow: 0,
  };

  const myHeartedKey = `sap-my-hearted-comments-${slug}`;
  let reacts = JSON.parse(localStorage.getItem(reactsKey)) || defaultReacts;
  let myReact = localStorage.getItem(myReactKey) || null;
  let comments = JSON.parse(localStorage.getItem(commentsKey)) || [];
  let myHearted = JSON.parse(localStorage.getItem(myHeartedKey)) || [];

  const myCreatedCommentsKey = 'sap-my-created-comments';
  let myCreatedComments =
    JSON.parse(localStorage.getItem(myCreatedCommentsKey)) || [];

  // Migration for older flat comments array
  comments.forEach((c) => {
    if (!c.id) c.id = `c-${c.timestamp}`;
    if (typeof c.hearts === 'undefined') c.hearts = 0;
    if (!c.replies) c.replies = [];
    c.replies.forEach((r, idx) => {
      if (!r.id) r.id = `r-${r.timestamp || c.timestamp + idx}`;
    });
  });

  const updateReactsDom = () => {
    ['like', 'love', 'haha', 'wow'].forEach((type) => {
      const countEl = document.getElementById(`react-count-${type}`);
      const btn = document.querySelector(`.react-btn[data-reaction="${type}"]`);
      if (countEl) countEl.textContent = reacts[type] || 0;
      if (btn) {
        if (myReact === type) {
          btn.classList.add('user-reacted');
        } else {
          btn.classList.remove('user-reacted');
        }
      }
    });
  };

  updateReactsDom();

  const reactionsContainer = document.getElementById('eventReactions');
  if (reactionsContainer) {
    reactionsContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.react-btn');
      if (!btn) return;
      const type = btn.dataset.reaction;
      if (myReact === type) {
        reacts[type] = Math.max(0, reacts[type] - 1);
        myReact = null;
        localStorage.removeItem(myReactKey);
      } else {
        if (myReact) {
          reacts[myReact] = Math.max(0, reacts[myReact] - 1);
        }
        reacts[type] = (reacts[type] || 0) + 1;
        myReact = type;
        localStorage.setItem(myReactKey, type);
      }
      localStorage.setItem(reactsKey, JSON.stringify(reacts));
      updateReactsDom();
    });
  }

  let commentsList = document.getElementById('eventCommentsList');
  const renderComments = () => {
    if (!commentsList) return;
    if (comments.length === 0) {
      commentsList.innerHTML = `<p class="no-comments-msg">No comments yet. Be the first to share your thoughts!</p>`;
      return;
    }
    commentsList.innerHTML = comments
      .map((c) => {
        const sAuthor = sanitizeText(c.author);
        const sText = sanitizeText(c.text);
        const d = new Date(c.timestamp);
        const timeStr = d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        const userHearted = myHearted.includes(c.id);
        const isMyComment = myCreatedComments.includes(c.id);

        return `
        <div class="event-comment-item" data-id="${c.id}">
          <div class="comment-item-header" style="align-items: flex-start; display: flex; gap: 0.8rem;">
            <div class="comment-header-main" style="display: flex; flex-direction: column; gap: 0.1rem; flex: 1;">
              <span class="comment-item-author" style="line-height: 1.2; font-weight: 600;">${sAuthor}</span>
              <span class="comment-item-time" style="font-size: 0.75rem; color: var(--text-muted);">${timeStr}</span>
            </div>
            ${
              isMyComment
                ? `
              <div class="kebab-container">
                <button class="comment-action-btn kebab-toggle-btn" aria-label="Comment options">
                  <svg class="icon icon-kebab" aria-hidden="true" focusable="false"><use href="#icon-kebab"></use></svg>
                </button>
                <div class="kebab-dropdown-menu">
                  <button class="kebab-dropdown-item edit-comment-btn" type="button" aria-label="Edit comment">
                    <svg class="icon icon-edit" aria-hidden="true" focusable="false"><use href="#icon-edit"></use></svg>
                    <span>Edit</span>
                  </button>
                  <button class="kebab-dropdown-item delete-comment-btn" type="button" aria-label="Delete comment">
                    <svg class="icon icon-delete" aria-hidden="true" focusable="false"><use href="#icon-delete"></use></svg>
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            `
                : ''
            }
          </div>
          
          <div class="comment-view-content">
            <p class="comment-item-text">${sText}</p>
            <div class="comment-actions">
              <button class="comment-action-btn heart-comment-btn ${userHearted ? 'active' : ''}" aria-label="Heart comment">
                <svg class="icon icon-heart" aria-hidden="true" focusable="false"><use href="#icon-heart"></use></svg>
                <span class="comment-heart-count">${c.hearts || 0}</span>
              </button>
              <button class="comment-action-btn reply-toggle-btn" aria-label="Reply to comment">
                <svg class="icon icon-reply" aria-hidden="true" focusable="false"><use href="#icon-reply"></use></svg>
                <span>Reply</span>
              </button>
            </div>
          </div>
          
          ${
            isMyComment
              ? `
            <form class="comment-edit-form hidden">
              <div style="position: relative; width: 100%;">
                <textarea class="comment-text-input edit-text-input" required rows="2" maxlength="500">${sText}</textarea>
                 <div class="char-counter">${sText.length}/500</div>
              </div>
              <div class="edit-form-actions">
                <button type="submit" class="submit-comment-btn save-edit-btn">Save</button>
                <button type="button" class="comment-action-btn cancel-edit-btn">Cancel</button>
              </div>
            </form>
          `
              : ''
          }
          
          <!-- Nested Replies List -->
          <div class="comment-replies-list">
            ${
              c.replies && c.replies.length > 0
                ? c.replies
                    .map((r) => {
                      const srAuthor = sanitizeText(r.author);
                      const srText = sanitizeText(r.text);
                      const rDate = new Date(r.timestamp);
                      const rTimeStr = rDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      const isMyReply = myCreatedComments.includes(r.id);
                      return `
                <div class="comment-reply-item" data-id="${r.id}">
                  <div class="reply-item-header" style="align-items: flex-start; display: flex; gap: 0.6rem;">
                    <div style="display: flex; flex-direction: column; gap: 0.1rem; flex: 1;">
                      <span class="reply-item-author" style="line-height: 1.2; font-weight: 600;">${srAuthor}</span>
                      <span class="reply-item-time" style="font-size: 0.7rem; color: var(--text-muted);">${rTimeStr}</span>
                    </div>
                    ${
                      isMyReply
                        ? `
                      <div class="kebab-container">
                        <button class="comment-action-btn kebab-toggle-btn" aria-label="Reply options">
                          <svg class="icon icon-kebab" aria-hidden="true" focusable="false"><use href="#icon-kebab"></use></svg>
                        </button>
                        <div class="kebab-dropdown-menu">
                          <button class="kebab-dropdown-item edit-reply-btn" type="button" aria-label="Edit reply">
                            <svg class="icon icon-edit" aria-hidden="true" focusable="false"><use href="#icon-edit"></use></svg>
                            <span>Edit</span>
                          </button>
                          <button class="kebab-dropdown-item delete-reply-btn" type="button" aria-label="Delete reply">
                            <svg class="icon icon-delete" aria-hidden="true" focusable="false"><use href="#icon-delete"></use></svg>
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    `
                        : ''
                    }
                  </div>
                  
                  <div class="reply-view-content">
                    <p class="reply-item-text">${srText}</p>
                  </div>
                  
                  ${
                    isMyReply
                      ? `
                    <form class="reply-edit-form hidden">
                      <div style="position: relative; width: 100%;">
                        <textarea class="reply-text-input edit-reply-text-input" required rows="2" maxlength="500">${srText}</textarea>
                         <div class="char-counter">${srText.length}/500</div>
                      </div>
                      <div class="edit-form-actions">
                        <button type="submit" class="submit-reply-btn save-reply-edit-btn">Save</button>
                        <button type="button" class="comment-action-btn cancel-reply-edit-btn">Cancel</button>
                      </div>
                    </form>
                  `
                      : ''
                  }
                </div>
              `;
                    })
                    .join('')
                : ''
            }
          </div>
          
          <!-- Reply Form -->
          <form class="comment-reply-form hidden">
            <div class="reply-input-group">
              <input type="text" placeholder="Your Name" class="reply-author-input" required>
              <div style="position: relative; width: 100%; display: flex;">
                <textarea placeholder="Write a reply..." rows="1" class="reply-text-input" required maxlength="500" style="flex:1; margin-bottom:0;"></textarea>
                 <div class="char-counter">0/500</div>
              </div>
            </div>
            <button type="submit" class="submit-reply-btn">Reply</button>
          </form>
        </div>
      `;
      })
      .join('');
  };

  renderComments();

  if (commentsList) {
    // Recreate element to purge dynamic event listeners cleanly
    const newList = commentsList.cloneNode(true);
    commentsList.parentNode.replaceChild(newList, commentsList);
    commentsList = newList;

    commentsList.addEventListener('click', (e) => {
      const kebabToggleBtn = e.target.closest('.kebab-toggle-btn');
      if (kebabToggleBtn) {
        e.stopPropagation();
        const menu = kebabToggleBtn.nextElementSibling;
        if (menu) {
          document
            .querySelectorAll('.kebab-dropdown-menu.show')
            .forEach((m) => {
              if (m !== menu) m.classList.remove('show');
            });
          menu.classList.toggle('show');
        }
        return;
      }

      const heartBtn = e.target.closest('.heart-comment-btn');
      const replyToggleBtn = e.target.closest('.reply-toggle-btn');

      const editCommentBtn = e.target.closest('.edit-comment-btn');
      const cancelEditBtn = e.target.closest('.cancel-edit-btn');
      const deleteCommentBtn = e.target.closest('.delete-comment-btn');

      const editReplyBtn = e.target.closest('.edit-reply-btn');
      const cancelReplyEditBtn = e.target.closest('.cancel-reply-edit-btn');
      const deleteReplyBtn = e.target.closest('.delete-reply-btn');

      if (heartBtn) {
        const commentItem = heartBtn.closest('.event-comment-item');
        if (!commentItem) return;
        const commentId = commentItem.dataset.id;
        const comment = comments.find((c) => c.id === commentId);
        if (!comment) return;

        const idx = myHearted.indexOf(commentId);
        if (idx > -1) {
          comment.hearts = Math.max(0, comment.hearts - 1);
          myHearted.splice(idx, 1);
        } else {
          comment.hearts = (comment.hearts || 0) + 1;
          myHearted.push(commentId);
        }
        localStorage.setItem(myHeartedKey, JSON.stringify(myHearted));
        localStorage.setItem(commentsKey, JSON.stringify(comments));
        renderComments();
      }

      if (replyToggleBtn) {
        const commentItem = replyToggleBtn.closest('.event-comment-item');
        if (!commentItem) return;
        const form = commentItem.querySelector('.comment-reply-form');
        if (form) {
          form.classList.toggle('hidden');
          if (!form.classList.contains('hidden')) {
            const authorIn = form.querySelector('.reply-author-input');
            if (authorIn) authorIn.focus();
          }
        }
      }

      if (editCommentBtn) {
        const menu = editCommentBtn.closest('.kebab-dropdown-menu');
        if (menu) menu.classList.remove('show');
        const commentItem = editCommentBtn.closest('.event-comment-item');
        if (commentItem) {
          commentItem.classList.add('editing');
          const txt = commentItem.querySelector('.edit-text-input');
          if (txt) {
            txt.focus();
            const len = txt.value.length;
            txt.setSelectionRange(len, len);
          }
        }
      }

      if (cancelEditBtn) {
        const commentItem = cancelEditBtn.closest('.event-comment-item');
        if (commentItem) {
          commentItem.classList.remove('editing');
          const commentId = commentItem.dataset.id;
          const comment = comments.find((c) => c.id === commentId);
          const txt = commentItem.querySelector('.edit-text-input');
          if (comment && txt) {
            txt.value = comment.text;
          }
        }
      }

      if (deleteCommentBtn) {
        const menu = deleteCommentBtn.closest('.kebab-dropdown-menu');
        if (menu) menu.classList.remove('show');
        const commentItem = deleteCommentBtn.closest('.event-comment-item');
        if (commentItem) {
          const commentId = commentItem.dataset.id;
          if (
            confirm(
              'Are you sure you want to delete your comment? This cannot be undone.'
            )
          ) {
            comments = comments.filter((c) => c.id !== commentId);
            localStorage.setItem(commentsKey, JSON.stringify(comments));
            renderComments();
          }
        }
      }

      if (editReplyBtn) {
        const menu = editReplyBtn.closest('.kebab-dropdown-menu');
        if (menu) menu.classList.remove('show');
        const replyItem = editReplyBtn.closest('.comment-reply-item');
        if (replyItem) {
          replyItem.classList.add('editing');
          const txt = replyItem.querySelector('.edit-reply-text-input');
          if (txt) {
            txt.focus();
            const len = txt.value.length;
            txt.setSelectionRange(len, len);
          }
        }
      }

      if (cancelReplyEditBtn) {
        const replyItem = cancelReplyEditBtn.closest('.comment-reply-item');
        if (replyItem) {
          replyItem.classList.remove('editing');
          const commentItem = replyItem.closest('.event-comment-item');
          if (commentItem) {
            const commentId = commentItem.dataset.id;
            const replyId = replyItem.dataset.id;
            const comment = comments.find((c) => c.id === commentId);
            if (comment && comment.replies) {
              const reply = comment.replies.find((r) => r.id === replyId);
              const txt = replyItem.querySelector('.edit-reply-text-input');
              if (reply && txt) {
                txt.value = reply.text;
              }
            }
          }
        }
      }

      if (deleteReplyBtn) {
        const menu = deleteReplyBtn.closest('.kebab-dropdown-menu');
        if (menu) menu.classList.remove('show');
        const replyItem = deleteReplyBtn.closest('.comment-reply-item');
        const commentItem = replyItem
          ? replyItem.closest('.event-comment-item')
          : null;
        if (replyItem && commentItem) {
          const commentId = commentItem.dataset.id;
          const replyId = replyItem.dataset.id;
          if (
            confirm(
              'Are you sure you want to delete your reply? This cannot be undone.'
            )
          ) {
            const comment = comments.find((c) => c.id === commentId);
            if (comment && comment.replies) {
              comment.replies = comment.replies.filter((r) => r.id !== replyId);
              localStorage.setItem(commentsKey, JSON.stringify(comments));
              renderComments();
            }
          }
        }
      }
    });

    commentsList.addEventListener('submit', (e) => {
      const replyForm = e.target.closest('.comment-reply-form');
      const editCommentForm = e.target.closest('.comment-edit-form');
      const editReplyForm = e.target.closest('.reply-edit-form');

      if (replyForm) {
        e.preventDefault();
        const commentItem = replyForm.closest('.event-comment-item');
        if (!commentItem) return;
        const commentId = commentItem.dataset.id;
        const comment = comments.find((c) => c.id === commentId);
        if (!comment) return;

        const authorIn = replyForm.querySelector('.reply-author-input');
        const textIn = replyForm.querySelector('.reply-text-input');
        if (!authorIn || !textIn) return;

        const author = authorIn.value.trim();
        const text = textIn.value.trim();
        if (!author || !text) return;

        if (!comment.replies) comment.replies = [];
        const newReplyId = `r-${Date.now()}`;
        comment.replies.push({
          id: newReplyId,
          author,
          text,
          timestamp: Date.now(),
        });

        myCreatedComments.push(newReplyId);
        localStorage.setItem(
          myCreatedCommentsKey,
          JSON.stringify(myCreatedComments)
        );

        localStorage.setItem(commentsKey, JSON.stringify(comments));
        renderComments();
      }

      if (editCommentForm) {
        e.preventDefault();
        const commentItem = editCommentForm.closest('.event-comment-item');
        if (!commentItem) return;
        const commentId = commentItem.dataset.id;
        const comment = comments.find((c) => c.id === commentId);
        if (!comment) return;

        const textIn = editCommentForm.querySelector('.edit-text-input');
        if (!textIn) return;

        const text = textIn.value.trim();
        if (!text) return;

        comment.text = text;
        localStorage.setItem(commentsKey, JSON.stringify(comments));
        renderComments();
      }

      if (editReplyForm) {
        e.preventDefault();
        const replyItem = editReplyForm.closest('.comment-reply-item');
        const commentItem = replyItem
          ? replyItem.closest('.event-comment-item')
          : null;
        if (!replyItem || !commentItem) return;

        const commentId = commentItem.dataset.id;
        const replyId = replyItem.dataset.id;
        const comment = comments.find((c) => c.id === commentId);
        if (!comment || !comment.replies) return;

        const reply = comment.replies.find((r) => r.id === replyId);
        if (!reply) return;

        const textIn = editReplyForm.querySelector('.edit-reply-text-input');
        if (!textIn) return;

        const text = textIn.value.trim();
        if (!text) return;

        reply.text = text;
        localStorage.setItem(commentsKey, JSON.stringify(comments));
        renderComments();
      }
    });
  }

  // Global listener for character counters
  document.addEventListener('input', (e) => {
    if (e.target.tagName === 'TEXTAREA' && e.target.hasAttribute('maxlength')) {
      const len = e.target.value.length;
      const max = e.target.getAttribute('maxlength');
      const counter = e.target.nextElementSibling;
      if (counter && counter.classList.contains('char-counter')) {
        counter.textContent = `${len}/${max}`;
      }
    }
  });

  const commentForm = document.getElementById('eventCommentForm');
  const textInput = document.getElementById('commentText');
  const charCounter = document.getElementById('commentCharCounter');

  if (commentForm) {
    commentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const authorInput = document.getElementById('commentAuthor');
      if (!authorInput || !textInput) return;

      const author = authorInput.value.trim();
      const text = textInput.value.trim();
      if (!author || !text) return;

      const newCommentId = `c-${Date.now()}`;
      comments.push({
        id: newCommentId,
        author,
        text,
        timestamp: Date.now(),
        hearts: 0,
        replies: [],
      });

      myCreatedComments.push(newCommentId);
      localStorage.setItem(
        myCreatedCommentsKey,
        JSON.stringify(myCreatedComments)
      );

      localStorage.setItem(commentsKey, JSON.stringify(comments));
      textInput.value = '';
      if (charCounter) charCounter.textContent = '0/500';
      renderComments();
    });
  }
}
