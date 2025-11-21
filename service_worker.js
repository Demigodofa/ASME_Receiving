
const CACHE_NAME = "asme-receiving-cache-v1";

const FILES_TO_CACHE = [
  "/",
  "/index.html",
  "/app.html",
  "/create_job.html",
  "/jobs.html",
  "/job.html",
  "/style.css",
  "/db.js",
  "/manifest.webmanifest",
  "/service_worker.js",
  "/assets/icons/icon-32.png",
  "/assets/icons/icon-192.png",
  "/assets/icons/icon-512.png"
];

// Install
self.addEventListener("install", (event) => {
  console.log("[SW] Install");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// Activate
self.addEventListener("activate", (event) => {
  console.log("[SW] Activate");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((resp) => {
      return (
        resp ||
        fetch(event.request).catch(() => {
          return caches.match("/index.html");
        })
      );
    })
  );
});
