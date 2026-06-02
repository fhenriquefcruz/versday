const CACHE_NAME = 'versday-v1';
const urlsToCache = [
  './',
  './index.html',
  './css/styles.css',
  './js/state.js',
  './js/api.js',
  './js/fallbackVerses.js',
  './js/semantic.js',
  './js/cache.js',
  './js/history.js',
  './js/favorites.js',
  './js/theme.js',
  './js/background.js',
  './js/share.js',
  './js/main.js',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache)));
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
