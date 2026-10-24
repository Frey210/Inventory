/* Only public installation assets are cached; sessions, HTML and stock never are. */
const CACHE = "mtc-public-v1";
const PUBLIC = ["/offline.html", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/maskable-512.png"];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PUBLIC)));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith("mtc-public-") && key !== CACHE).map((key) => caches.delete(key)))));
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (PUBLIC.includes(url.pathname) && !url.search) {
    event.respondWith(caches.open(CACHE).then(async (cache) => (await cache.match(request)) || fetch(request)));
  } else if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(async () => (await caches.match("/offline.html")) || Response.error()));
  }
});
