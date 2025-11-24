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

  // Handle update notification actions
  if (event.action === 'update' || event.notification.data?.action === 'update') {
    console.log('🔄 User clicked Update Now');
    event.waitUntil(
      self.skipWaiting().then(() => {
        return clients.matchAll({ type: 'window' }).then((clientList) => {
          // Reload all open clients
          clientList.forEach(client => {
            client.postMessage({ type: 'RELOAD' });
          });
        });
      })
    );
    return;
  }

  // If user clicked "Later" on update notification
  if (event.action === 'later') {
    console.log('⏰ User postponed update');
    return;
  }

  // If user clicked "View Recipes" on meal reminder
  if (event.action === 'view') {
    const urlToOpen = '/recipes';
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUninitialized: true })
        .then((clientList) => {
          for (const client of clientList) {
            if ('focus' in client) {
              client.navigate(urlToOpen);
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow(urlToOpen);
          }
        })
    );
    return;
  }

  // Default behavior - open URL from notification data
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUninitialized: true })
      .then((clientList) => {
        // If a window is already open, focus it
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
