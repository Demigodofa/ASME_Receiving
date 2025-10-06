/* -------- Welder's Helper SW (robust update) -------- */
const CACHE_VERSION = 'wh-v28';                 // <- bump every release
const CACHE_NAME    = `welders-helper-${CACHE_VERSION}`;

// Tip: add a short token to bust cache on core files if needed
const V = CACHE_VERSION;

const CORE_ASSETS = [
  `./index.html?${V}`,
  `./app.html?${V}`,
  `./jobs.html?${V}`,
  `./receiving.html?${V}`,
  './assets/icon-192.png',
  './assets/icon-512.png',
  './manifest.webmanifest',
  './service_worker.js',
];

const OPTIONAL_ASSETS = [
  // add CSS/JS/fonts/images you’d like pre-cached but not blocking install
];

/* Install: precache core and take over ASAP */
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    // ensure we fetch FRESH copies of core pages
    for (const url of CORE_ASSETS) {
      try {
        const req = new Request(url, { cache: 'reload' });
        const res = await fetch(req);
        if (res.ok) await cache.put(url, res.clone());
      } catch (e) {
        // fall back to whatever is already there if offline
      }
    }

    // optional assets: best-effort
    await Promise.all(OPTIONAL_ASSETS.map(async (u) => {
      try {
        const res = await fetch(new Request(u, { cache: 'no-cache' }));
        if (res.ok) {
          await cache.put(u, res.clone());
        }
      } catch {}
    }));
  })());
  self.skipWaiting(); // new SW ready immediately
});

/* Activate: remove old caches + control all clients */
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(k => k !== CACHE_NAME)
        .map(k => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

/* Fetch strategy:
   - HTML/doc pages: network-first (fresh) with cache fallback
   - Everything else: cache-first with network fallback
*/
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GET
  if (req.method !== 'GET') return;

  const accept = req.headers.get('accept') || '';
  const isHTML = accept.includes('text/html');

  if (isHTML) {
    // Network-first for pages
    event.respondWith((async () => {
      try {
        const fresh = await fetch(new Request(req.url, { cache: 'reload' }));
        const cache = await caches.open(CACHE_NAME);
        cache.put(req.url, fresh.clone());
        return fresh;
      } catch {
        const cached = await caches.match(req, { ignoreSearch: true });
        return cached || new Response('Offline', { status: 503 });
      }
    })());
    return;
  }

  // Cache-first for static assets (css/js/img)
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const res = await fetch(req);
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, res.clone());
      return res;
    } catch {
      return new Response('', { status: 504 });
    }
  })());
});
