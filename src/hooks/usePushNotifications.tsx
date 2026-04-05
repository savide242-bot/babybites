import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const DEFAULT_MEAL_TIMES = [
  { meal_type: 'breakfast', preferred_hour: 7, preferred_minute: 30, enabled: true },
  { meal_type: 'morning-snack', preferred_hour: 10, preferred_minute: 0, enabled: true },
  { meal_type: 'lunch', preferred_hour: 12, preferred_minute: 30, enabled: true },
  { meal_type: 'afternoon-snack', preferred_hour: 15, preferred_minute: 30, enabled: true },
  { meal_type: 'dinner', preferred_hour: 18, preferred_minute: 0, enabled: true },
];

export type PushState = 'idle' | 'requesting_permission' | 'preparing_sw' | 'subscribing' | 'saving' | 'testing' | 'ready' | 'error';

// ── Singleton lock: only one subscription attempt at a time across all hook instances ──
let globalSubscribing = false;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

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
      const reg = await withTimeout(navigator.serviceWorker.ready, 8000, 'SW ready check');
      const sub = await (reg as any).pushManager.getSubscription();
      if (sub) {
        setSubscription(sub);
        setPushState('ready');
      }
    } catch { /* silent */ }
  };

  const subscribeToPushNotifications = useCallback(async (): Promise<boolean> => {
    if (globalSubscribing) {
      console.log('🔒 Push: another subscription attempt is in progress, skipping');
      return false;
    }
    globalSubscribing = true;
    setLastError(null);

    try {
      if (!isSupported) {
        toast.error("Push notifications aren't supported in this browser.");
        return false;
      }

      // Step 1: Permission
      setPushState('requesting_permission');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setPushState('error');
        setLastError('permission_denied');
        toast.error("Notification permission denied. Please enable it in your browser settings.");
        return false;
      }

      // Step 2: Service Worker
      setPushState('preparing_sw');
      let registration: ServiceWorkerRegistration;
      try {
        registration = await withTimeout(navigator.serviceWorker.ready, 10000, 'Service worker ready');
      } catch {
        setPushState('error');
        setLastError('sw_not_ready');
        toast.error("Service worker not ready. Try refreshing the page.");
        return false;
      }

      // Step 3: Unsubscribe stale, fetch VAPID, subscribe
      try {
        const existingSub = await (registration as any).pushManager.getSubscription();
        if (existingSub) await existingSub.unsubscribe();
      } catch { /* ignore */ }

      setPushState('subscribing');
      let vapidKey: string;
      try {
        const { data, error } = await withTimeout(supabase.functions.invoke('get-vapid-key'), 5000, 'VAPID fetch');
        if (error || !data?.vapidPublicKey) throw new Error('VAPID key not returned');
        vapidKey = data.vapidPublicKey;
      } catch {
        setPushState('error');
        setLastError('vapid_failed');
        toast.error("Could not fetch notification keys. Please try again later.");
        return false;
      }

      let sub: PushSubscription;
      try {
        sub = await withTimeout(
          (registration as any).pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidKey) }),
          15000,
          'Push subscribe'
        );
      } catch (err) {
        setPushState('error');
        setLastError('subscribe_failed');
        toast.error(err instanceof Error ? err.message : "Could not create push subscription.");
        return false;
      }

      // Step 4: Save to backend
      setPushState('saving');
      const saved = await saveSubscription(sub);
      if (!saved) {
        setPushState('error');
        setLastError('save_failed');
        toast.error("Could not save subscription to server. Please try again.");
        return false;
      }

      // Step 5: Test delivery
      setPushState('testing');
      const testOk = await testDelivery();
      if (!testOk) {
        // Saved but test failed — still mark as ready since sub is valid
        console.warn('⚠️ Test push failed, but subscription saved successfully');
      }

      setSubscription(sub);
      setPushState('ready');

      // Side effects
      await Promise.allSettled([ensureDefaultMealTimes(), updateUserTimezone()]);

      toast.success("🔔 Notifications enabled! You'll receive meal reminders.");
      return true;
    } catch (error) {
      setPushState('error');
      setLastError('unknown');
      toast.error(error instanceof Error ? error.message : "Could not enable notifications.");
      return false;
    } finally {
      globalSubscribing = false;
    }
  }, [isSupported]);

  const saveSubscription = async (sub: PushSubscription): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const p256dh = sub.getKey('p256dh');
      const auth = sub.getKey('auth');
      if (!p256dh || !auth) {
        console.error('Missing p256dh or auth keys from subscription');
        return false;
      }

      const subData = {
        user_id: user.id,
        endpoint: sub.endpoint,
        keys: { p256dh: arrayBufferToBase64(p256dh), auth: arrayBufferToBase64(auth) },
      };

      // Delete all existing for this user, then insert fresh
      const { error: delErr } = await supabase.from('push_subscriptions').delete().eq('user_id', user.id);
      if (delErr) console.warn('Delete old subs failed:', delErr.message);

      // Also delete by endpoint (edge case: different user, same browser)
      await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);

      const { error: insertErr } = await supabase.from('push_subscriptions').insert(subData);
      if (insertErr) {
        console.error('Insert subscription failed:', insertErr.message);
        return false;
      }

      console.log('✅ Subscription saved to backend');
      return true;
    } catch (err) {
      console.error('Save subscription error:', err);
      return false;
    }
  };

  const testDelivery = async (): Promise<boolean> => {
    try {
      const { data, error } = await withTimeout(
        supabase.functions.invoke('test-push-notification'),
        10000,
        'Test push'
      );
      if (error) {
        console.warn('Test push invocation error:', error);
        return false;
      }
      return data?.success === true;
    } catch (err) {
      console.warn('Test delivery failed:', err);
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
