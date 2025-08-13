const CACHE_NAME = 'ar-pwa-v1.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/styles.css',
    '/js/app.js',
    '/js/ar-marker.js',
    '/js/ar-markerless.js',
    '/js/ar-location.js',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    // CDN resources (cached when accessed)
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
    'https://cdn.jsdelivr.net/gh/AR-js-org/AR.js@3.4.5/aframe/build/aframe-ar.js',
    'https://cdn.jsdelivr.net/gh/AR-js-org/AR.js@3.4.5/three.js/build/ar-threex.js'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    console.log('[SW] Install event');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching app shell');
                return cache.addAll(urlsToCache.map(url => {
                    return new Request(url, { mode: 'no-cors' });
                }));
            })
            .catch((error) => {
                console.error('[SW] Cache addAll error:', error);
            })
    );
    
    // Force the waiting service worker to become the active service worker
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activate event');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    
    // Immediately take control of all clients
    self.clients.claim();
    
    // Notify clients that update is available
    self.clients.matchAll().then(clients => {
        clients.forEach(client => {
            client.postMessage({
                type: 'UPDATE_AVAILABLE',
                payload: {
                    version: CACHE_NAME
                }
            });
        });
    });
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin) && 
        !event.request.url.startsWith('https://cdnjs.cloudflare.com') &&
        !event.request.url.startsWith('https://cdn.jsdelivr.net')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version if available
                if (response) {
                    console.log('[SW] Serving from cache:', event.request.url);
                    return response;
                }
                
                // Otherwise fetch from network
                console.log('[SW] Fetching from network:', event.request.url);
                return fetch(event.request)
                    .then((response) => {
                        // Don't cache if not a valid response
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        // Clone the response
                        const responseToCache = response.clone();
                        
                        // Cache the fetched resource
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return response;
                    })
                    .catch((error) => {
                        console.error('[SW] Fetch failed:', error);
                        
                        // Return offline page for navigation requests
                        if (event.request.destination === 'document') {
                            return caches.match('/index.html');
                        }
                        
                        // Return empty response for other requests
                        return new Response('', { status: 408 });
                    });
            })
    );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);
    
    if (event.tag === 'background-sync') {
        event.waitUntil(doBackgroundSync());
    }
});

function doBackgroundSync() {
    // Implementar lógica de sincronización en background
    console.log('[SW] Performing background sync');
    
    return new Promise((resolve) => {
        // Aquí puedes agregar lógica para sincronizar datos
        // Por ejemplo, enviar datos guardados mientras la app estaba offline
        setTimeout(() => {
            console.log('[SW] Background sync completed');
            resolve();
        }, 1000);
    });
}

// Push notifications
self.addEventListener('push', (event) => {
    console.log('[SW] Push received:', event);
    
    const options = {
        body: event.data ? event.data.text() : 'Nueva actualización disponible',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '2'
        },
        actions: [
            {
                action: 'explore',
                title: 'Ver más',
                icon: '/icons/checkmark.png'
            },
            {
                action: 'close',
                title: 'Cerrar',
                icon: '/icons/xmark.png'
            },
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('AR PWA', options)
    );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification click received:', event);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        // Open app
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Message handling
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
});

// Error handling
self.addEventListener('error', (event) => {
    console.error('[SW] Error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('[SW] Unhandled rejection:', event.reason);
    event.preventDefault();
});

// Periodic background sync (if supported)
if ('serviceWorker' in navigator && 'periodicSync' in window.ServiceWorkerRegistration.prototype) {
    self.addEventListener('periodicsync', (event) => {
        console.log('[SW] Periodic sync:', event.tag);
        
        if (event.tag === 'content-sync') {
            event.waitUntil(
                // Sync content periodically
                syncContent()
            );
        }
    });
}

function syncContent() {
    return new Promise((resolve) => {
        console.log('[SW] Syncing content...');
        
        // Implementar lógica de sincronización periódica
        // Por ejemplo, actualizar contenido AR, marcadores, etc.
        
        setTimeout(() => {
            console.log('[SW] Content sync completed');
            resolve();
        }, 2000);
    });
}

// Cache strategies for different resource types
function getCacheStrategy(request) {
    const url = new URL(request.url);
    
    // API calls - Network first, then cache
    if (url.pathname.startsWith('/api/')) {
        return 'networkFirst';
    }
    
    // Images and media - Cache first
    if (request.destination === 'image' || request.destination === 'video') {
        return 'cacheFirst';
    }
    
    // CSS and JS - Stale while revalidate
    if (request.destination === 'style' || request.destination === 'script') {
        return 'staleWhileRevalidate';
    }
    
    // Default - Cache first
    return 'cacheFirst';
}

// Enhanced fetch handler with different strategies
function handleFetchWithStrategy(event) {
    const strategy = getCacheStrategy(event.request);
    
    switch (strategy) {
        case 'networkFirst':
            return networkFirst(event.request);
        case 'cacheFirst':
            return cacheFirst(event.request);
        case 'staleWhileRevalidate':
            return staleWhileRevalidate(event.request);
        default:
            return cacheFirst(event.request);
    }
}

function networkFirst(request) {
    return fetch(request)
        .then(response => {
            if (response.ok) {
                const responseClone = response.clone();
                caches.open(CACHE_NAME)
                    .then(cache => cache.put(request, responseClone));
            }
            return response;
        })
        .catch(() => {
            return caches.match(request);
        });
}

function cacheFirst(request) {
    return caches.match(request)
        .then(response => {
            return response || fetch(request)
                .then(fetchResponse => {
                    if (fetchResponse.ok) {
                        const responseClone = fetchResponse.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => cache.put(request, responseClone));
                    }
                    return fetchResponse;
                });
        });
}

function staleWhileRevalidate(request) {
    return caches.match(request)
        .then(cachedResponse => {
            const fetchPromise = fetch(request)
                .then(fetchResponse => {
                    if (fetchResponse.ok) {
                        const responseClone = fetchResponse.clone();
                        caches.open(CACHE_NAME)
                            .then(cache => cache.put(request, responseClone));
                    }
                    return fetchResponse;
                });
            
            return cachedResponse || fetchPromise;
        });
}
