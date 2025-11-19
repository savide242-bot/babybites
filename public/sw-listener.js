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
