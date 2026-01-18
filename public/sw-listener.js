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

// Handle push notifications with enhanced iOS support and detailed logging
self.addEventListener('push', (event) => {
  const timestamp = new Date().toISOString();
  console.log(`📬 [SW-PUSH ${timestamp}] Push event received`);
  console.log('📬 [SW-PUSH] Event:', event);
  console.log('📬 [SW-PUSH] Has data:', !!event.data);
  
  let data = {
    title: 'BabyBites Notification',
    body: 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png'
  };

  try {
    if (event.data) {
      console.log('📬 [SW-PUSH] Data bytes:', event.data.arrayBuffer ? 'present' : 'missing');
      
      // Try to parse as JSON first
      try {
        const payload = event.data.json();
        data = { ...data, ...payload };
        console.log('📬 [SW-PUSH] Parsed JSON payload successfully');
        console.log('📬 [SW-PUSH] Title:', data.title);
        console.log('📬 [SW-PUSH] Body:', data.body);
      } catch (jsonError) {
        console.log('📬 [SW-PUSH] JSON parse failed, trying text...');
        // If JSON fails, try as text
        const text = event.data.text();
        console.log('📬 [SW-PUSH] Raw text:', text);
        
        // Try to parse the text as JSON
        try {
          const parsed = JSON.parse(text);
          data = { ...data, ...parsed };
          console.log('📬 [SW-PUSH] Parsed text as JSON successfully');
        } catch {
          console.log('📬 [SW-PUSH] Using text as body');
          data.body = text;
        }
      }
    } else {
      console.log('📬 [SW-PUSH] No data in push event');
    }
  } catch (e) {
    console.error('📬 [SW-PUSH] Error processing push data:', e);
  }

  // iOS-specific: Ensure we have valid notification data
  const options = {
    body: data.body || 'You have a new notification',
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/icon-192x192.png',
    tag: data.tag || `notification-${Date.now()}`,
    data: data.data || { url: '/' },
    requireInteraction: data.requireInteraction !== false, // Default true for iOS visibility
    silent: false,
    vibrate: [200, 100, 200],
    // iOS requires renotify for updates to same tag
    renotify: true,
  };

  // Add actions if provided
  if (data.actions && Array.isArray(data.actions)) {
    options.actions = data.actions;
  }

  console.log('📬 [SW-PUSH] Calling showNotification with:');
  console.log('📬 [SW-PUSH] - Title:', data.title);
  console.log('📬 [SW-PUSH] - Options:', JSON.stringify(options));

  event.waitUntil(
    self.registration.showNotification(data.title, options)
      .then(() => {
        console.log('📬 [SW-PUSH] ✅ showNotification succeeded!');
        // Try to notify clients that notification was shown
        self.clients.matchAll().then(clients => {
          console.log('📬 [SW-PUSH] Active clients:', clients.length);
          clients.forEach(client => {
            client.postMessage({ 
              type: 'PUSH_NOTIFICATION_SHOWN', 
              title: data.title,
              timestamp 
            });
          });
        });
      })
      .catch(err => {
        console.error('📬 [SW-PUSH] ❌ showNotification failed:', err);
        console.error('📬 [SW-PUSH] Error name:', err.name);
        console.error('📬 [SW-PUSH] Error message:', err.message);
      })
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

      // Try to find and focus an existing window
      for (const client of windowClients) {
        if ('focus' in client) {
          await client.focus();
          if (urlToOpen !== '/') {
            client.postMessage({ type: 'NAVIGATE', url: urlToOpen });
          }
          return;
        }
      }

      // No existing window, open a new one
      await self.clients.openWindow(urlToOpen);
    })()
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('SW: Notification closed:', event.notification.tag);
});

console.log('SW: Custom listener loaded v2.0 - iOS enhanced');
