const CACHE_NAME = 'xh-cache-v1';
const PRECACHE_URLS = [
  'index.html',
  'style.css',
  'app.js',
  'logo.png',
  'manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Cache-first for app shell, network-first for other requests (like API)
  const url = new URL(event.request.url);
  if (PRECACHE_URLS.includes(url.pathname.replace(/^\//, ''))) {
    event.respondWith(
      caches.match(event.request).then(response => response || fetch(event.request))
    );
    return;
  }

  // Fallback network-first, then cache
  event.respondWith(
    fetch(event.request).then(resp => {
      // optionally cache GET responses
      if (event.request.method === 'GET') {
        const respClone = resp.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, respClone));
      }
      return resp;
    }).catch(() => caches.match(event.request))
  );
});