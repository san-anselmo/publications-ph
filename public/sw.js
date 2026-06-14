importScripts(
  'https://storage.googleapis.com/workbox-cdn/releases/6.4.1/workbox-sw.js'
);

if (workbox) {
  console.log('Workbox is loaded');

  workbox.core.setCacheNameDetails({
    prefix: 'sap',
    suffix: 'v2.40.8',
    precache: 'precache',
    runtime: 'runtime',
  });

  const { registerRoute } = workbox.routing;
  const { StaleWhileRevalidate, CacheFirst, NetworkFirst } = workbox.strategies;
  const { ExpirationPlugin } = workbox.expiration;
  const { CacheableResponsePlugin } = workbox.cacheableResponse;

  // Cache Pages (stale-while-revalidate to ensure fast loads but updates in background)
  registerRoute(
    ({ request }) => request.mode === 'navigate',
    new StaleWhileRevalidate({
      cacheName: 'sap-pages-cache',
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
      ],
    })
  );

  // Cache CSS/JS bundles
  registerRoute(
    ({ request }) =>
      request.destination === 'style' || request.destination === 'script',
    new StaleWhileRevalidate({
      cacheName: 'sap-assets-cache',
    })
  );

  // Cache Images (Cache-First strategy with expiration)
  registerRoute(
    ({ request }) => request.destination === 'image',
    new CacheFirst({
      cacheName: 'sap-images-cache',
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
          purgeOnQuotaError: true,
        }),
      ],
    })
  );

  // Cache Google Fonts
  registerRoute(
    ({ url }) =>
      url.origin === 'https://fonts.googleapis.com' ||
      url.origin === 'https://fonts.gstatic.com',
    new CacheFirst({
      cacheName: 'sap-google-fonts',
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new ExpirationPlugin({
          maxEntries: 20,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 Year
        }),
      ],
    })
  );

  // Cache Google Sheets CMS API (Network-First, falling back to cache if offline)
  registerRoute(
    ({ url }) => url.hostname === 'docs.google.com',
    new NetworkFirst({
      cacheName: 'sap-sheets-api-cache',
      plugins: [
        new CacheableResponsePlugin({
          statuses: [0, 200],
        }),
        new ExpirationPlugin({
          maxEntries: 10,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 Days
        }),
      ],
    })
  );

  // Force activation and claim clients
  self.addEventListener('install', () => self.skipWaiting());
  self.addEventListener('activate', () => self.clients.claim());
} else {
  console.error('Workbox failed to load');
}
