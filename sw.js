// Service Worker for CVI Range Rating II Calculator
// Bump CACHE_VERSION whenever app files change to force a cache refresh
const CACHE_VERSION = 'v5';
const CACHE_NAME = `cvi-calculator-${CACHE_VERSION}`;

// All local assets to pre-cache on install
const LOCAL_ASSETS = [
  './index.html',
  './manifest.json',
  './rangeiiicon.png',
  './rangeiiicon-192.png',
  './rangeiiicon-512.png'
];

// ── Install: pre-cache all local assets ──────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(LOCAL_ASSETS))
      .then(() => self.skipWaiting()) // activate immediately without waiting for old tabs to close
  );
});

// ── Activate: delete old cache versions ──────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith('cvi-calculator-') && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim()) // take control of all open tabs immediately
  );
});

// ── Fetch: cache-first for local, network-first for external ─────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isLocal = url.origin === self.location.origin;

  if (isLocal) {
    // Cache-first for local assets: fast loads and full offline support
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
  } else {
    // Network-first for external resources (fonts, CDN scripts)
    // Falls back to cache so the app still loads offline
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  }
});