// Incrementar versão a cada deploy para forçar atualização do cache
const CACHE_NAME = 'versday-v4';

// Caminhos relativos — funciona tanto na raiz quanto em /versday/
const ASSETS = [
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
  './js/chat.js',
  './js/gemini.js',
  './js/unsplash.js',
  './js/main.js',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // addAll falha se qualquer arquivo não existir — usa add individual com tratamento
        return Promise.allSettled(ASSETS.map(url => cache.add(url)));
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // APIs externas sempre via rede — nunca cacheadas
  const url = event.request.url;
  if (
    url.includes('bible-api.com') ||
    url.includes('api.groq.com') ||
    url.includes('googleapis.com') ||
    url.includes('unsplash.com') ||
    url.includes('pexels.com') ||
    url.includes('fonts.gstatic.com') ||
    url.includes('fonts.googleapis.com')
  ) {
    return; // deixa o browser lidar normalmente
  }

  event.respondWith(
    caches.match(event.request)
      .then(cached => cached || fetch(event.request)
        .then(response => {
          // Só cacheia respostas válidas de assets locais
          if (response.ok && event.request.method === 'GET') {
            caches.open(CACHE_NAME).then(c => c.put(event.request, response.clone()));
          }
          return response;
        })
      )
      .catch(() => caches.match('./index.html'))
  );
});
