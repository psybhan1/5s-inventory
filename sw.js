const CACHE_NAME = 'inv-cache-v3';
const urlsToCache = [
  './',
  './index.html',
  './manifest.webmanifest',
  './data.json',
  './icon-192.png',
  './icon-512.png'
];

// Compute base path (project subfolder) from sw.js URL
const BASE_PATH = self.location.pathname.replace(/sw\.js$/, '');

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

  // Only intercept requests that belong to THIS app’s path
  const isSameOrigin = url.origin === self.location.origin;
  const inScope = isSameOrigin && url.pathname.startsWith(BASE_PATH);
  if (!inScope) return; // don’t hijack other GitHub pages

  event.respondWith(
    caches.match(event.request).then((resp) => resp || fetch(event.request))
  );
});
