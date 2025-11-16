import { useEffect, useState } from 'react';
import { toast } from '@/components/ui/use-toast';

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Não Suportado",
        description: "Seu navegador não suporta notificações.",
        variant: "destructive"
      });
      return false;
    }

    if (Notification.permission === 'granted') {
      await setupNotifications();
      return true;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast({
          title: "Notifications Enabled! 🔔",
          description: "We'll remind you about baby's meals daily.",
        });
        
        await setupNotifications();
        return true;
      } else {
        toast({
          title: "Notifications Disabled",
          description: "You won't receive meal reminders.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const setupNotifications = async () => {
    try {
      // Register service worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        
        // Register background sync if supported
        if ('sync' in registration && 'SyncManager' in window) {
          try {
            await (registration as any).sync.register('check-inactivity');
          } catch (e) {
            console.log('Background sync not supported:', e);
          }
        }
      }
      
      // Save last visit timestamp
      await updateLastVisit();
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  };

  return { permission, requestPermission };
};

// Helper function to update last visit
export async function updateLastVisit() {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(['user-data'], 'readwrite');
    const store = tx.objectStore('user-data');
    store.put(Date.now(), 'last-visit');
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error('Error updating last visit:', error);
  }
}

// IndexedDB helper
async function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('babybites-db', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('user-data')) {
        db.createObjectStore('user-data');
      }
    };
  });
}
