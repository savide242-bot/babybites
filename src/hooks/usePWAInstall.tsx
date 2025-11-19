import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWAInstall = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detect if already installed
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                          (window.navigator as any).standalone ||
                          document.referrer.includes('android-app://');
      setIsInstalled(isStandalone);
      return isStandalone;
    };

    // Check on mount
    const installed = checkIfInstalled();
    
    // If already installed, send welcome back notification
    if (installed) {
      handleWelcomeBackNotification();
    }

    // Capture BEFORE install event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    // Capture AFTER install event
    const handleAppInstalled = async () => {
      console.log('PWA was installed!');
      setIsInstalled(true);
      setInstallPrompt(null);
      
      // Send welcome notification
      await sendWelcomeNotification();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const sendWelcomeNotification = async () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      // Get mother's name from profile
      const { data: { user } } = await supabase.auth.getUser();
      let motherName = 'Mom';
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('mother_name')
          .eq('id', user.id)
          .single();
        
        if (profile?.mother_name) {
          motherName = profile.mother_name;
        }
      }

      new Notification('🎉 Welcome to BabyBites!', {
        body: `Hi ${motherName}! Your baby nutrition companion is ready. Let's start planning healthy meals! 🍎`,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'welcome-notification',
        requireInteraction: true
      });
    }
  };

  const handleWelcomeBackNotification = async () => {
    // Check last visit using IndexedDB
    const lastVisit = await getLastVisit();
    const now = Date.now();
    const timeSinceLastVisit = now - (lastVisit || 0);
    
    // If more than 1 day passed (86400000 ms), send "welcome back"
    if (timeSinceLastVisit > 86400000 && Notification.permission === 'granted') {
      const { data: { user } } = await supabase.auth.getUser();
      let motherName = 'Mom';
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('mother_name')
          .eq('id', user.id)
          .single();
        
        if (profile?.mother_name) {
          motherName = profile.mother_name;
        }
      }

      new Notification('👋 Welcome Back to BabyBites!', {
        body: `Hi ${motherName}! Ready to continue your baby's nutrition journey? Let's make today delicious! 🥗`,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'welcome-back-notification'
      });
    }
    
    // Update last visit
    await saveLastVisit(now);
  };

  return { installPrompt, isInstalled };
};

// IndexedDB helpers
async function getLastVisit(): Promise<number | null> {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(['user-data'], 'readonly');
    const store = tx.objectStore('user-data');
    const request = store.get('last-visit');
    
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error('Error getting last visit:', error);
    return null;
  }
}

async function saveLastVisit(timestamp: number): Promise<void> {
  try {
    const db = await openIndexedDB();
    const tx = db.transaction(['user-data'], 'readwrite');
    const store = tx.objectStore('user-data');
    store.put(timestamp, 'last-visit');
    
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error('Error saving last visit:', error);
  }
}

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
