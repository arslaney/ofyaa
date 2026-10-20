'use strict';
// Cache only the public application shell. Never cache private API data or writes.
const CACHE_PREFIX = 'ofyaa-studio-shell-';
const CACHE_NAME = CACHE_PREFIX + 'v3';
const SHELL = ['/studio/', '/studio/index.html', '/studio/styles.css', '/studio/app.js', '/studio/pwa.js', '/studio/auth.js', '/studio/auth.css', '/studio/vendor-supabase-2.118.0.js', '/studio/manifest.webmanifest', '/studio/icons/studio-192.png', '/studio/icons/studio-512.png'];
self.addEventListener('install', event => {
 event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL)));
});
self.addEventListener('activate', event => {
 event.waitUntil((async () => {
  const names = await caches.keys();
  await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map(name => caches.delete(name)));
  await self.clients.claim();
 })());
});
self.addEventListener('fetch', event => {
 const request = event.request;
 const url = new URL(request.url);
 if (request.method !== 'GET' || url.origin !== self.location.origin || url.search || !SHELL.includes(url.pathname)) return;
 // No API endpoint, uploaded media, notes, analytics or task responses enter CacheStorage.
 event.respondWith((async () => {
  const cache = await caches.open(CACHE_NAME);
  try {
   const response = await fetch(request);
   if (response.ok) await cache.put(request, response.clone());
   return response;
  } catch {
   const cached = await cache.match(request);
   if (cached) return cached;
   return new Response('Uygulama kabuğu bulunamadı. İnternet bağlantınızı kontrol edip yeniden deneyin.', {status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});
  }
 })());
});
