// Version of the service worker
// Providing this makes sure that any version change even if only in external files triggers a new Service Worker
// install event which in turn forces an automatic cache update
const VERSION = "v1.1.4"

// Name of the cache
const CACHE_NAME = `${VERSION}-cache`

// Files to precache
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/keys.css',
    '/stopwatch.css',
    '/styles.css',
    '/script.js',
    '/stopwatch.js',
    '/manifest.json',
    '/favicons/favicon_64.png',
    '/favicons/favicon_128.png',
    '/favicons/favicon_192.png',
    '/favicons/favicon_256.png',
    '/favicons/favicon_512.png',
    '/favicons/favicon.ico',
    '/favicons/favicon.svg',
]

// Install event - Cache files
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.debug('Opened cache')
                return cache.addAll(PRECACHE_URLS)
            })
    )
})

// Activate event - Cleanup old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.debug('Deleting old cache:', cache)
                        return caches.delete(cache)
                    }
                })
            )
        })
    )
})

// Fetch event - Serve cached files or fetch from network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Serve cached file if available
                if (response) {
                    return response
                }
                // Fetch from network otherwise
                return fetch(event.request).then((networkResponse) => {
                    // Optionally cache the new response
                    return caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, networkResponse.clone())
                        return networkResponse
                    })
                })
            }).catch(() => {
                // Fallback for offline mode
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html')
                }
            })
    )
})
