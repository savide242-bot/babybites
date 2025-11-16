// Custom Service Worker for BabyBites PWA Notifications

// Workbox will inject the precache manifest here
const manifest = self.__WB_MANIFEST;

const NOTIFICATION_TAG = 'babybites-daily';
const NOTIFICATION_TIMES = [
  { hour: 8, minute: 0, message: 'Good morning! Breakfast time 🍎', title: 'BabyBites Reminder' },
  { hour: 12, minute: 30, message: 'Lunch time for baby! 🥗', title: 'Meal Time!' },
  { hour: 18, minute: 0, message: 'Dinner time! 🍽️', title: 'Evening Meal' },
];

// Check for inactivity
self.addEventListener('sync', (event) => {
  if (event.tag === 'check-inactivity') {
    event.waitUntil(checkInactivity());
  }
});

async function checkInactivity() {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(['user-data'], 'readonly');
    const store = tx.objectStore('user-data');
    const request = store.get('last-visit');
    
    request.onsuccess = () => {
      const lastVisit = request.result;
      const now = Date.now();
      
      // If not logged in for 2+ days (172800000 ms)
      if (lastVisit && (now - lastVisit) > 172800000) {
        self.registration.showNotification('We Miss You! 💕', {
          body: 'Come check on your baby\'s nutrition progress!',
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: 'inactivity-reminder',
          data: { url: '/' },
          actions: [
            { action: 'open', title: 'Open App' },
            { action: 'dismiss', title: 'Later' }
          ]
        });
      }
    };
  } catch (error) {
    console.error('Error checking inactivity:', error);
  }
}

// Schedule daily notifications
self.addEventListener('activate', (event) => {
  event.waitUntil(scheduleDailyNotifications());
});

async function scheduleDailyNotifications() {
  try {
    const permission = await self.registration.pushManager.permissionState({ userVisibleOnly: true });
    
    if (permission !== 'granted') return;
    
    // Schedule next notifications
    NOTIFICATION_TIMES.forEach((time) => {
      const now = new Date();
      const scheduledTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        time.hour,
        time.minute,
        0
      );
      
      // If time already passed today, schedule for tomorrow
      if (scheduledTime < now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }
      
      const delay = scheduledTime.getTime() - now.getTime();
      
      setTimeout(() => {
        self.registration.showNotification(time.title, {
          body: time.message,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: NOTIFICATION_TAG,
          vibrate: [200, 100, 200],
          data: { url: '/' },
          actions: [
            { action: 'open', title: 'Open BabyBites' },
            { action: 'snooze', title: 'Remind me later' }
          ]
        });
        
        // Re-schedule for next day
        scheduleDailyNotifications();
      }, delay);
    });
  } catch (error) {
    console.error('Error scheduling notifications:', error);
  }
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

// IndexedDB helper
async function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('babybites-db', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('user-data')) {
        db.createObjectStore('user-data');
      }
    };
  });
}

// Precache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('babybites-v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json'
      ]);
    })
  );
});

// Fetch strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
