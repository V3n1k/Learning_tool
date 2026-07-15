/* Сервис-воркер: кэширует все файлы приложения, чтобы оно открывалось без интернета.
 * Работает, когда сайт открыт по http(s) — например через `python -m http.server`
 * или GitHub Pages. При открытии index.html напрямую (file://) он не нужен —
 * файлы и так локальные. */

const CACHE = "learning-tool-v5";

const ASSETS = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./js/vendor/prism/prism-core.js",
  "./js/vendor/prism/prism-clike.js",
  "./js/vendor/prism/prism-python.js",
  "./js/vendor/prism/prism-go.js",
  "./js/vendor/prism/prism-bash.js",
  "./js/vendor/prism/prism-markup.js",
  "./js/vendor/prism/prism-tomorrow.css",
  "./content/manifest.js",
  "./content/golang.js",
  "./content/ege-informatika.js",
  "./content/ege-math.js",
  "./content/ege-russian.js",
  "./content/english.js",
  "./content/cs.js",
  "./manifest.webmanifest"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// сеть в приоритете (чтобы подтягивались обновления), кэш — запасной вариант для оффлайна
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then(resp => {
        const copy = resp.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});
