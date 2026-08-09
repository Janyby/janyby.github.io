// Service Worker: оффлайн-режим (network-first с fallback на кэш).
// v2: не кэшируем ответы с ошибками; при сбое сети для навигации отдаём сохранённую главную.
const CACHE = 'vbt-kpi-v2';

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE).then((cache) => cache.addAll(['./', './manifest.webmanifest']))
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) =>
                Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
            )
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response.ok) {
                    const copy = response.clone();
                    caches.open(CACHE)
                        .then((cache) => cache.put(event.request, copy))
                        .catch(() => {});
                }
                return response;
            })
            .catch(() =>
                caches.match(event.request).then((cached) => {
                    if (cached) return cached;
                    if (event.request.mode === 'navigate') {
                        return caches.match('./');
                    }
                    return Response.error();
                })
            )
    );
});
