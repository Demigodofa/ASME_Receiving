/* Why: Version bump invalidates old caches during updates. */
const CACHE_VERSION = 'p1-v1';
const CACHE_NAME = `phase1-${CACHE_VERSION}`;
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting(); // Why: Make updates immediate in dev.
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter(k => k.startsWith('phase1-') && k !== CACHE_NAME).map(k => caches.delete(k)));
      await self.clients.claim(); // Why: Control existing pages without reload.
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // App shell: network-first for HTML; cache-first for static.
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(networkThenCache(req));
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

async function networkThenCache(request) {
  try {
    const res = await fetch(request, { cache: 'no-store' });
    const cache = await caches.open(CACHE_NAME);
    cache.put('./index.html', res.clone());
    return res;
  } catch {
    const cached = await caches.match('./index.html');
    return cached || new Response('<h1>Offline</h1>', { headers: { 'Content-Type': 'text/html' } });
  }
}
