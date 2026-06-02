const CACHE_NAME = 'versday-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/styles.css',
  '/js/main.js',
  '/js/api.js',
  '/js/cache.js',
  '/js/favorites.js',
  '/js/history.js',
  '/js/theme.js',
  '/js/share.js',
  '/js/ui.js',
  '/js/background.js',
  '/js/semantic.js',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
