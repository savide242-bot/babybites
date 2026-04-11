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
 * Resilient SW acquisition with multiple strategies and clean abort.
 */
async function acquireServiceWorker(signal?: AbortSignal): Promise<ServiceWorkerRegistration> {
  const check = () => { if (signal?.aborted) throw new Error('Aborted'); };

  console.log('🔔 SW: Starting acquisition...');

  // 1. Use controller's registration if available (instant)
  if (navigator.serviceWorker.controller) {
    console.log('🔔 SW: Controller exists, getting registration...');
    const reg = await navigator.serviceWorker.getRegistration(navigator.serviceWorker.controller.scriptURL);
    if (reg?.active?.state === 'activated' && reg.pushManager) {
      console.log('🔔 SW: Using controller registration');
      return reg;
    }
  }
  check();

  // 2. Check all registrations for an active one
  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const reg of registrations) {
    if (reg.active && reg.pushManager) {
      console.log('🔔 SW: Found active registration');
      return reg;
    }
  }
  check();

  // 3. Force-activate any waiting workers
  for (const reg of registrations) {
    if (reg.waiting) {
      console.log('🔔 SW: Force-activating waiting worker...');
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      // Wait briefly for activation
      await new Promise<void>((resolve) => {
        const onStateChange = () => {
          if (reg.active) { resolve(); }
        };
        reg.waiting?.addEventListener('statechange', onStateChange);
        setTimeout(resolve, 2000);
      });
      check();
      if (reg.active && reg.pushManager) return reg;
    }
  }
  check();

  // 4. Register fresh SW
  console.log('🔔 SW: No active SW found, registering fresh...');
  try {
    await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  } catch {
    console.log('🔔 SW: /sw.js failed, trying sw-listener.js...');
    await navigator.serviceWorker.register('/sw-listener.js', { scope: '/' });
  }
  check();

  // 5. Wait for ready — race against abort signal
  console.log('🔔 SW: Waiting for ready...');
  const reg = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) => {
      const timer = setTimeout(() => reject(new Error('SW ready timeout (10s)')), 10000);
      signal?.addEventListener('abort', () => { clearTimeout(timer); reject(new Error('Aborted')); });
    }),
  ]);
  console.log('🔔 SW: Ready!');
  return reg;
}

export const usePushNotifications = () => {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [pushState, setPushState] = useState<PushState>('idle');
  const [lastError, setLastError] = useState<string | null>(null);
  const checkedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

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
      console.log('🔒 Push: already in progress');
      return false;
    }
    globalSubscribing = true;
    setPushFlowActive(true);
    setLastError(null);

    // Abort controller for clean cancellation
    abortRef.current?.abort();
    const abort = new AbortController();
    abortRef.current = abort;

    // Master safety timeout
    const masterTimer = setTimeout(() => {
      if (globalSubscribing) {
        console.warn('🔔 Push: Master timeout (15s)');
        abort.abort();
        globalSubscribing = false;
        setPushFlowActive(false);
        setPushState('error');
        setLastError('timeout');
      }
    }, 15000);

    try {
      if (!isSupported) {
        toast.error("Push notifications aren't supported in this browser.");
        return false;
      }

      // Step 1: Permission
      setPushState('requesting_permission');
      console.log('🔔 Step 1: Permission check...');
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
      if (abort.signal.aborted) throw new Error('Aborted');

      // Step 2: Service Worker
      setPushState('preparing_sw');
      console.log('🔔 Step 2: SW acquisition...');
      let registration: ServiceWorkerRegistration;
      try {
        registration = await acquireServiceWorker(abort.signal);
      } catch (err: any) {
        console.error('🔔 Step 2 FAILED:', err?.message);
        if (abort.signal.aborted) throw err;
        setPushState('error');
        setLastError('sw_not_ready');
        toast.error("Could not prepare notifications. Please refresh and try again.");
        return false;
      }

      // Step 3: VAPID + Subscribe
      setPushState('subscribing');
      console.log('🔔 Step 3: VAPID + subscribe...');
      let vapidKey: string;
      try {
        const { data, error } = await supabase.functions.invoke('get-vapid-key');
        if (error || !data?.vapidPublicKey) throw new Error('No VAPID key');
        vapidKey = data.vapidPublicKey;
      } catch (err) {
        console.error('🔔 Step 3 VAPID FAILED:', err);
        setPushState('error');
        setLastError('vapid_failed');
        toast.error("Could not fetch notification keys. Try again later.");
        return false;
      }
      if (abort.signal.aborted) throw new Error('Aborted');

      let sub: PushSubscription;
      try {
        const existing = await registration.pushManager.getSubscription();
        if (existing?.getKey('p256dh') && existing?.getKey('auth')) {
          console.log('🔔 Step 3: Reusing existing subscription');
          sub = existing;
        } else {
          if (existing) await existing.unsubscribe();
          sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
          });
        }
        if (!sub.getKey('p256dh') || !sub.getKey('auth')) throw new Error('Missing keys');
      } catch (err) {
        console.error('🔔 Step 3 SUBSCRIBE FAILED:', err);
        setPushState('error');
        setLastError('subscribe_failed');
        toast.error("Could not create push subscription. Try again.");
        return false;
      }
      if (abort.signal.aborted) throw new Error('Aborted');

      // Step 4: Save
      setPushState('saving');
      console.log('🔔 Step 4: Saving...');
      const saved = await saveSubscription(sub);
      if (!saved) {
        setPushState('error');
        setLastError('save_failed');
        toast.error("Could not save subscription. Try again.");
        return false;
      }

      // Step 5: Test (non-blocking)
      setPushState('testing');
      const testOk = await testDelivery();
      if (!testOk) console.warn('⚠️ Test push failed but subscription saved');

      setSubscription(sub);
      setPushState('ready');

      // Side effects
      Promise.allSettled([ensureDefaultMealTimes(), updateUserTimezone()]);
      toast.success("🔔 Notifications enabled! You'll receive meal reminders.");
      return true;
    } catch (error: any) {
      if (error?.message === 'Aborted') {
        console.log('🔔 Push: Flow was aborted/timed out');
      } else {
        console.error('🔔 Push UNEXPECTED:', error);
      }
      if (pushState !== 'error') {
        setPushState('error');
        setLastError('unknown');
      }
      toast.error("Could not enable notifications. Please try again.");
      return false;
    } finally {
      clearTimeout(masterTimer);
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

      await supabase.from('push_subscriptions').delete().eq('user_id', user.id);
      await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      const { error } = await supabase.from('push_subscriptions').insert(subData);
      if (error) { console.error('🔔 Save insert failed:', error.message); return false; }

      const { data: verify } = await supabase.from('push_subscriptions').select('id').eq('user_id', user.id).limit(1);
      if (!verify?.length) return false;
      console.log('✅ Subscription saved');
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
    } catch { return false; }
  };

  const ensureDefaultMealTimes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: existing } = await supabase.from('baby_meal_times').select('id').eq('user_id', user.id).limit(1);
      if (existing?.length) return;
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

  return { isSupported, subscription, pushState, lastError, subscribeToPushNotifications, unsubscribeFromPushNotifications };
};
