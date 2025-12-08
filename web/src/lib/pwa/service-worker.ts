/// <reference lib="webworker" />

/**
 * Service Worker for PWA
 * Handles offline caching and push notifications
 */

// Provide proper typings for the service worker global scope
declare const self: ServiceWorkerGlobalScope;

// SyncEvent is not available in some TS lib versions; define minimal shape
interface SyncEvent extends ExtendableEvent {
  tag: string;
}

export {};

const CACHE_NAME = 'safar-v1';
const STATIC_CACHE_NAME = 'safar-static-v1';
const DYNAMIC_CACHE_NAME = 'safar-dynamic-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/listings',
  '/discover',
  '/offline',
  '/logo.png',
];

// Install event - cache static assets
self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            return (
              name !== STATIC_CACHE_NAME &&
              name !== DYNAMIC_CACHE_NAME &&
              name !== CACHE_NAME
            );
          })
          .map((name) => caches.delete(name))
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API requests (they should always go to network)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Strategy: Cache First for static assets, Network First for pages
  event.respondWith(
    (async () => {
      // Return cached version if available
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }

      try {
        const response = await fetch(request);
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        // Cache dynamic content
        caches.open(DYNAMIC_CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      } catch {
        // If offline and page request, return offline page
        if (request.headers.get('accept')?.includes('text/html')) {
          const offlineResponse = await caches.match('/offline');
          return (
            offlineResponse ||
            new Response('', {
              status: 503,
              statusText: 'Offline',
            })
          );
        }

        return new Response('', {
          status: 503,
          statusText: 'Offline',
        });
      }
    })()
  );
});

// Push notification event
self.addEventListener('push', (event: PushEvent) => {
  const data = event.data?.json() || {};
  const title = data.title || 'Safar';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/logo.png',
    badge: '/logo.png',
    data: data.url || '/',
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const urlToOpen = event.notification.data || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList: readonly Client[]) => {
      // If a window is already open, focus it
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client && typeof (client as WindowClient).focus === 'function') {
          return (client as WindowClient).focus();
        }
      }
      // Otherwise, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background sync (for offline actions)
self.addEventListener('sync', (event) => {
  const syncEvent = event as SyncEvent;
  if (syncEvent.tag === 'sync-bookings') {
    syncEvent.waitUntil(
      // Sync bookings when online
      fetch('/api/sync/bookings')
        .then((response) => response.json())
        .catch((error) => {
          console.error('Sync failed:', error);
        })
    );
  }
});

