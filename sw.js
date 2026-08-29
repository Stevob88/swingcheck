// SwingCheck optional service worker — place next to swingcheck.html (or index.html) to make the page itself load offline.
// Model + library are cached by the page itself; this just caches the app shell.
const CACHE = 'swingcheck-shell-v1';
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll([self.registration.scope]).catch(() => {}))); });
self.addEventListener('activate', e => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate' || /\.html?$/.test(new URL(req.url).pathname)) {
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return r; }).catch(() => caches.match(req).then(m => m || caches.match(self.registration.scope))));
  }
});
