// sw.js — service worker. Makes REWIRE installable and fully usable offline.
// CACHE is stamped with the commit SHA at deploy time by .github/workflows/deploy.yml,
// so every push automatically invalidates old caches. Locally it stays the literal
// placeholder (a valid, stable cache name) — no manual bumping needed.

const CACHE = 'rewire-__CACHE_VERSION__';

// App shell: everything needed to boot with no network.
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './css/animations.css',
  './js/app.js',
  './js/state.js',
  './js/components.js',
  './js/ui.js',
  './js/utils.js',
  './js/pwa.js',
  './js/fx.js',
  './js/copy.js',
  './js/achievements.js',
  './js/focus-areas.js',
  './js/ai.js',
  './js/views/onboarding.js',
  './js/views/today.js',
  './js/views/reps.js',
  './js/views/log.js',
  './js/views/focus.js',
  './js/views/forge.js',
  './js/views/identity.js',
  './js/views/ranks.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-180.png',
  './icons/favicon-32.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Navigations: serve the cached shell so the app opens offline.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Google Fonts: stale-while-revalidate (works offline after first load).
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    e.respondWith(staleWhileRevalidate(req));
    return;
  }

  // Same-origin assets: cache-first, fall back to network then cache it.
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => hit))
    );
  }
});

function staleWhileRevalidate(req) {
  return caches.open(CACHE).then(cache =>
    cache.match(req).then(hit => {
      const net = fetch(req).then(res => { cache.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    })
  );
}
