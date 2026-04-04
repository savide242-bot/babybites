import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

const DEFAULT_MEAL_TIMES = [
  { meal_type: 'breakfast', preferred_hour: 7, preferred_minute: 30, enabled: true },
  { meal_type: 'morning-snack', preferred_hour: 10, preferred_minute: 0, enabled: true },
  { meal_type: 'lunch', preferred_hour: 12, preferred_minute: 30, enabled: true },
  { meal_type: 'afternoon-snack', preferred_hour: 15, preferred_minute: 30, enabled: true },
  { meal_type: 'dinner', preferred_hour: 18, preferred_minute: 0, enabled: true },
];

const isIOSDevice = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

const isStandalonePWA = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (navigator as any).standalone === true;
};

const getIOSVersion = (): number => {
  if (!isIOSDevice()) return 0;
  const match = navigator.userAgent.match(/OS (\d+)_/);
  return match ? parseInt(match[1], 10) : 0;
};

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

const fetchVapidPublicKey = async (): Promise<string | null> => {
  try {
    const { data, error } = await withTimeout(
      supabase.functions.invoke('get-vapid-key'),
      5000,
      'VAPID key fetch'
    );
    if (error || !data?.vapidPublicKey) return null;
    return data.vapidPublicKey;
  } catch {
    return null;
  }
};

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Singleton lock to prevent concurrent subscription attempts
let isSubscribing = false;

export const usePushNotifications = () => {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [iosStatus, setIosStatus] = useState({
    isIOS: false,
    isStandalone: false,
    iosVersion: 0,
    canReceiveNotifications: true,
  });
  const checkedRef = useRef(false);

  useEffect(() => {
    const iOS = isIOSDevice();
    const standalone = isStandalonePWA();
    const version = getIOSVersion();
    const canReceiveNotifications = !iOS || (standalone && version >= 16);

    setIosStatus({ isIOS: iOS, isStandalone: standalone, iosVersion: version, canReceiveNotifications });

    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported && canReceiveNotifications);

    // Only check existing subscription once, and do NOT auto-subscribe
    if (supported && canReceiveNotifications && !checkedRef.current) {
      checkedRef.current = true;
      checkExistingSubscription();
    }
  }, []);

  const checkExistingSubscription = async () => {
    try {
      const registration = await withTimeout(navigator.serviceWorker.ready, 10000, 'Service worker ready');
      const existingSub = await (registration as any).pushManager.getSubscription();
      if (existingSub) {
        setSubscription(existingSub);
      }
    } catch {
      // Silently fail — don't block the app
    }
  };

  const subscribeToPushNotifications = async (): Promise<boolean> => {
    // Singleton lock — prevent concurrent attempts from multiple components
    if (isSubscribing) {
      return false;
    }
    isSubscribing = true;

    try {
      if (!isSupported) {
        toast({ title: "Not Supported", description: "Push notifications are not supported in your browser.", variant: "destructive" });
        return false;
      }

      // Step 1: Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast({ title: "Permission Denied", description: "Please enable notifications in your browser settings.", variant: "destructive" });
        return false;
      }

      // Step 2: Get service worker
      let registration: ServiceWorkerRegistration;
      try {
        registration = await withTimeout(navigator.serviceWorker.ready, 10000, 'Service worker ready');
      } catch {
        toast({ title: "Service Worker Error", description: "Could not initialize the notification service. Try refreshing the page.", variant: "destructive" });
        return false;
      }

      // Step 3: Unsubscribe existing (ensure fresh VAPID key)
      try {
        const existingSub = await (registration as any).pushManager.getSubscription();
        if (existingSub) await existingSub.unsubscribe();
      } catch { /* ignore */ }

      // Step 4: Fetch VAPID key
      const vapidKey = await fetchVapidPublicKey();
      if (!vapidKey) {
        toast({ title: "Configuration Error", description: "Could not fetch notification keys. Please try again later.", variant: "destructive" });
        return false;
      }

      // Step 5: Create push subscription
      let sub: PushSubscription;
      try {
        const applicationServerKey = urlBase64ToUint8Array(vapidKey);
        sub = await withTimeout(
          (registration as any).pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
          }),
          15000,
          'Push subscription'
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Could not enable push notifications.";
        toast({ title: "Subscription Failed", description: msg, variant: "destructive" });
        return false;
      }

      setSubscription(sub);

      // Step 6: Save to database
      const saved = await saveSubscription(sub);
      if (!saved) {
        toast({ title: "Save Failed", description: "Could not save notification settings. Please try again.", variant: "destructive" });
        return false;
      }

      // Step 7: Ensure default meal times
      await ensureDefaultMealTimes();

      // Step 8: Update timezone
      await updateUserTimezone();

      toast({ title: "Notifications Enabled", description: "You'll receive meal reminders at your scheduled times!" });
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Could not enable push notifications.";
      toast({ title: "Error", description: msg, variant: "destructive" });
      return false;
    } finally {
      isSubscribing = false;
    }
  };

  const saveSubscription = async (sub: PushSubscription): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const p256dh = sub.getKey('p256dh');
      const auth = sub.getKey('auth');
      if (!p256dh || !auth) return false;

      const subscriptionData = {
        user_id: user.id,
        endpoint: sub.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(p256dh),
          auth: arrayBufferToBase64(auth)
        }
      };

      // Delete existing subscriptions for this user
      await supabase.from('push_subscriptions').delete().eq('user_id', user.id);
      // Delete any with same endpoint (different user edge case)
      await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      // Insert new
      const { error } = await supabase.from('push_subscriptions').insert(subscriptionData).select();
      return !error;
    } catch {
      return false;
    }
  };

  const ensureDefaultMealTimes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: existing } = await supabase
        .from('baby_meal_times').select('id').eq('user_id', user.id).limit(1);
      if (existing && existing.length > 0) return;
      const mealTimesToInsert = DEFAULT_MEAL_TIMES.map(mt => ({ ...mt, user_id: user.id }));
      await supabase.from('baby_meal_times').insert(mealTimesToInsert);
    } catch { /* ignore */ }
  };

  const updateUserTimezone = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await supabase.from('profiles').update({ timezone }).eq('id', user.id);
    } catch { /* ignore */ }
  };

  const unsubscribeFromPushNotifications = async () => {
    if (!subscription) return;
    try {
      await subscription.unsubscribe();
      setSubscription(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('push_subscriptions').delete().eq('user_id', user.id);
      }
      toast({ title: "Unsubscribed", description: "You won't receive push notifications anymore." });
    } catch { /* ignore */ }
  };

  return { isSupported, subscription, subscribeToPushNotifications, unsubscribeFromPushNotifications, iosStatus };
};
