// Service worker PWA — fondation minimale (brief §6).
// Cache le shell applicatif pour l'installabilité. Volontairement simple :
// pas de stratégie de cache réseau avancée, pas de push notifications au
// MVP. Le point d'extension pour ajouter les push notifications plus tard
// est l'event listener `push` ci-dessous (actuellement absent, à ajouter
// avec ROADMAP.md Phase B/D sans réécrire le reste du service worker).

const CACHE_NAME = "footstats-shell-v1";
const SHELL_ASSETS = ["/", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached ?? fetch(event.request)),
  );
});

// Point d'extension futur :
// self.addEventListener("push", (event) => { ... });
