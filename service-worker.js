// Service Worker do VersDay.
// Assets locais usam network-first para que um deploy novo nunca fique preso
// atrás de um cache antigo. O cache permanece apenas como fallback offline.
const CACHE_NAME = 'versday-v9-responsive-safe-area';

// Caminhos relativos — funciona tanto na raiz quanto em /versday/
const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/state.js',
  './js/api.js',
  './js/fallbackVerses.js',
  './js/semantic.js',
  './js/backendHealth.js',
  './js/visualIntelligence.js',
  './js/biblical-context.js',
  './js/visualCatalog.js',
  './js/visualSelector.js',
  './js/visualMemory.js',
  './js/visualProvider.js',
  './js/visualEngine.js',
  './js/visual-analysis.js',
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
      .then(cache => Promise.allSettled(
        ASSETS.map(url => cache.add(url))
      ))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

function isBypassedRequest(url) {
  return (
    url.pathname.startsWith('/api/') ||
    url.hostname === 'bible-api.com' ||
    url.hostname === 'api.groq.com' ||
    url.hostname.endsWith('googleapis.com') ||
    url.hostname.endsWith('unsplash.com') ||
    url.hostname.endsWith('pexels.com') ||
    url.hostname === 'fonts.gstatic.com' ||
    url.hostname === 'fonts.googleapis.com'
  );
}

async function cacheSuccessfulResponse(request, response) {
  if (!response?.ok) return response;

  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
  return response;
}

async function localNetworkFirst(request) {
  try {
    const response = await fetch(request, { cache: 'no-cache' });
    return await cacheSuccessfulResponse(request, response);
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    if (request.mode === 'navigate') {
      return await caches.match('./index.html');
    }

    throw new Error('VERSDAY_OFFLINE_ASSET_MISS');
  }
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  let url;
  try {
    url = new URL(event.request.url);
  } catch {
    return;
  }

  // APIs, fontes e imagens externas ficam sob controle do navegador/provider.
  if (isBypassedRequest(url)) return;

  // O Service Worker só administra recursos do próprio origin do VersDay.
  if (url.origin !== self.location.origin) return;

  event.respondWith(localNetworkFirst(event.request));
});
