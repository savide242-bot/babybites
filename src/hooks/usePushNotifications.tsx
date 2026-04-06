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

/**
 * Robustly acquire a ServiceWorkerRegistration with an active worker.
 * Instead of just waiting on navigator.serviceWorker.ready (which can hang),
 * we check existing registrations, force-activate waiting workers, or
 * manually register the SW if none exist.
 */
async function acquireServiceWorker(): Promise<ServiceWorkerRegistration> {
  console.log('🔔 Push: Acquiring service worker...');
  
  // Step 1: Check existing registrations
  const registrations = await navigator.serviceWorker.getRegistrations();
  console.log('🔔 Push: Found', registrations.length, 'registrations');
  
  // Find one with an active worker
  for (const reg of registrations) {
    if (reg.active) {
      console.log('🔔 Push: Found active SW, scope:', reg.scope);
      return reg;
    }
  }
  
  // Step 2: Check if any registration has a waiting worker — force activate it
  for (const reg of registrations) {
    if (reg.waiting) {
      console.log('🔔 Push: Found waiting SW, sending skipWaiting...');
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      // Wait for it to become active
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('skipWaiting activation timeout')), 5000);
        const check = () => {
          if (reg.active) {
            clearTimeout(timeout);
            resolve();
          } else {
            setTimeout(check, 200);
          }
        };
        check();
      });
      if (reg.active) {
        console.log('🔔 Push: SW activated after skipWaiting');
        return reg;
      }
    }
  }
  
  // Step 3: Check for installing worker
  for (const reg of registrations) {
    if (reg.installing) {
      console.log('🔔 Push: Found installing SW, waiting for activation...');
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('SW install timeout')), 10000);
        reg.installing!.addEventListener('statechange', function handler() {
          if (reg.active) {
            clearTimeout(timeout);
            reg.installing?.removeEventListener('statechange', handler);
            resolve();
          }
        });
      });
      if (reg.active) return reg;
    }
  }
  
  // Step 4: No usable registration — manually register
  console.log('🔔 Push: No active SW found, registering /sw.js manually...');
  const newReg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  
  // Wait for the new worker to activate
  const worker = newReg.installing || newReg.waiting || newReg.active;
  if (newReg.active) {
    console.log('🔔 Push: Newly registered SW is already active');
    return newReg;
  }
  
  if (worker) {
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('New SW activation timeout')), 15000);
      worker.addEventListener('statechange', function handler() {
        if (worker.state === 'activated' || newReg.active) {
          clearTimeout(timeout);
          worker.removeEventListener('statechange', handler);
          resolve();
        }
      });
    });
  }
  
  if (!newReg.active) {
    // Last resort: try navigator.serviceWorker.ready with a timeout
    console.log('🔔 Push: Falling back to navigator.serviceWorker.ready...');
    const readyReg = await withTimeout(navigator.serviceWorker.ready, 8000, 'SW ready fallback');
    return readyReg;
  }
  
  return newReg;
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
      console.log('🔒 Push: another subscription attempt is in progress, skipping');
      return false;
    }
    globalSubscribing = true;
    setPushFlowActive(true); // Prevent pwaRecovery from nuking SW
    setLastError(null);

    try {
      if (!isSupported) {
        toast.error("Push notifications aren't supported in this browser.");
        return false;
      }

      // Step 1: Permission
      setPushState('requesting_permission');
      console.log('🔔 Push Step 1: Requesting permission...');
      const permission = await Notification.requestPermission();
      console.log('🔔 Push Step 1: Permission result:', permission);
      if (permission !== 'granted') {
        setPushState('error');
        setLastError('permission_denied');
        toast.error("Notification permission denied. Please enable it in your browser settings.");
        return false;
      }

      // Step 2: Service Worker — robust acquisition
      setPushState('preparing_sw');
      console.log('🔔 Push Step 2: Acquiring service worker...');
      let registration: ServiceWorkerRegistration;
      try {
        registration = await withTimeout(acquireServiceWorker(), 20000, 'Service worker acquisition');
        console.log('🔔 Push Step 2: SW acquired, scope:', registration.scope, 'active:', !!registration.active);
      } catch (err) {
        console.error('🔔 Push Step 2 FAILED:', err);
        setPushState('error');
        setLastError('sw_not_ready');
        toast.error("Service worker not ready. Try refreshing the page.");
        return false;
      }

      // Step 3: Unsubscribe stale, fetch VAPID, subscribe
      try {
        const existingSub = await registration.pushManager.getSubscription();
        if (existingSub) {
          console.log('🔔 Push Step 3: Unsubscribing stale subscription...');
          await existingSub.unsubscribe();
        }
      } catch { /* ignore */ }

      setPushState('subscribing');
      console.log('🔔 Push Step 3: Fetching VAPID key...');
      let vapidKey: string;
      try {
        const { data, error } = await withTimeout(supabase.functions.invoke('get-vapid-key'), 8000, 'VAPID fetch');
        if (error || !data?.vapidPublicKey) {
          console.error('🔔 Push Step 3: VAPID error:', error, 'data:', data);
          throw new Error('VAPID key not returned');
        }
        vapidKey = data.vapidPublicKey;
        console.log('🔔 Push Step 3: VAPID key received, length:', vapidKey.length);
      } catch (err) {
        console.error('🔔 Push Step 3 VAPID FAILED:', err);
        setPushState('error');
        setLastError('vapid_failed');
        toast.error("Could not fetch notification keys. Please try again later.");
        return false;
      }

      console.log('🔔 Push Step 3: Subscribing to push manager...');
      let sub: PushSubscription;
      try {
        sub = await withTimeout(
          registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(vapidKey) }),
          15000,
          'Push subscribe'
        );
        // Validate keys immediately
        const p256dh = sub.getKey('p256dh');
        const auth = sub.getKey('auth');
        if (!p256dh || !auth) {
          throw new Error('Subscription created but missing p256dh or auth keys');
        }
        console.log('🔔 Push Step 3: Subscription created, endpoint:', sub.endpoint.substring(0, 60) + '...');
      } catch (err) {
        console.error('🔔 Push Step 3 SUBSCRIBE FAILED:', err);
        setPushState('error');
        setLastError('subscribe_failed');
        toast.error(err instanceof Error ? err.message : "Could not create push subscription.");
        return false;
      }

      // Step 4: Save to backend
      setPushState('saving');
      console.log('🔔 Push Step 4: Saving subscription to backend...');
      const saved = await saveSubscription(sub);
      if (!saved) {
        setPushState('error');
        setLastError('save_failed');
        toast.error("Could not save subscription to server. Please try again.");
        return false;
      }
      console.log('🔔 Push Step 4: Subscription saved successfully');

      // Step 5: Test delivery
      setPushState('testing');
      console.log('🔔 Push Step 5: Testing push delivery...');
      const testOk = await testDelivery();
      if (!testOk) {
        console.warn('⚠️ Test push failed, but subscription saved successfully');
      } else {
        console.log('🔔 Push Step 5: Test push delivered successfully!');
      }

      setSubscription(sub);
      setPushState('ready');

      // Side effects
      await Promise.allSettled([ensureDefaultMealTimes(), updateUserTimezone()]);

      toast.success("🔔 Notifications enabled! You'll receive meal reminders.");
      return true;
    } catch (error) {
      console.error('🔔 Push UNEXPECTED ERROR:', error);
      setPushState('error');
      setLastError('unknown');
      toast.error(error instanceof Error ? error.message : "Could not enable notifications.");
      return false;
    } finally {
      globalSubscribing = false;
      setPushFlowActive(false);
    }
  }, [isSupported]);

  const saveSubscription = async (sub: PushSubscription): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('🔔 Save: No authenticated user');
        return false;
      }

      const p256dh = sub.getKey('p256dh');
      const auth = sub.getKey('auth');
      if (!p256dh || !auth) {
        console.error('🔔 Save: Missing p256dh or auth keys from subscription');
        return false;
      }

      const subData = {
        user_id: user.id,
        endpoint: sub.endpoint,
        keys: { p256dh: arrayBufferToBase64(p256dh), auth: arrayBufferToBase64(auth) },
      };

      // Clean approach: delete old subs for this user, then insert fresh
      // Delete by user_id first
      await supabase.from('push_subscriptions').delete().eq('user_id', user.id);
      // Also delete by endpoint (edge case: different user, same browser)
      await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);

      const { error: insertErr } = await supabase.from('push_subscriptions').insert(subData);
      if (insertErr) {
        console.error('🔔 Save: Insert failed:', insertErr.message);
        return false;
      }

      // Verify the insert actually worked
      const { data: verify, error: verifyErr } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);
      
      if (verifyErr || !verify || verify.length === 0) {
        console.error('🔔 Save: Verification failed — row not found after insert');
        return false;
      }

      console.log('✅ Subscription saved and verified in backend');
      return true;
    } catch (err) {
      console.error('🔔 Save subscription error:', err);
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
        console.warn('🔔 Test push invocation error:', error);
        return false;
      }
      console.log('🔔 Test push result:', data);
      return data?.success === true;
    } catch (err) {
      console.warn('🔔 Test delivery failed:', err);
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
