const CACHE_NAME = 'temporary-v1-static';
const DYNAMIC_CACHE_NAME = 'temporary-v1-dynamic';

// Static assets to cache immediately
const STATIC_ASSETS = [
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

// URLs to NEVER cache
const BLACKLIST = [
    '/api/',
    '/auth/',
    '/admin/',
    '/socket.io/',
    '/dashboard',
    '/chat',
    '/payments',
    '/post-ad',
    '/login'
];

// Helper to check if URL is blacklisted
const isBlacklisted = (url) => {
    return BLACKLIST.some((path) => url.includes(path));
};

self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Caching static assets');
            // We try to cache static assets, but don't fail if some missing
            return cache.addAll(STATIC_ASSETS).catch(error => {
                console.warn('[Service Worker] failed to cache some static assets', error);
            });
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    // Clean up old caches that don't match current version
                    if (key !== CACHE_NAME && key !== DYNAMIC_CACHE_NAME) {
                        console.log('[Service Worker] Removing old cache', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') {
        return;
    }

    const url = event.request.url;

    if (isBlacklisted(url)) {
        // Strictly Network Only for Backlisted URLs
        return;
    }

    // Network First Strategy
    event.respondWith(
        fetch(event.request)
            .then((networkResponse) => {
                // Check if we should cache this response (dynamic caching for non-blacklisted items)
                const contentType = networkResponse.headers.get('content-type');
                const isStaticAsset = url.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2)$/i) ||
                    (contentType && (contentType.includes('image/') || contentType.includes('text/css') || contentType.includes('application/javascript')));

                if (networkResponse && networkResponse.status === 200 && isStaticAsset) {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }

                return networkResponse;
            })
            .catch(() => {
                // Network failed, try cache
                console.log('[Service Worker] Network failed, trying cache', url);
                return caches.match(event.request);
            })
    );
});
