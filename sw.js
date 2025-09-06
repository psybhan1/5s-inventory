// Bump the cache version whenever data.json is updated so that stale
// caches are cleaned up on activation.  This version should be
// incremented in lockstep with the DATA_VERSION used in index.html.
const CACHE_NAME = 'inv-cache-v5';
const urlsToCache = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  // Determine base path from sw.js location
  const BASE_PATH = self.location.pathname.replace(/sw\.js$/, '');
  const inScope = url.origin === self.location.origin && url.pathname.startsWith(BASE_PATH);
  if (!inScope) return; // do not hijack other GitHub pages

  // Network-first strategy for data.json: always try to get latest version
  if (url.pathname.endsWith('/data.json')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-store' })
        .then(resp => {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, copy));
          return resp;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Default cache-first for other assets
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});
