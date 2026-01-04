// ============================================================================
//  MaterialGuardian - Caching Service Worker
// ============================================================================

const CACHE_NAME = "material-guardian-static-v1";

// These are the files that make up the "app shell"
const APP_SHELL_FILES = [
  "/",
  "/index.html",
  "/home.html",
  "/activate_cloud.html",
  "/create_job.html",
  "/jobs.html",
  "/job_detail.html",
  "/upload_queue.html",
  "/receiving.html", // Added this page
  "/manifest.webmanifest",
  "/style.css",
  "/activate_cloud.css",
  "/db.js",
  "/cloud_settings.js",
  "/photo_utils.js",
  "/upload_queue.js",
  "/upload_queue_page.js",
  "/cloud.js",
  "/activate_cloud.js",
  "/app.js",
  "/create_job.js",
  "/jobs_list.js",
  "/job_detail.js",
  "/assets/icons/Material_Guardian_180.png",
  "/assets/icons/Material_Guardian_192.png",
  "/assets/icons/Material_Guardian_512.png",
  "/assets/icons/icon-192.png" // For Welder's Helper splash
];

// Install: Cache all the app shell files
self.addEventListener("install", (event) => {
  console.log("[SW] Install");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL_FILES))
  );
  self.skipWaiting();
});

// Activate: Remove old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activate");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: Serve from cache first, with a network-first strategy for pages
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // For HTML pages, try the network first, fall back to cache.
  // This ensures users get updates if they are online.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match(req.url))
    );
    return;
  }

  // For all other static assets, use a cache-first strategy.
  event.respondWith(
    caches.match(req).then((cacheRes) => {
      return cacheRes || fetch(req);
    })
  );
});
