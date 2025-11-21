// ================================
//   ASME Receiving PWA Service Worker
// ================================

const CACHE_NAME = "asme-receiving-v1";

const FILES_TO_CACHE = [
  "index.html",
  "app.html",
  "receiving.html",
  "jobs.html",
  "job.html",
  "lookup.html",
  "hydro.html",
  "style.css",
  "manifest.webmanifest",
  "icon-32.png",
  "icon-180.png",
  "icon-192.png",
  "icon-512.png"
];

// Install — Cache App Shell
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate — Clean Old Caches
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Handler — Network First, Cache Fallback
self.addEventListener("fetch", event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache new version of file
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, clone);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
