
// FIX: Incremented cache version to v19 to ensure all clients receive the latest application logic and fixes.
const CACHE_NAME = 'healthscreen-v19';
const urlsToCache = [
  // App Shell
  '/',
  '/index.html',
  '/styles.css',
  '/vite.svg',
  '/manifest.json',
  
  // Core Dependencies (from importmap)
  'https://esm.sh/react@19.2.3',
  'https://esm.sh/react-dom@19.2.3/client',
  'https://esm.sh/jspdf@2.5.1',
  'https://esm.sh/canvas-confetti@1.9.3',

  // App Source
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/constants.ts',
  '/components/WelcomeStep.tsx',
  '/components/BasicInfoStep.tsx',
  '/components/HabitsStep.tsx',
  '/components/RiskFactorsStep.tsx',
  '/components/ResultsDisplay.tsx',
  '/components/RecommendationCard.tsx',
  '/components/StepIndicator.tsx',
  '/components/SkeletonLoader.tsx',
  '/components/NCDRiskGauge.tsx',
  '/components/RadarChart.tsx',
  '/components/Modal.tsx',
  '/components/form/TextInput.tsx',
  '/components/form/ToggleButton.tsx',
  '/components/form/InteractiveBMICalculator.tsx',
  '/components/svg/InteractiveFigure.tsx',
  '/services/rulesEngine.ts',
  '/services/chartUtils.ts',
  '/locales/en.ts',
  '/locales/index.ts',
  '/locales/recommendations.ts',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Opened cache and caching URLs');
      return cache.addAll(urlsToCache);
    }).catch(err => {
      console.error('Failed to cache URLs:', err);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then(fetchResponse => {
        // Check if we received a valid response before caching
        if (fetchResponse && fetchResponse.status === 200) {
          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return fetchResponse;
      });
    }).catch(() => {
      // If both cache and network fail, return a fallback page.
      // This is crucial for a true offline-first experience.
      return caches.match('/');
    })
  );
});
