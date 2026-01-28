self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('trap-pwa-v1').then(cache => {
      return cache.addAll([
        '/',
        '/index.html',
        '/squad.html',
        '/squads.json',
        '/css/style.css',
        '/js/index.js',
        '/js/squad.js'
      ]);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
