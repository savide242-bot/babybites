// Custom service worker listener for BabyBites PWA
// This file is imported by the main Workbox SW

// Handle skip waiting message - only when explicitly requested
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('SW: Received SKIP_WAITING, activating...');
    self.skipWaiting();
  }
});

// Claim clients on activation
self.addEventListener('activate', (event) => {
  console.log('SW: Activating and claiming clients');
  event.waitUntil(self.clients.claim());
});

// Enhanced fetch handler for offline support
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Parse URL safely
  let url;
  try {
    url = new URL(request.url);
  } catch (e) {
    return;
  }
  
  // Handle API and Supabase requests with offline fallback
  if (url.pathname.includes('/api/') || 
      url.hostname.includes('supabase') ||
      url.pathname.includes('/rest/') ||
      url.pathname.includes('/functions/')) {
    
    event.respondWith(
      fetch(request)
        .then(response => {
          // Clone and cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open('api-cache').then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          // Try to return cached response
          const cached = await caches.match(request);
          if (cached) {
            console.log('SW: Serving cached API response for:', url.pathname);
            return cached;
          }
          
          // Return offline JSON fallback
          console.log('SW: Returning offline fallback for:', url.pathname);
          return new Response(
            JSON.stringify({ 
              offline: true, 
              message: 'You are offline. Some features may be limited.',
              cached: false
            }),
            {
              status: 503,
              headers: { 
                'Content-Type': 'application/json',
                'X-Offline-Response': 'true'
              }
            }
          );
        })
    );
    return;
  }
  
  // For navigation and other requests, let Workbox handle with its caching strategies
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('SW: Push received:', event);
  
  let data = {
    title: 'BabyBites Notification',
    body: 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png'
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = { ...data, ...payload };
    }
  } catch (e) {
    console.error('SW: Error parsing push data:', e);
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/icon-192x192.png',
    data: data.data || {},
    requireInteraction: data.requireInteraction || false,
    silent: false,
    vibrate: [200, 100, 200],
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('SW: Notification clicked:', event);
  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data || {};

  event.waitUntil(
    (async () => {
      // Handle specific actions
      if (action === 'update') {
        // Trigger app update
        const windowClients = await self.clients.matchAll({ type: 'window' });
        windowClients.forEach(client => {
          client.postMessage({ type: 'APP_UPDATE_REQUESTED' });
        });
        
        // Open app
        if (windowClients.length > 0) {
          await windowClients[0].focus();
        } else {
          await self.clients.openWindow('/');
        }
        return;
      }

      if (action === 'later') {
        console.log('SW: User chose to update later');
        return;
      }

      if (action === 'view') {
        const url = notificationData.recipeUrl || '/recipes';
        const windowClients = await self.clients.matchAll({ type: 'window' });
        
        for (const client of windowClients) {
          if ('focus' in client) {
            await client.focus();
            client.postMessage({ type: 'NAVIGATE', url });
            return;
          }
        }
        await self.clients.openWindow(url);
        return;
      }

      // Default: Open the URL from notification data or home
      const urlToOpen = notificationData.url || '/';
      const windowClients = await self.clients.matchAll({ type: 'window' });

      for (const client of windowClients) {
        if ('focus' in client) {
          await client.focus();
          if (urlToOpen !== '/') {
            client.postMessage({ type: 'NAVIGATE', url: urlToOpen });
          }
          return;
        }
      }

      await self.clients.openWindow(urlToOpen);
    })()
  );
});

console.log('SW: Custom listener loaded');
