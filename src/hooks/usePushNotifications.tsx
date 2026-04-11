import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type PushState = 'idle' | 'requesting_permission' | 'subscribing' | 'saving' | 'ready' | 'error';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return window.btoa(binary);
}

const isIOSDevice = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
const isStandalonePWA = () => window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
const getIOSVersion = () => { const m = navigator.userAgent.match(/OS (\d+)_/); return m ? parseInt(m[1], 10) : 0; };

const DEFAULT_MEAL_TIMES = [
  { meal_type: 'breakfast', preferred_hour: 7, preferred_minute: 30, enabled: true },
  { meal_type: 'morning-snack', preferred_hour: 10, preferred_minute: 0, enabled: true },
  { meal_type: 'lunch', preferred_hour: 12, preferred_minute: 30, enabled: true },
  { meal_type: 'afternoon-snack', preferred_hour: 15, preferred_minute: 30, enabled: true },
  { meal_type: 'dinner', preferred_hour: 18, preferred_minute: 0, enabled: true },
];

let isSubscribing = false;

/**
 * Simple, reliable push notification hook.
 * No complex SW acquisition — just uses navigator.serviceWorker.ready with a timeout.
 */
export const usePushNotifications = () => {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [pushState, setPushState] = useState<PushState>('idle');
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    const iOS = isIOSDevice();
    const standalone = isStandalonePWA();
    const version = getIOSVersion();
    const canReceive = !iOS || (standalone && version >= 16);
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && canReceive;
    setIsSupported(supported);

    if (supported) {
      // Check for existing subscription silently
      navigator.serviceWorker.ready
        .then(reg => reg.pushManager.getSubscription())
        .then(sub => {
          if (sub) {
            setSubscription(sub);
            setPushState('ready');
          }
        })
        .catch(() => {});
    }
  }, []);

  const subscribeToPushNotifications = useCallback(async (): Promise<boolean> => {
    if (isSubscribing) return false;
    isSubscribing = true;
    setLastError(null);

    try {
      if (!isSupported) {
        toast.error("Push notifications aren't supported in this browser.");
        return false;
      }

      // 1. Permission
      setPushState('requesting_permission');
      console.log('🔔 Step 1: Permission');
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }
      if (permission !== 'granted') {
        setPushState('error');
        setLastError('permission_denied');
        toast.error("Notification permission denied. Enable it in browser settings.");
        return false;
      }

      // 2. Get Service Worker (simple: just wait for ready with 8s timeout)
      setPushState('subscribing');
      console.log('🔔 Step 2: Getting SW...');
      let registration: ServiceWorkerRegistration;
      try {
        registration = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('SW_TIMEOUT')), 8000)
          ),
        ]);
        console.log('🔔 SW ready:', registration.active?.state);
      } catch {
        // Try registering SW manually
        console.log('🔔 SW not ready, registering manually...');
        try {
          await navigator.serviceWorker.register('/sw.js', { scope: '/' });
          registration = await Promise.race([
            navigator.serviceWorker.ready,
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('SW_TIMEOUT_2')), 5000)
            ),
          ]);
        } catch {
          setPushState('error');
          setLastError('sw_not_ready');
          toast.error("Could not prepare notifications. Please refresh the page and try again.");
          return false;
        }
      }

      // 3. Get VAPID key + subscribe
      console.log('🔔 Step 3: VAPID + subscribe');
      const { data: vapidData, error: vapidError } = await supabase.functions.invoke('get-vapid-key');
      if (vapidError || !vapidData?.vapidPublicKey) {
        setPushState('error');
        setLastError('vapid_failed');
        toast.error("Could not fetch notification keys. Try again later.");
        return false;
      }

      // Check for existing subscription first
      let sub = await registration.pushManager.getSubscription();
      if (sub) {
        // Validate it has keys
        if (!sub.getKey('p256dh') || !sub.getKey('auth')) {
          await sub.unsubscribe();
          sub = null;
        }
      }
      if (!sub) {
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidData.vapidPublicKey) as BufferSource,
        });
      }
      if (!sub.getKey('p256dh') || !sub.getKey('auth')) {
        setPushState('error');
        setLastError('subscribe_failed');
        toast.error("Could not create push subscription. Try again.");
        return false;
      }

      // 4. Save to database
      setPushState('saving');
      console.log('🔔 Step 4: Saving');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setPushState('error');
        setLastError('no_user');
        toast.error("You must be logged in to enable notifications.");
        return false;
      }

      const p256dh = sub.getKey('p256dh')!;
      const auth = sub.getKey('auth')!;
      const subData = {
        user_id: user.id,
        endpoint: sub.endpoint,
        keys: { p256dh: arrayBufferToBase64(p256dh), auth: arrayBufferToBase64(auth) },
      };

      // Clean old subscriptions, insert new
      await supabase.from('push_subscriptions').delete().eq('user_id', user.id);
      const { error: insertError } = await supabase.from('push_subscriptions').insert(subData);
      if (insertError) {
        console.error('🔔 Save failed:', insertError.message);
        setPushState('error');
        setLastError('save_failed');
        toast.error("Could not save subscription. Try again.");
        return false;
      }

      // Success!
      setSubscription(sub);
      setPushState('ready');
      toast.success("🔔 Notifications enabled!");

      // Side effects (non-blocking)
      ensureDefaultMealTimes(user.id);
      updateUserTimezone(user.id);

      // Test push (non-blocking)
      supabase.functions.invoke('test-push-notification').catch(() => {});

      return true;
    } catch (error) {
      console.error('🔔 Unexpected error:', error);
      setPushState('error');
      setLastError('unknown');
      toast.error("Could not enable notifications. Please try again.");
      return false;
    } finally {
      isSubscribing = false;
    }
  }, [isSupported]);

  const unsubscribeFromPushNotifications = async () => {
    if (!subscription) return;
    try {
      await subscription.unsubscribe();
      setSubscription(null);
      setPushState('idle');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await supabase.from('push_subscriptions').delete().eq('user_id', user.id);
      toast.success("Notifications disabled.");
    } catch { /* ignore */ }
  };

  return { isSupported, subscription, pushState, lastError, subscribeToPushNotifications, unsubscribeFromPushNotifications };
};

async function ensureDefaultMealTimes(userId: string) {
  try {
    const { data: existing } = await supabase.from('baby_meal_times').select('id').eq('user_id', userId).limit(1);
    if (existing?.length) return;
    await supabase.from('baby_meal_times').insert(DEFAULT_MEAL_TIMES.map(mt => ({ ...mt, user_id: userId })));
  } catch { /* ignore */ }
}

async function updateUserTimezone(userId: string) {
  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    await supabase.from('profiles').update({ timezone }).eq('id', userId);
  } catch { /* ignore */ }
}
