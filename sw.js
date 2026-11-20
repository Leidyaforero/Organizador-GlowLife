
const CACHE_NAME = 'glowlife-v3';

const APP_FILES = [
  './',
  './index.html',
  './manifest.json'
];

// Instalar nueva versión
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

// Activar nueva versión y eliminar cachés antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key =>
              key.startsWith('glowlife-') &&
              key !== CACHE_NAME
            )
            .map(key => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// Consultar primero la versión publicada en Internet
self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // No interceptar archivos de otros dominios
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      try {
        const response = await fetch(request);

        if (response.ok) {
          event.waitUntil(
            cache.put(request, response.clone()).catch(() => {})
          );
        }

        return response;

      } catch (error) {
        const cached = await cache.match(request);

        if (cached) return cached;

        if (request.mode === 'navigate') {
          return await cache.match('./index.html') ||
            Response.error();
        }

        return Response.error();
      }
    })()
  );
});
