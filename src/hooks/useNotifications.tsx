import { useEffect, useState, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface ScheduledMealNotification {
  meal_type: string;
  hour: number;
  minute: number;
  title: string;
  body: string;
}

const DEFAULT_SCHEDULE: ScheduledMealNotification[] = [
  { meal_type: 'breakfast', hour: 8, minute: 0, title: '🍎 Breakfast Time!', body: "Start your baby's day with a wholesome and nutritious breakfast." },
  { meal_type: 'lunch', hour: 12, minute: 0, title: '🥦 Lunch Time!', body: "Time for a delicious, healthy lunch meal for your little one." },
  { meal_type: 'snack', hour: 15, minute: 30, title: '🥑 Afternoon Snack!', body: "A light, healthy snack keeps energy steady and introduces variety." },
  { meal_type: 'dinner', hour: 18, minute: 30, title: '🥣 Dinner Time!', body: "Finish the day with a gentle, soothing dinner." },
];

export const showSystemNotification = async (title: string, options: NotificationOptions = {}) => {
  const defaultOptions: NotificationOptions = {
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200] as any,
    ...options,
  };

  if ('serviceWorker' in navigator) {
    try {
      const reg = await navigator.serviceWorker.ready;
      if (reg && reg.showNotification) {
        await reg.showNotification(title, defaultOptions);
        return true;
      }
    } catch (e) {
      console.warn('Service worker notification fallback:', e);
    }
  }

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, defaultOptions);
      return true;
    } catch (e) {
      console.warn('Standard Notification constructor error:', e);
    }
  }

  return false;
};

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const triggerTestNotification = useCallback(async () => {
    if (!('Notification' in window)) {
      toast({
        title: "Notifications Not Supported",
        description: "Your browser does not support Web Notifications.",
        variant: "destructive"
      });
      return false;
    }

    let currentPerm = Notification.permission;
    if (currentPerm !== 'granted') {
      try {
        currentPerm = await Notification.requestPermission();
        setPermission(currentPerm);
      } catch (err) {
        console.warn('Permission request error:', err);
      }
    }

    if (currentPerm !== 'granted') {
      toast({
        title: "Permission Required",
        description: "Please allow notifications in your browser or device settings.",
        variant: "destructive"
      });
      return false;
    }

    const success = await showSystemNotification('🥑 BabyBites • Test Notification', {
      body: "Notifications are working perfectly on your device! You'll receive your scheduled meal reminders.",
      tag: 'babybites-test-' + Date.now(),
    });

    if (success) {
      toast({
        title: "✅ Notification Delivered!",
        description: "Check your screen or status bar for the notification.",
      });
    }

    return success;
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
      await triggerTestNotification();
      return true;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast({
          title: "Notifications Enabled! 🔔",
          description: "You will receive meal reminders throughout the day.",
        });
        
        await triggerTestNotification();
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

  // Local recurring scheduler for active sessions
  useEffect(() => {
    if (permission !== 'granted') return;

    let notifiedMeals: Record<string, string> = {}; // mealKey: dateString

    const checkMealTimes = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const todayStr = now.toISOString().slice(0, 10);

      DEFAULT_SCHEDULE.forEach((meal) => {
        const mealKey = `${meal.meal_type}-${todayStr}`;
        if (notifiedMeals[mealKey]) return;

        // Trigger if within matching hour and minute
        if (currentHour === meal.hour && currentMinute === meal.minute) {
          notifiedMeals[mealKey] = todayStr;
          showSystemNotification(meal.title, {
            body: meal.body,
            tag: `babybites-meal-${meal.meal_type}`,
            data: { url: '/meal-planner' },
          });
        }
      });
    };

    // Check immediately and every 30 seconds
    checkMealTimes();
    const interval = setInterval(checkMealTimes, 30000);
    return () => clearInterval(interval);
  }, [permission]);

  return { permission, requestPermission, triggerTestNotification };
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
