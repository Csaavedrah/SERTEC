/**
 * Service Worker — SHELL estático de SERTEC · Portal Técnico (GitHub Pages / Firebase Hosting)
 * ------------------------------------------------------------------------------------------------
 * Este SW cachea SOLO el shell (index.html, manifest.json, íconos): lo mínimo para que la app
 * abra y muestre la pantalla de "Cargando…" aunque no haya señal. El contenido real (Mi Turno,
 * OTs, etc.) vive DENTRO del iframe, que carga desde script.google.com — un origen distinto,
 * que este Service Worker no puede ni debe interceptar. La resiliencia offline de las acciones
 * del técnico la maneja la cola en localStorage dentro de portaltecnicos.html.
 */

var CACHE_NAME = "sertec-shell-v1";
var SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function (cache) { return cache.addAll(SHELL); })
      .catch(function (e) { console.warn("SW: no se pudo precachear todo el shell", e); })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE_NAME; })
            .map(function (k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  var req = event.request;
  // Solo mismo origen (el shell). El iframe hacia script.google.com queda totalmente fuera.
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then(function (cached) {
      var redFetch = fetch(req).then(function (res) {
        if (res && res.status === 200) {
          var copia = res.clone();
          caches.open(CACHE_NAME).then(function (cache) { cache.put(req, copia); });
        }
        return res;
      }).catch(function () { return cached; });
      return cached || redFetch;
    })
  );
});
