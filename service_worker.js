// ============================================================================
//  ASME Receiving - Safe Auto-Updating Service Worker
//  Prevents freeze on splash screen & avoids hard-cached HTML
// ============================================================================

const STATIC_CACHE = "asme-static-v5";

// Only cache truly static files (icons, CSS, scripts)
const STATIC_FILES = [
  "/style.css",
  "/db.js",
  "/cloud_settings.js",
  "/photo_utils.js",
  "/upload_queue.js",
  "/upload_queue_page.js",
  "/cloud.js",
  "/app.js",
  "/assets/icons/icon-32.png",
  "/assets/icons/icon-192.png",
  "/assets/icons/icon-512.png"
];

// ----------------------------------------------------------------------------
// INSTALL — Precache static assets only
// ----------------------------------------------------------------------------
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_FILES))
  );
  self.skipWaiting();
});

// ----------------------------------------------------------------------------
// ACTIVATE — Remove old caches
// ----------------------------------------------------------------------------
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ----------------------------------------------------------------------------
// FETCH — Network-first for HTML, Cache-first for static assets
// ----------------------------------------------------------------------------
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // HTML files must never be served from cache
  if (req.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(req).catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Static files: cache first
  event.respondWith(
    caches.match(req).then((cacheRes) => {
      return (
        cacheRes ||
        fetch(req).then((networkRes) => {
          return caches.open(STATIC_CACHE).then((cache) => {
            cache.put(req, networkRes.clone());
            return networkRes;
          });
        })
      );
    })
  );
});
