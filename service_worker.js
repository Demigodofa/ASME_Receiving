/* Why: bump forces browsers to fetch fresh files after deploy. */
const CACHE_VERSION = 'wh-v21';
const CACHE_NAME = `welders-helper-${CACHE_VERSION}`;

const CORE_ASSETS = [
  './',
  './index.html',
  './app.html',
  './jobs.html',
  './job.html',
  './receiving.html',
  './hydro.html',
  './lookup.html',
  './manifest.webmanifest'
];

const OPTIONAL_ASSETS = [
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-180.png',
  './assets/icons/icon-32.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const c = await caches.open(CACHE_NAME);
    await c.addAll(CORE_ASSETS);
    await Promise.all(OPTIONAL_ASSETS.map(async (u)=>{ try{ const r=await fetch(u,{cache:'no-cache'}); if(r.ok) await c.put(u,r.clone()); }catch{} }));
  })());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('welders-helper-') && k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const accept = req.headers.get('accept') || '';
  if (req.mode === 'navigate' || accept.includes('text/html')) {
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
    const c = await caches.open(CACHE_NAME);
    c.put(request, res.clone());
    return res;
  } catch { return cached || new Response('', { status: 504, statusText: 'Offline' }); }
}

async function networkThenCache(request) {
  try {
    const res = await fetch(request, { cache: 'no-store' });
    const c = await caches.open(CACHE_NAME);
    const p = new URL(request.url).pathname;
    if (p.endsWith('/index.html')) c.put('./index.html', res.clone());
    if (p.endsWith('/app.html')) c.put('./app.html', res.clone());
    if (p.endsWith('/jobs.html')) c.put('./jobs.html', res.clone());
    if (p.endsWith('/job.html')) c.put('./job.html', res.clone());
    if (p.endsWith('/receiving.html')) c.put('./receiving.html', res.clone());
    if (p.endsWith('/hydro.html')) c.put('./hydro.html', res.clone());
    if (p.endsWith('/lookup.html')) c.put('./lookup.html', res.clone());
    return res;
  } catch {
    const p = new URL(request.url).pathname;
    const fallback = p.endsWith('/app.html') ? './app.html'
                  : p.endsWith('/jobs.html') ? './jobs.html'
                  : p.endsWith('/job.html') ? './job.html'
                  : p.endsWith('/receiving.html') ? './receiving.html'
                  : p.endsWith('/hydro.html') ? './hydro.html'
                  : p.endsWith('/lookup.html') ? './lookup.html'
                  : './index.html';
    const cached = await caches.match(fallback);
    return cached || new Response('<h1>Offline</h1>', { headers: { 'Content-Type': 'text/html' } });
  }
}
