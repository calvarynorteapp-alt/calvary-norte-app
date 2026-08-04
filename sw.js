// Service worker de Calvary Culiacán Norte
// Solo hace dos cosas: (1) permite que el navegador ofrezca "Instalar app",
// y (2) guarda una copia de la página para que abra aunque no haya internet.
// El contenido en vivo (horario, eventos, música, etc.) siempre se intenta
// traer fresco del Google Sheet primero; esto es solo un respaldo.

const CACHE_NAME = 'calvary-app-v1';
const SHELL_FILES = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(
        SHELL_FILES.map((url) => cache.add(url).catch(() => {}))
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Nunca cachear las llamadas al Apps Script (siempre queremos el dato más
  // reciente del Sheet); el respaldo offline de ESE contenido se maneja
  // dentro de la app con localStorage, no aquí.
  if (event.request.url.includes('script.google.com')) return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
