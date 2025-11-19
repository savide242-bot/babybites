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
        title: "Not Supported",
        description: "Your browser doesn't support notifications.",
        variant: "destructive"
      });
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast({
          title: "Notifications Enabled! 🔔",
          description: "You'll receive meal reminders throughout the day.",
        });
        
        // Send immediate test notification
        new Notification('🎉 Notifications Activated!', {
          body: 'You will now receive meal time reminders for your baby. Stay on track! 🍎',
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png'
        });
        
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
      // Save last visit timestamp
      await updateLastVisit();
      
      // Schedule daily meal reminders
      scheduleDailyReminders();
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  };

  const scheduleDailyReminders = () => {
    const scheduleNotification = (hour: number, minute: number, title: string, message: string) => {
      const now = new Date();
      const scheduledTime = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        hour,
        minute,
        0
      );
      
      // If time already passed today, schedule for tomorrow
      if (scheduledTime < now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }
      
      const delay = scheduledTime.getTime() - now.getTime();
      
      setTimeout(() => {
        if (Notification.permission === 'granted') {
          new Notification(title, {
            body: message,
            icon: '/icon-192x192.png',
            tag: 'babybites-meal-reminder'
          });
        }
        // Re-schedule for next day
        scheduleDailyReminders();
      }, delay);
    };

    // Schedule meal reminders
    scheduleNotification(8, 0, 'BabyBites Reminder', 'Good morning! Breakfast time 🍎');
    scheduleNotification(12, 30, 'Meal Time!', 'Lunch time for baby! 🥗');
    scheduleNotification(18, 0, 'Evening Meal', 'Dinner time! 🍽️');
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
