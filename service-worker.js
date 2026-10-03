// service-worker.js
const CACHE_NAME = 'versday-v6-visual-semantic';

const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/state.js',
  './js/api.js',
  './js/fallbackVerses.js',
  './js/semantic.js',
  './js/visualIntelligence.js',
  './js/biblicalContext.js',
  './js/visualCatalog.js',
  './js/visualSelector.js',
  './js/visualAnalysis.js',
  './js/visualMemory.js',
  './js/visualProvider.js',
  './js/visualEngine.js',
  './js/cache.js',
  './js/history.js',
  './js/favorites.js',
  './js/theme.js',
  './js/background.js',
  './js/share.js',
  './js/chat.js',
  './js/gemini.js',
  './js/unsplash.js',
  './js/main.js',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.allSettled(ASSETS.map(url => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Mutations e endpoints server-side ficam sempre sob responsabilidade da rede.
  if (event.request.method !== 'GET') return;

  const url = event.request.url;
  if (
    url.includes('/api/') ||
    url.includes('bible-api.com') ||
    url.includes('api.groq.com') ||
    url.includes('googleapis.com') ||
    url.includes('unsplash.com') ||
    url.includes('pexels.com') ||
    url.includes('fonts.gstatic.com') ||
    url.includes('fonts.googleapis.com')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request)
        .then(response => {
          if (response.ok) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
          }
          return response;
        })
      )
      .catch(() => {
        if (event.request.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      })
  );
});
