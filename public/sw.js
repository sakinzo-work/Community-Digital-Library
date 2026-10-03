const CACHE_PREFIX = 'community-digital-library';
const STATIC_CACHE = `${CACHE_PREFIX}-static-v1`;
const RUNTIME_CACHE = `${CACHE_PREFIX}-runtime-v1`;

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/maskable-icon-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/icon.svg',
  '/icons/maskable-icon.svg',
  '/icons/apple-touch-icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith(CACHE_PREFIX))
          .filter((cacheName) => cacheName !== STATIC_CACHE && cacheName !== RUNTIME_CACHE)
          .map((cacheName) => caches.delete(cacheName))
      )
    )
  );
  self.clients.claim();
});

async function networkFirst(request, fallbackUrl = '/') {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cachedResponse = await cache.match(request);
    return cachedResponse || caches.match(fallbackUrl);
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.endsWith('.pdf') ||
    url.pathname.startsWith('/@vite') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.includes('@react-refresh') ||
    url.searchParams.has('t')
  ) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, '/'));
    return;
  }

  if (
    ['script', 'style', 'image', 'font', 'manifest'].includes(request.destination) ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.startsWith('/icons/')
  ) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
