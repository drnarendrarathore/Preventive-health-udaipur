// FIX: Incremented cache version to v35 to ensure all clients receive the latest application logic and fixes.
const CACHE_NAME = 'healthscreen-v35';
const urlsToCache = [
  // App Shell
  '/',
  '/index.html',
  '/styles.css',
  '/icon.svg',
  '/manifest.json',
  
  // App Source
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/constants.ts',
  '/themes.ts',
  '/components/WelcomeStep.tsx',
  '/components/BasicInfoStep.tsx',
  '/components/HabitsStep.tsx',
  '/components/RiskFactorsStep.tsx',
  '/components/ResultsDisplay.tsx',
  '/components/RecommendationCard.tsx',
  '/components/ArogyaClinicCard.tsx',
  '/components/StepIndicator.tsx',
  '/components/SkeletonLoader.tsx',
  '/components/KeyInsightsCard.tsx',
  '/components/RadarChart.tsx',
  '/components/Modal.tsx',
  '/components/form/TextInput.tsx',
  '/components/form/ToggleButton.tsx',
  '/components/form/RadioGroup.tsx',
  '/components/form/InteractiveBMICalculator.tsx',
  '/components/svg/InteractiveFigure.tsx',
  '/services/rulesEngine.ts',
  '/services/chartUtils.ts',
  '/services/shareService.ts',
  '/services/analysisUtils.ts',
  '/services/pdfGenerator.ts',
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
        if (fetchResponse && fetchResponse.status === 200) {
          const responseToCache = fetchResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return fetchResponse;
      });
    }).catch(() => {
      return caches.match('/');
    })
  );
});