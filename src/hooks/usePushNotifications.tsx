import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { setPushFlowActive } from '@/utils/pwaRecovery';

const DEFAULT_MEAL_TIMES = [
  { meal_type: 'breakfast', preferred_hour: 7, preferred_minute: 30, enabled: true },
  { meal_type: 'morning-snack', preferred_hour: 10, preferred_minute: 0, enabled: true },
  { meal_type: 'lunch', preferred_hour: 12, preferred_minute: 30, enabled: true },
  { meal_type: 'afternoon-snack', preferred_hour: 15, preferred_minute: 30, enabled: true },
  { meal_type: 'dinner', preferred_hour: 18, preferred_minute: 0, enabled: true },
];

export type PushState = 'idle' | 'requesting_permission' | 'preparing_sw' | 'subscribing' | 'saving' | 'testing' | 'ready' | 'error';

let globalSubscribing = false;

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

/**
 * Robust SW acquisition — uses navigator.serviceWorker.ready as the primary mechanism
 * with progressive fallbacks. Never times out prematurely.
 */
async function acquireServiceWorker(): Promise<ServiceWorkerRegistration> {
  console.log('🔔 Push: Acquiring service worker...');

  // Strategy 1: If there's already an active registration with pushManager, use it immediately
  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const reg of registrations) {
    if (reg.active && reg.pushManager) {
      console.log('🔔 Push: Found existing active SW with pushManager');
      return reg;
    }
  }

  // Strategy 2: Force-activate any waiting workers
  for (const reg of registrations) {
    if (reg.waiting) {
      console.log('🔔 Push: Activating waiting SW...');
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      await new Promise(r => setTimeout(r, 1000));
      if (reg.active) return reg;
    }
  }

  // Strategy 3: Register fresh SW and wait for ready
  console.log('🔔 Push: Registering fresh /sw.js...');
  try {
    await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch (e) {
    console.log('🔔 Push: /sw.js registration failed, trying sw-listener.js...');
    await navigator.serviceWorker.register('/sw-listener.js', { scope: '/' });
  }

  // Wait for ready — this is the most reliable way
  console.log('🔔 Push: Waiting for navigator.serviceWorker.ready...');
  const readyReg = await navigator.serviceWorker.ready;
  console.log('🔔 Push: SW ready! scope:', readyReg.scope);
  return readyReg;
}

export const usePushNotifications = () => {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [pushState, setPushState] = useState<PushState>('idle');
  const [lastError, setLastError] = useState<string | null>(null);
  const checkedRef = useRef(false);

  useEffect(() => {
    const iOS = isIOSDevice();
    const standalone = isStandalonePWA();
    const version = getIOSVersion();
    const canReceive = !iOS || (standalone && version >= 16);
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window && canReceive;
    setIsSupported(supported);

    if (supported && !checkedRef.current) {
      checkedRef.current = true;
      checkExistingSub();
    }
  }, []);

  const checkExistingSub = async () => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        if (reg.active) {
          const sub = await reg.pushManager.getSubscription();
          if (sub) {
            setSubscription(sub);
            setPushState('ready');
            return;
          }
        }
      }
    } catch { /* silent */ }
  };

  const subscribeToPushNotifications = useCallback(async (): Promise<boolean> => {
    if (globalSubscribing) {
      console.log('🔒 Push: another subscription attempt is in progress');
      return false;
    }
    globalSubscribing = true;
    setPushFlowActive(true);
    setLastError(null);

    // Master safety timeout — force-close after 30s no matter what
    const masterTimeout = setTimeout(() => {
      if (globalSubscribing) {
        console.warn('🔔 Push: Master timeout reached (30s)');
        globalSubscribing = false;
        setPushFlowActive(false);
        setPushState('error');
        setLastError('timeout');
      }
    }, 30000);

    try {
      if (!isSupported) {
        toast.error("Push notifications aren't supported in this browser.");
        return false;
      }

      // Step 1: Permission — if already granted, skip the prompt entirely
      setPushState('requesting_permission');
      console.log('🔔 Step 1: Checking permission...');
      let permission = Notification.permission;
      if (permission === 'default') {
        permission = await Notification.requestPermission();
      }
      console.log('🔔 Step 1: Permission =', permission);
      if (permission !== 'granted') {
        setPushState('error');
        setLastError('permission_denied');
        toast.error("Notification permission denied. Please enable it in your browser settings.");
        return false;
      }

      // Step 2: Service Worker — robust acquisition with no artificial timeout
      setPushState('preparing_sw');
      console.log('🔔 Step 2: Acquiring service worker...');
      let registration: ServiceWorkerRegistration;
      try {
        registration = await acquireServiceWorker();
        console.log('🔔 Step 2: SW acquired, active:', !!registration.active);
      } catch (err) {
        console.error('🔔 Step 2 FAILED:', err);
        setPushState('error');
        setLastError('sw_not_ready');
        toast.error("Could not prepare the notification service. Please refresh the page and try again.");
        return false;
      }

      // Step 3: Fetch VAPID key and subscribe to push
      setPushState('subscribing');
      console.log('🔔 Step 3: Fetching VAPID key...');
      let vapidKey: string;
      try {
        const { data, error } = await supabase.functions.invoke('get-vapid-key');
        if (error || !data?.vapidPublicKey) {
          throw new Error('VAPID key not returned');
        }
        vapidKey = data.vapidPublicKey;
        console.log('🔔 Step 3: VAPID key OK, length:', vapidKey.length);
      } catch (err) {
        console.error('🔔 Step 3 VAPID FAILED:', err);
        setPushState('error');
        setLastError('vapid_failed');
        toast.error("Could not fetch notification keys. Please try again later.");
        return false;
      }

      // Reuse existing valid subscription if endpoint matches current VAPID
      let sub: PushSubscription;
      try {
        const existingSub = await registration.pushManager.getSubscription();
        if (existingSub) {
          const p256dh = existingSub.getKey('p256dh');
          const auth = existingSub.getKey('auth');
          if (p256dh && auth) {
            console.log('🔔 Step 3: Reusing existing valid subscription');
            sub = existingSub;
          } else {
            await existingSub.unsubscribe();
            sub = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
            });
          }
        } else {
          sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey),
          });
        }

        const p256dh = sub.getKey('p256dh');
        const auth = sub.getKey('auth');
        if (!p256dh || !auth) {
          throw new Error('Subscription missing encryption keys');
        }
        console.log('🔔 Step 3: Subscription ready, endpoint:', sub.endpoint.substring(0, 60) + '...');
      } catch (err) {
        console.error('🔔 Step 3 SUBSCRIBE FAILED:', err);
        setPushState('error');
        setLastError('subscribe_failed');
        toast.error("Could not create push subscription. Please try again.");
        return false;
      }

      // Step 4: Save to backend
      setPushState('saving');
      console.log('🔔 Step 4: Saving subscription...');
      const saved = await saveSubscription(sub);
      if (!saved) {
        setPushState('error');
        setLastError('save_failed');
        toast.error("Could not save subscription. Please try again.");
        return false;
      }

      // Step 5: Test delivery (non-blocking — don't fail if test fails)
      setPushState('testing');
      console.log('🔔 Step 5: Testing delivery...');
      const testOk = await testDelivery();
      if (!testOk) {
        console.warn('⚠️ Test push failed, but subscription saved successfully');
      }

      setSubscription(sub);
      setPushState('ready');

      // Side effects (non-blocking)
      Promise.allSettled([ensureDefaultMealTimes(), updateUserTimezone()]);

      toast.success("🔔 Notifications enabled! You'll receive meal reminders.");
      return true;
    } catch (error) {
      console.error('🔔 Push UNEXPECTED ERROR:', error);
      setPushState('error');
      setLastError('unknown');
      toast.error("Could not enable notifications. Please try again.");
      return false;
    } finally {
      clearTimeout(masterTimeout);
      globalSubscribing = false;
      setPushFlowActive(false);
    }
  }, [isSupported]);

  const saveSubscription = async (sub: PushSubscription): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const p256dh = sub.getKey('p256dh');
      const auth = sub.getKey('auth');
      if (!p256dh || !auth) return false;

      const subData = {
        user_id: user.id,
        endpoint: sub.endpoint,
        keys: { p256dh: arrayBufferToBase64(p256dh), auth: arrayBufferToBase64(auth) },
      };

      // Clean: delete old, insert fresh
      await supabase.from('push_subscriptions').delete().eq('user_id', user.id);
      await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      const { error: insertErr } = await supabase.from('push_subscriptions').insert(subData);
      if (insertErr) {
        console.error('🔔 Save: Insert failed:', insertErr.message);
        return false;
      }

      // Verify
      const { data: verify } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      if (!verify || verify.length === 0) return false;

      console.log('✅ Subscription saved and verified');
      return true;
    } catch (err) {
      console.error('🔔 Save error:', err);
      return false;
    }
  };

  const testDelivery = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('test-push-notification');
      if (error) return false;
      return data?.success === true;
    } catch {
      return false;
    }
  };

  const ensureDefaultMealTimes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: existing } = await supabase.from('baby_meal_times').select('id').eq('user_id', user.id).limit(1);
      if (existing && existing.length > 0) return;
      await supabase.from('baby_meal_times').insert(DEFAULT_MEAL_TIMES.map(mt => ({ ...mt, user_id: user.id })));
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
      setPushState('idle');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await supabase.from('push_subscriptions').delete().eq('user_id', user.id);
      toast.success("Notifications disabled.");
    } catch { /* ignore */ }
  };

  return {
    isSupported,
    subscription,
    pushState,
    lastError,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications,
  };
};
