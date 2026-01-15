
const CACHE_NAME = 'healthscreen-v50-prod';

// CRITICAL: Only cache assets that actually exist in the production build (dist folder).
// Do NOT cache source files like .tsx, .ts, or root styles.css (which gets bundled).
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg'
];

self.addEventListener('install', event => {
  // Force this new service worker to become the active one immediately
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Opened cache and caching App Shell');
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', event => {
  // Claim clients immediately so the new SW controls the page
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.filter(name => name !== CACHE_NAME).map(name => {
            console.log('Deleting old cache:', name);
            return caches.delete(name);
          })
        );
      })
    ])
  );
});

self.addEventListener('fetch', event => {
  // 1. Navigation (HTML): Network First
  // Ensures we always get the latest index.html (with new hashed asset references)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('/index.html');
        })
    );
    return;
  }

  // 2. Assets (JS/CSS/Images): Stale-While-Revalidate
  // Serve cached files instantly, but update them in the background
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      const fetchPromise = fetch(event.request).then(networkResponse => {
        // Only cache valid responses
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
        });
        return networkResponse;
      }).catch(() => {
          // Swallow fetch errors for assets (offline mode reliance)
      });

      return cachedResponse || fetchPromise;
    })
  );
});
