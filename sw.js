const CACHE_NAME = 'scrabble-marcador-v4';
const ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Mono:wght@400;500&family=Lato:wght@300;400;700&family=UnifrakturMaguntia&display=swap'
];

// Instalar y cachear recursos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Activar y limpiar caches viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache first, luego red
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Solo interceptar GET
  if (event.request.method !== 'GET') return;

  // Ignorar esquemas no-http (chrome-extension://, moz-extension://, etc.)
  if (!url.startsWith('http://') && !url.startsWith('https://')) return;

  // Peticiones a APIs externas → siempre red, sin cachear
  if (
    url.includes('wiktionary.org') ||
    url.includes('dictionaryapi') ||
    url.includes('anthropic.com')
  ) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Solo cachear respuestas válidas y no-opacas
        if (
          response &&
          response.status === 200 &&
          response.type !== 'opaque' &&
          url.startsWith('https://')
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match('./index.html'));
    })
  );
});