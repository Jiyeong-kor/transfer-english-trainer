const CACHE = "transfer-english-trainer-v15";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./practice.css",
  "./ux-fixes.css",
  "./app.js",
  "./app-enhancements.js",
  "./exam-mode.js",
  "./grammar-exam.js",
  "./vocab-exam.js",
  "./app-update.js",
  "./new-problems.js",
  "./question-stability.js",
  "./grammar-hierarchy.js",
  "./all-study.js",
  "./content/vocabulary.js",
  "./content/vocabulary-02.js",
  "./content/vocabulary-hackers-750-day01.js",
  "./content/vocabulary-hackers-750-day02.js",
  "./content/vocabulary-hackers-750-day03-05.js",
  "./content/vocabulary-hackers-750-day06-08.js",
  "./content/vocabulary-hackers-750-day09-11.js",
  "./content/vocabulary-hackers-750-day12-15.js",
  "./content/grammar-v2.js",
  "./manifest.webmanifest",
  "./icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match("./index.html"))
      )
  );
});
