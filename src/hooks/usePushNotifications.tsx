import { useEffect, useState } from 'react';
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

const fetchVapidPublicKey = async (): Promise<string | null> => {
  try {
    console.log('🔑 Fetching VAPID public key...');
    const { data, error } = await supabase.functions.invoke('get-vapid-key');
    if (error) {
      console.error('❌ Error fetching VAPID key:', error);
      return null;
    }
    if (!data?.vapidPublicKey) {
      console.error('❌ No VAPID key in response:', data);
      return null;
    }
    console.log('✅ VAPID key received, length:', data.vapidPublicKey.length);
    return data.vapidPublicKey;
  } catch (error) {
    console.error('💥 Error in fetchVapidPublicKey:', error);
    return null;
  }
};

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
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

async function subscribePushManager(registration: ServiceWorkerRegistration, vapidKey: string): Promise<PushSubscription> {
  const applicationServerKey = urlBase64ToUint8Array(vapidKey);
  // Pass Uint8Array directly — supported by all modern browsers
  // Using .buffer can fail on some mobile browsers due to shared ArrayBuffer issues
  return await (registration as any).pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: applicationServerKey,
  });
}

export const usePushNotifications = () => {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [iosStatus, setIosStatus] = useState({
    isIOS: false,
    isStandalone: false,
    iosVersion: 0,
    canReceiveNotifications: true,
  });

  useEffect(() => {
    const iOS = isIOSDevice();
    const standalone = isStandalonePWA();
    const version = getIOSVersion();
    const canReceiveNotifications = !iOS || (standalone && version >= 16);
    
    setIosStatus({ isIOS: iOS, isStandalone: standalone, iosVersion: version, canReceiveNotifications });

    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported && canReceiveNotifications);
    
    console.log('📱 Push notifications check:', { browserSupport: supported, iOS, standalone, version, canReceiveNotifications, finalSupported: supported && canReceiveNotifications });

    if (supported && canReceiveNotifications) {
      checkExistingSubscription();
    }
  }, []);

  const checkExistingSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSub = await (registration as any).pushManager.getSubscription();

      if (existingSub) {
        console.log('✅ Found existing push subscription');
        setSubscription(existingSub);
        await saveSubscription(existingSub);
      } else if (Notification.permission === 'granted') {
        console.log('🔄 Permission granted but no subscription — auto-subscribing...');
        try {
          const vapidKey = await fetchVapidPublicKey();
          if (vapidKey) {
            const newSub = await subscribePushManager(registration, vapidKey);
            console.log('✅ Auto-subscribed successfully');
            setSubscription(newSub);
            await saveSubscription(newSub);
          }
        } catch (autoSubError) {
          console.error('❌ Auto-subscribe failed:', autoSubError);
        }
      } else {
        console.log('📭 No existing push subscription found');
      }
    } catch (error) {
      console.error('❌ Error checking subscription:', error);
    }
  };

  const subscribeToPushNotifications = async (): Promise<boolean> => {
    console.log('🔔 Starting push notification subscription...');

    if (!isSupported) {
      console.error('❌ Push notifications not supported');
      toast({ title: "Not Supported", description: "Push notifications are not supported in your browser.", variant: "destructive" });
      return false;
    }

    try {
      // Step 1: Request permission
      console.log('🔐 Requesting notification permission...');
      const permission = await Notification.requestPermission();
      console.log('🔐 Permission result:', permission);

      if (permission !== 'granted') {
        toast({ title: "Permission Denied", description: "Please enable notifications in your browser settings to receive meal reminders.", variant: "destructive" });
        return false;
      }

      // Step 2: Get service worker
      console.log('⚙️ Getting service worker registration...');
      const registration = await navigator.serviceWorker.ready;
      console.log('✅ Service worker ready');

      // Step 3: Unsubscribe existing to ensure fresh VAPID key
      const existingSub = await (registration as any).pushManager.getSubscription();
      if (existingSub) {
        console.log('🔄 Unsubscribing old subscription...');
        await existingSub.unsubscribe();
      }

      // Step 4: Fetch VAPID key
      console.log('🔑 Fetching VAPID key...');
      const vapidKey = await fetchVapidPublicKey();
      if (!vapidKey) {
        console.error('❌ Failed to get VAPID key');
        toast({ title: "Configuration Error", description: "Could not configure push notifications. Please try again later.", variant: "destructive" });
        return false;
      }

      // Step 5: Create push subscription
      console.log('📱 Creating push subscription...');
      let sub: PushSubscription;
      try {
        sub = await subscribePushManager(registration, vapidKey);
        console.log('✅ Push subscription created');
        console.log('📍 Endpoint:', sub.endpoint.substring(0, 60) + '...');
      } catch (subscribeError) {
        console.error('❌ Push subscribe failed:', subscribeError);
        toast({ title: "Subscription Failed", description: subscribeError instanceof Error ? subscribeError.message : "Could not enable push notifications.", variant: "destructive" });
        return false;
      }

      setSubscription(sub);

      // Step 6: Save to database
      console.log('💾 Saving subscription...');
      const saved = await saveSubscription(sub);
      if (!saved) {
        console.error('❌ Failed to save subscription');
        toast({ title: "Save Failed", description: "Could not save notification settings. Please try again.", variant: "destructive" });
        return false;
      }

      // Step 7: Ensure default meal times
      await ensureDefaultMealTimes();

      // Step 8: Update timezone
      await updateUserTimezone();

      console.log('🎉 Push notification subscription complete!');
      toast({ title: "Notifications Enabled", description: "You'll receive meal reminders at your scheduled times!" });
      return true;
    } catch (error) {
      console.error('💥 Error in subscribeToPushNotifications:', error);
      toast({ title: "Error", description: "Could not enable push notifications. Please try again.", variant: "destructive" });
      return false;
    }
  };

  const saveSubscription = async (sub: PushSubscription): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('⚠️ No user found, cannot save subscription');
        return false;
      }

      const p256dh = sub.getKey('p256dh');
      const auth = sub.getKey('auth');
      if (!p256dh || !auth) {
        console.error('❌ Missing encryption keys');
        return false;
      }

      const subscriptionData = {
        user_id: user.id,
        endpoint: sub.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(p256dh),
          auth: arrayBufferToBase64(auth)
        }
      };

      console.log('📦 Saving subscription for user:', user.id);

      // Delete existing subscriptions for this user first
      await supabase.from('push_subscriptions').delete().eq('user_id', user.id);

      // Also delete any existing subscription with same endpoint (different user edge case)
      await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);

      // Insert new
      const { data, error } = await supabase.from('push_subscriptions').insert(subscriptionData).select();

      if (error) {
        console.error('❌ Database insert error:', error);
        return false;
      }

      console.log('✅ Push subscription saved:', data);
      return true;
    } catch (error) {
      console.error('💥 Error in saveSubscription:', error);
      return false;
    }
  };

  const ensureDefaultMealTimes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: existingMealTimes } = await supabase
        .from('baby_meal_times').select('id').eq('user_id', user.id).limit(1);

      if (existingMealTimes && existingMealTimes.length > 0) return;

      const mealTimesToInsert = DEFAULT_MEAL_TIMES.map(mt => ({ ...mt, user_id: user.id }));
      await supabase.from('baby_meal_times').insert(mealTimesToInsert);
    } catch (error) {
      console.error('💥 Error in ensureDefaultMealTimes:', error);
    }
  };

  const updateUserTimezone = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      await supabase.from('profiles').update({ timezone }).eq('id', user.id);
    } catch (error) {
      console.error('💥 Error in updateUserTimezone:', error);
    }
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
    } catch (error) {
      console.error('Error unsubscribing:', error);
    }
  };

  return { isSupported, subscription, subscribeToPushNotifications, unsubscribeFromPushNotifications, iosStatus };
};
