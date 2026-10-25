// Push notification service worker listener for BabyBites PWA

// Handle skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Claim clients on activation
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Push notification handler with iOS & Android resilience
self.addEventListener('push', (event) => {
  let data = {
    title: 'BabyBites',
    body: 'You have a new update from BabyBites!',
    url: '/'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data.body = event.data.text() || data.body;
    }
  }

  const notificationTitle = data.title || 'BabyBites';
  const notificationOptions = {
    body: data.body || 'New notification',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag || `babybites-${Date.now()}`,
    renotify: true,
    data: {
      url: data.url || data.data?.url || '/'
    }
  };

  // Add vibration pattern if supported
  if ('vibrate' in navigator) {
    notificationOptions.vibrate = [200, 100, 200];
  }

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
      .catch((err) => {
        console.error('Error showing push notification:', err);
      })
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Focus already open window if available
        for (const client of windowClients) {
          if ('focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
