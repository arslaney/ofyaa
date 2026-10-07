// Güvendeyim service worker — kabuk dosyaları önbellekte, API her zaman ağdan.
const CACHE = 'gv-v3';
const SHELL = ['./', './index.html', './base.css', './lib.js', './manifest.webmanifest',
  './icons/icon-192.png', './icons/favicon-32.png', './panel/', './panel/index.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // ağ öncelikli: güncel sürüm gelsin, bağlantı yoksa önbellek
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
