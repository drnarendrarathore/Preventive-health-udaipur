
const CACHE_NAME = 'healthscreen-v60-prod';

// CRITICAL: Only cache assets that exist in the dist/ build folder.
// DO NOT cache .tsx, .ts, or source files here.
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

self.addEventListener('install', event => {
  self.skipWaiting(); // Activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Opened cache and caching App Shell');
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.filter(name => name !== CACHE_NAME).map(name => {
            return caches.delete(name);
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', event => {
  // Navigation requests: Network first, fall back to cached index.html (SPA support)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Asset requests: Stale-while-revalidate strategy
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
          // Fallback if offline and not in cache
      });

      return cachedResponse || fetchPromise;
    })
  );
});
