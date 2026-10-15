/* Service Worker — يعمل فقط في نسخة الإنترنت (https). النسخة المحلية لا تحتاجه.
   يخزّن ملفات اللعبة ليفتحها الـ iPad لاحقًا حتى دون اتصال. غيّر VERSION عند كل تحديث. */
var VERSION = 'explorer-v1';
var FILES = ['./', './index.html', './style.css', './script.js', './data.js', './js/art.js', './js/map-data.js',
  './assets/fonts/fonts.css', './manifest.webmanifest', './assets/icons/icon-180.png', './assets/icons/icon-192.png', './assets/icons/icon-512.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
/* الشبكة أولًا (لتصل التحديثات فورًا)، ثم النسخة المخزنة عند انقطاع الاتصال */
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(function (r) {
    var copy = r.clone(); caches.open(VERSION).then(function (c) { c.put(e.request, copy); }); return r;
  }).catch(function () { return caches.match(e.request, { ignoreSearch: true }); }));
});
