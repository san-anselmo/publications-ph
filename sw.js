const CACHE_NAME = 'sap-cache-v2.40.8';
const ASSETS = [
  'index.html',
  'about.html',
  'team.html',
  'authors.html',
  'news.html',
  'events.html',
  'contact.html',
  'order.html',
  'css/styles.css',
  'js/components.js',
  'js/catalog.js',
  'js/sheets-cms.js',
  'js/authors.js',
  'js/events.js',
  'js/error-logger.js',
  'js/search-worker.js',
  'data/fallback-data.js',
  'images/sap logo only.webp',
  'images/San Anselmo Press logo.webp',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') {
    e.respondWith(fetch(e.request));
    return;
  }

  const url = new URL(e.request.url);

  // 1. Google Sheets API (docs.google.com) - Network-First, Fallback-to-Cache
  if (url.hostname === 'docs.google.com') {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          if (response.ok || response.type === 'opaque') {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(e.request);
        })
    );
    return;
  }

  // 2. Default Strategy: Stale-While-Revalidate (with Opaque response support and Navigation fallback)
  e.respondWith(
    caches
      .match(e.request, { ignoreSearch: true })
      .then((cached) => {
        const networkFetch = fetch(e.request)
          .then((response) => {
            if (response.ok || response.type === 'opaque') {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(e.request, responseClone);
              });
            }
            return response;
          })
          .catch((err) => {
            // If navigation fails (e.g. offline navigating to a sub-route or page)
            if (e.request.mode === 'navigate') {
              return caches.match('index.html');
            }
            throw err;
          });

        return cached || networkFetch;
      })
      .catch((err) => {
        // General fallback if match fails and network is down
        if (e.request.mode === 'navigate') {
          return caches.match('index.html');
        }
        throw err;
      })
  );
});
