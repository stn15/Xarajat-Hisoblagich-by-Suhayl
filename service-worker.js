const CACHE_NAME = 'xh-cache-v13';
const SHELL = ['./', 'index.html', 'style.css', 'app.js', 'logo.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'manifest.json'];

// Faqat shu tashqi kutubxonalar keshlanadi (offline uchun). Qolgan hamma tashqi so'rovlar
// (Firestore, Google kirish, kurslar) to'g'ridan-to'g'ri tarmoqqa ketadi — ularga tegmaymiz.
const CDN = [
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js'
];
const isCdnLib = url =>
  (url.hostname === 'cdn.jsdelivr.net' && url.pathname.startsWith('/npm/')) ||
  (url.hostname === 'www.gstatic.com' && url.pathname.startsWith('/firebasejs/'));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(async c => {
    await c.addAll(SHELL);
    // Kutubxonalar oldindan yuklanadi; biri yuklanmasa ham o'rnatish to'xtamaydi
    await Promise.all(CDN.map(u => fetch(new Request(u, { mode: 'no-cors' })).then(r => c.put(u, r)).catch(() => {})));
  }));
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

  // Tashqi kutubxonalar (Chart.js, Firebase SDK): keshdan, fonda yangilanadi
  if (isCdnLib(url)) {
    event.respondWith(
      caches.match(req, { ignoreVary: true }).then(cached => {
        const net = fetch(req).then(resp => {
          if (resp && (resp.ok || resp.type === 'opaque')) { const copy = resp.clone(); caches.open(CACHE_NAME).then(c => c.put(req, copy)); }
          return resp;
        }).catch(() => cached || Response.error());
        return cached || net;
      })
    );
  }
  // boshqa hamma narsa: brauzerning odatiy tarmoq so'rovi
});
