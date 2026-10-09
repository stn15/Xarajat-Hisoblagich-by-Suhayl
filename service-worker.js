const CACHE_NAME = 'xh-cache-v5';
const SHELL = ['./', 'index.html', 'style.css', 'app.js', 'logo.png', 'icon-192.png', 'icon-512.png', 'manifest.json'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'open.er-api.com') return; // kurslar keshlanmaydi

  // Ilova fayllari: avval tarmoq (yangilanish tez yetadi), oflaynda keshdan
  if (url.origin === location.origin) {
    event.respondWith(
      fetch(req).then(resp => {
        if (resp.ok) { const copy = resp.clone(); caches.open(CACHE_NAME).then(c => c.put(req, copy)); }
        return resp;
      }).catch(() => caches.match(req).then(r => r || caches.match('index.html')))
    );
    return;
  }

  // Tashqi kutubxonalar (Chart.js): keshdan, fonda yangilanadi
  event.respondWith(
    caches.match(req).then(cached => {
      const net = fetch(req).then(resp => {
        const copy = resp.clone(); caches.open(CACHE_NAME).then(c => c.put(req, copy)); return resp;
      }).catch(() => cached);
      return cached || net;
    })
  );
});
