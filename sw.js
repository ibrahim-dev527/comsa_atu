/* COMSA service worker — offline shell + fast repeat visits.
   Supabase / cross-origin requests are never cached (always live data). */
const VERSION = 'comsa-v1';
const CORE = ['/offline.html', '/images/logo.jpg'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(CORE).catch(function () {}); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;           // Supabase, fonts, etc. go straight to network
  if (url.pathname === '/sw.js') return;
  if (req.mode === 'navigate') {                              // pages: network first, cached copy if offline
    e.respondWith(fetch(req).then(function (res) {
      var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); });
      return res;
    }).catch(function () {
      return caches.match(req).then(function (r) { return r || caches.match('/offline.html'); });
    }));
    return;
  }
  if (/\.(?:png|jpe?g|webp|gif|svg|ico|css|js|woff2?|webmanifest)$/i.test(url.pathname)) {   // assets: cache first, refresh in background
    e.respondWith(caches.match(req).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && res.ok) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); }
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    }));
  }
});
