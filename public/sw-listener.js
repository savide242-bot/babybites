// Custom Service Worker listener for SKIP_WAITING messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('📨 Received SKIP_WAITING message');
    self.skipWaiting();
  }
});

// Take control immediately on activation
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activated');
  event.waitUntil(self.clients.claim());
});

// Push event - receive push notifications from server
self.addEventListener('push', (event) => {
  console.log('📬 Push notification received:', event);
  
  let notificationData = {
    title: 'BabyBites',
    body: 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag || 'babybites-notification',
        data: data.url ? { url: data.url } : undefined
      };
    } catch (error) {
      console.error('Error parsing push data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click event - handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.notification);
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUninitialized: true })
      .then((clientList) => {
        // If there's already a window open, focus it
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise, open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
