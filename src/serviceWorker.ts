/// <reference lib="webworker" />

// Service Worker for Dithering App
// This provides offline capabilities and performance improvements

// Define custom types for service worker
declare const self: ServiceWorkerGlobalScope;
export type {};

// Cache name with versioning
const CACHE_NAME = 'dithering-app-cache-v1';

// Assets to cache immediately on installation
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/assets/dithering_wasm.wasm',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png'
];

// Cache strategies:
// 1. PRECACHE - Assets cached during installation, critical for app functionality
// 2. RUNTIME - Assets cached during use, with network priority (fallback to cache)

// Install event - precache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Precaching app assets');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        // Skip waiting to activate immediately
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
      })
      .then(cachesToDelete => {
        return Promise.all(
          cachesToDelete.map(cacheToDelete => {
            console.log('Removing old cache:', cacheToDelete);
            return caches.delete(cacheToDelete);
          })
        );
      })
      .then(() => {
        // Claim clients so the service worker is in control without reload
        return self.clients.claim();
      })
  );
});

// Fetch event - respond with cached resources when available
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip cross-origin requests
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // Handle different URL patterns with different strategies
  if (request.url.includes('/api/')) {
    // API requests - Network first, fallback to cache 
    event.respondWith(networkFirstStrategy(request));
  } else if (
    request.url.includes('.png') || 
    request.url.includes('.jpg') || 
    request.url.includes('.svg') ||
    request.url.includes('.wasm')
  ) {
    // Static assets - Cache first, fallback to network
    event.respondWith(cacheFirstStrategy(request));
  } else {
    // HTML and other resources - Stale-while-revalidate strategy
    event.respondWith(staleWhileRevalidateStrategy(request));
  }
});

// Network-first strategy for API requests
async function networkFirstStrategy(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache the response for future use
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // If network fails, fall back to cache
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If not in cache, throw network error
    throw new Error('No network connection and no cached response available');
  }
}

// Cache-first strategy for static assets
async function cacheFirstStrategy(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  if (cachedResponse) {
    // Return cached response immediately
    return cachedResponse;
  }
  
  // If not in cache, fetch from network and cache it
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    throw new Error('Resource not in cache and network is unavailable');
  }
}

// Stale-while-revalidate strategy for HTML and other resources
async function staleWhileRevalidateStrategy(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  // Clone the request as it can only be used once
  const fetchPromise = fetch(request)
    .then(async (networkResponse) => {
      if (networkResponse.ok) {
        // Update the cache with fresh content
        await cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(error => {
      console.error('Failed to fetch:', error);
      // If both cache and network fail, this will propagate the error
      if (!cachedResponse) {
        throw error;
      }
      // Return null instead of undefined to handle the void type issue
      return null;
    });
  
  // Return cached response immediately if available, otherwise wait for network
  return cachedResponse || (await fetchPromise as Response);
}

// Listen for message events (e.g., from the main app)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Sync event for background processing
self.addEventListener('sync', (event) => {
  // Use a double assertion for safety
  const syncEvent = event as unknown as { tag: string, waitUntil: (promise: Promise<any>) => void };
  
  if (syncEvent.tag === 'sync-saved-images') {
    syncEvent.waitUntil(syncSavedImages());
  }
});

// For TypeScript since SyncEvent is not a standard type
interface SyncEvent extends ExtendableEvent {
  tag: string;
}

// Function to sync saved images when online
async function syncSavedImages(): Promise<void> {
  // Here you would implement logic to sync any locally saved images 
  // to a backend service when the user comes back online
  console.log('Syncing saved images...');
} 