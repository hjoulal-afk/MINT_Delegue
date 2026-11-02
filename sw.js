// Service worker : met en cache UNIQUEMENT les fichiers de l'application.
// Aucune donnée Supabase (supabase.co) n'est jamais stockée par ce script.
const CACHE = 'registre-shell-v1';
const SHELL = ['./', './index.html', './manifest.json',
  './icons/icon-180.png', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)));
  self.skipWaiting();
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
  const url = new URL(req.url);
  // On ne touche à rien d'autre que les fichiers GET de notre propre site
  // (Supabase, CDN, etc. passent directement par le réseau, sans cache).
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // Réseau d'abord (toujours la dernière version), cache en secours hors ligne.
  e.respondWith(
    fetch(req)
      .then(res => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
