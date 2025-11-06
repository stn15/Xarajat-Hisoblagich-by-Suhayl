const CACHE_NAME = 'xh-cache-v1';
const PRECACHE_URLS = [
  'index.html',
  'style.css',
  'app.js',
  'logo.png',
  'manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => { if (k !== CACHE_NAME) return caches.delete(k); }))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  // simple network-first for API; cache-first for app shell
  if (PRECACHE_URLS.some(p => req.url.endsWith(p))) {
    event.respondWith(caches.match(req).then(r => r || fetch(req)));
    return;
  }
  event.respondWith(fetch(req).then(resp => { if (req.method === 'GET') { caches.open(CACHE_NAME).then(cache => cache.put(req, resp.clone())); } return resp; }).catch(()=>caches.match(req)));
});