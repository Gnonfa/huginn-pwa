// Huginn Service Worker — offline-first caching
const CACHE = 'huginn-v1';

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// ── Install: pre-cache app shell ──────────────────────────────────────────────
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// ── Activate: remove old caches ───────────────────────────────────────────────
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: cache-first for app shell, network-first for external ──────────────
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // App shell: serve from cache, fallback to network
  if (url.hostname === self.location.hostname) {
    e.respondWith(
      caches.match(e.request).then(
        (cached) => cached || fetch(e.request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
          return res;
        })
      ).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // External requests: network only (no caching)
  e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
});
