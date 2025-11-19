import { useEffect } from 'react';

interface MealReminder {
  id: string;
  hour: number;
  minute: number;
  title: string;
  body: string;
  emoji: string;
}

const MEAL_REMINDERS: MealReminder[] = [
  {
    id: 'breakfast',
    hour: 7,
    minute: 30,
    title: 'Good Morning! Breakfast Time',
    body: "Start baby's day with a nutritious breakfast! 🍳",
    emoji: '🍳'
  },
  {
    id: 'morning-snack',
    hour: 10,
    minute: 0,
    title: 'Morning Snack Time',
    body: 'A healthy snack keeps baby energized! 🍎',
    emoji: '🍎'
  },
  {
    id: 'lunch',
    hour: 12,
    minute: 30,
    title: 'Lunch Time!',
    body: 'Time for a delicious and balanced lunch! 🥗',
    emoji: '🥗'
  },
  {
    id: 'afternoon-snack',
    hour: 15,
    minute: 30,
    title: 'Afternoon Snack',
    body: 'Keep baby happy with a tasty snack! 🍌',
    emoji: '🍌'
  },
  {
    id: 'dinner',
    hour: 18,
    minute: 0,
    title: 'Dinner Time!',
    body: 'End the day with a wholesome dinner! 🍽️',
    emoji: '🍽️'
  }
];

export const useMealReminders = () => {
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      // Start reminder system
      scheduleMealReminders();
    }
  }, []);

  const scheduleMealReminders = () => {
    MEAL_REMINDERS.forEach(reminder => {
      scheduleNextReminder(reminder);
    });
  };

  const scheduleNextReminder = (reminder: MealReminder) => {
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(reminder.hour, reminder.minute, 0, 0);

    // If time already passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const delay = scheduledTime.getTime() - now.getTime();

    // Schedule notification
    setTimeout(() => {
      sendMealNotification(reminder);
      // Re-schedule for next day
      scheduleNextReminder(reminder);
    }, delay);

    // BACKUP: Save to IndexedDB to recover after reload
    saveMealReminderToStorage(reminder, scheduledTime);
  };

  const sendMealNotification = (reminder: MealReminder) => {
    if (Notification.permission === 'granted') {
      const notification = new Notification(`${reminder.emoji} ${reminder.title}`, {
        body: reminder.body,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: `meal-reminder-${reminder.id}`,
        requireInteraction: false
      });

      // Auto-close after 10 seconds
      setTimeout(() => notification.close(), 10000);
    }
  };

  const saveMealReminderToStorage = async (reminder: MealReminder, scheduledTime: Date) => {
    try {
      const db = await openIndexedDB();
      const tx = db.transaction(['reminders'], 'readwrite');
      const store = tx.objectStore('reminders');
      
      store.put({
        id: reminder.id,
        scheduledTime: scheduledTime.getTime(),
        ...reminder
      });
    } catch (error) {
      console.error('Error saving reminder:', error);
    }
  };

  return { scheduleMealReminders };
};

// IndexedDB helper
async function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('babybites-db', 2);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains('user-data')) {
        db.createObjectStore('user-data');
      }
      
      if (!db.objectStoreNames.contains('reminders')) {
        db.createObjectStore('reminders', { keyPath: 'id' });
      }
    };
  });
}
