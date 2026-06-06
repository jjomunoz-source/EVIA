const CACHE_NAME = 'evia-v8';

const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
];

const ASSETS = [
  './assets/logo.png',
  './assets/eva.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
];

function isAppShellRequest(request) {
  if (request.mode === 'navigate') return true;

  const url = new URL(request.url);
  return (
    url.pathname.endsWith('/') ||
    url.pathname.endsWith('/index.html') ||
    url.pathname.endsWith('/app.js') ||
    url.pathname.endsWith('/style.css') ||
    url.pathname.endsWith('/manifest.json')
  );
}

function isAssetRequest(request) {
  const url = new URL(request.url);
  return ASSETS.some((asset) => url.pathname.endsWith(asset.replace('./', '/')));
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request);

    if (response && response.ok) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    const cachedResponse = await cache.match(request, { ignoreSearch: true });
    if (cachedResponse) return cachedResponse;

    throw error;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request, { ignoreSearch: true });

  if (cachedResponse) return cachedResponse;

  const response = await fetch(request);

  if (response && response.ok) {
    cache.put(request, response.clone());
  }

  return response;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll([...APP_SHELL, ...ASSETS]))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  if (isAppShellRequest(event.request)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  if (isAssetRequest(event.request)) {
    event.respondWith(cacheFirst(event.request));
  }
});
