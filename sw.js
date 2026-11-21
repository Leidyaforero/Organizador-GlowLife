const CACHE_NAME = 'glowlife-v9';

const APP_FILES = [
  './',
  './index.html',
  './manifest.json',
  './css/glow.css?v=9'
];

// Instalar archivos básicos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
  );
});

// Activar la nueva versión y limpiar cachés anteriores
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

// Esperar a que la persona acepte la actualización
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Navegación y archivos: primero Internet, luego caché
self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request, { cache: 'no-cache' });

        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone()).catch(() => {});
        }

        return response;

      } catch (error) {
        const cached = await caches.match(request, { ignoreSearch: true });

        if (cached) return cached;

        if (request.mode === 'navigate') {
          return await caches.match('./index.html') ||
            Response.error();
        }

        return Response.error();
      }
    })()
  );
});
