// Self-destruct service worker — clears all caches and unregisters itself.
// This replaces the old VitePWA-generated sw.js so browsers that
// still have the old service worker will pick up this update,
// wipe cached assets, and stop intercepting requests.
self.addEventListener('install', function () {
    self.skipWaiting();
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.map(function (name) {
                    return caches.delete(name);
                })
            );
        }).then(function () {
            return self.clients.claim();
        }).then(function () {
            return self.registration.unregister();
        })
    );
});
