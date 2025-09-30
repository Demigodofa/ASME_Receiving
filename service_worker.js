/* Why: Version bump forces old caches to be dropped on update. */
const CACHE_VERSION = 'p1-v2';
const CACHE_NAME = `asme-receiving-${CACHE_VERSION}`;

/* Only include files that certainly exist to avoid install failing. */
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest'
];

/* Optional assets: attempt to cache but ignore if missing. */
const OPTIONAL_ASSETS = [
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-180.png', // iOS touch icon (optional)
  './assets/icons/icon-32.png'   // favicon (optional)
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE_ASSETS);
    // Try optional assets; ignore 404s.
    await Promise.all(OPTIONAL_ASSETS.map(async (url) => {
      try { const res = await fetch(url, { cache: 'no-cache' }); if (res.ok) await cache.put(url, res.clone()); }
      catch { /* ignore missing */ }
    }));
  })());
  self.skipWaiting(); // dev convenience
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('asme-receiving-') && k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

/* Strategy: HTML network-first (fresh content), static cache-first. */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const accept = req.headers.get('accept') || '';
  if (req.mode === 'navigate' || accept.includes('text/html')) {
    event.respondWith(networkThenCache(req, './index.html'));
  } else {
    event.respondWith(cacheThenNetwork(req));
  }
});

async function cacheThenNetwork(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, res.clone());
    return res;
  } catch {
    return cached || new Response('', { status: 504, statusText: 'Offline' });
  }
}

async function networkThenCache(request, fallbackPath) {
  try {
    const res = await fetch(request, { cache: 'no-store' });
    const cache = await caches.open(CACHE_NAME);
    cache.put(fallbackPath, res.clone());
    return res;
  } catch {
    const cached = await caches.match(fallbackPath);
    return cached || new Response('<h1>Offline</h1>', { headers: { 'Content-Type': 'text/html' } });
  }
}
