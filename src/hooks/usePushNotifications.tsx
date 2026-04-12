import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// ── Types ──────────────────────────────────────────────────────────
export type PushState = 'idle' | 'working' | 'ready' | 'error';
export type PushError =
  | 'unsupported'
  | 'preview_blocked'
  | 'permission_denied'
  | 'sw_failed'
  | 'vapid_failed'
  | 'subscribe_failed'
  | 'save_failed'
  | 'timeout'
  | 'no_user'
  | 'unknown';

// ── Helpers ────────────────────────────────────────────────────────
function b64ToUint8(base64: string): Uint8Array {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function bufToB64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function isPreview(): boolean {
  const h = location.hostname;
  if (h.includes('id-preview--') || h.includes('lovableproject.com')) return true;
  try { return self !== top; } catch { return true; }
}

// ── Default meal times ─────────────────────────────────────────────
const DEFAULT_MEALS = [
  { meal_type: 'breakfast', preferred_hour: 7, preferred_minute: 30, enabled: true },
  { meal_type: 'morning-snack', preferred_hour: 10, preferred_minute: 0, enabled: true },
  { meal_type: 'lunch', preferred_hour: 12, preferred_minute: 30, enabled: true },
  { meal_type: 'afternoon-snack', preferred_hour: 15, preferred_minute: 30, enabled: true },
  { meal_type: 'dinner', preferred_hour: 18, preferred_minute: 0, enabled: true },
];

// ── Hook ───────────────────────────────────────────────────────────
export function usePushNotifications() {
  const [pushState, setPushState] = useState<PushState>('idle');
  const [lastError, setLastError] = useState<PushError | null>(null);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  const isSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;

  // Check existing subscription on mount (silent)
  useEffect(() => {
    if (!isSupported) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (sub) { setSubscription(sub); setPushState('ready'); }
      })
      .catch(() => {});
  }, [isSupported]);

  // ── Subscribe: simple, no-hang flow ────────────────────────────
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;
    if (isPreview()) {
      console.warn('[push] blocked in preview context');
      return false;
    }

    try {
      // 1. Ask permission (browser native prompt — instant)
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        console.log('[push] permission denied by user');
        return false;
      }

      // 2. Get service worker (use existing or register)
      let reg: ServiceWorkerRegistration;
      try {
        reg = await Promise.race([
          navigator.serviceWorker.ready,
          new Promise<never>((_, rej) => setTimeout(() => rej(new Error('sw_timeout')), 8000)),
        ]);
      } catch {
        try {
          await navigator.serviceWorker.register('/sw.js', { scope: '/' });
          reg = await Promise.race([
            navigator.serviceWorker.ready,
            new Promise<never>((_, rej) => setTimeout(() => rej(new Error('sw_timeout2')), 6000)),
          ]);
        } catch {
          console.error('[push] service worker failed');
          return false;
        }
      }

      // 3. Get VAPID key
      const { data: vapid, error: vapidErr } = await supabase.functions.invoke('get-vapid-key');
      if (vapidErr || !vapid?.vapidPublicKey) {
        console.error('[push] vapid key failed');
        return false;
      }

      // 4. Subscribe to push (re-use existing if valid)
      let sub = await reg.pushManager.getSubscription();
      if (sub && (!sub.getKey('p256dh') || !sub.getKey('auth'))) {
        await sub.unsubscribe();
        sub = null;
      }
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: b64ToUint8(vapid.vapidPublicKey) as BufferSource,
        });
      }
      if (!sub?.getKey('p256dh') || !sub?.getKey('auth')) return false;

      // 5. Save to database
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      await supabase.from('push_subscriptions').delete().eq('user_id', user.id);
      const { error: insertErr } = await supabase.from('push_subscriptions').insert({
        user_id: user.id,
        endpoint: sub.endpoint,
        keys: {
          p256dh: bufToB64(sub.getKey('p256dh')!),
          auth: bufToB64(sub.getKey('auth')!),
        },
      });
      if (insertErr) {
        console.error('[push] save failed:', insertErr);
        return false;
      }

      // Done
      setSubscription(sub);
      setPushState('ready');

      // Fire-and-forget side effects
      seedMealTimesIfNeeded(user.id);
      saveTimezone(user.id);
      supabase.functions.invoke('test-push-notification').catch(() => {});

      return true;
    } catch (err) {
      console.error('[push] unexpected error:', err);
      return false;
    }
  }, [isSupported]);

  // ── Unsubscribe ───────────────────────────────────────────────
  const unsubscribe = useCallback(async () => {
    try {
      if (subscription) await subscription.unsubscribe();
      setSubscription(null);
      setPushState('idle');
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await supabase.from('push_subscriptions').delete().eq('user_id', user.id);
    } catch { /* silent */ }
  }, [subscription]);

  return {
    isSupported,
    pushState,
    lastError,
    subscription,
    subscribeToPushNotifications: subscribe,
    unsubscribeFromPushNotifications: unsubscribe,
  };
}

// ── Silent helpers ──────────────────────────────────────────────────
async function seedMealTimesIfNeeded(uid: string) {
  try {
    const { data } = await supabase.from('baby_meal_times').select('id').eq('user_id', uid).limit(1);
    if (data?.length) return;
    await supabase.from('baby_meal_times').insert(DEFAULT_MEALS.map((m) => ({ ...m, user_id: uid })));
  } catch { /* silent */ }
}

async function saveTimezone(uid: string) {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    await supabase.from('profiles').update({ timezone: tz }).eq('id', uid);
  } catch { /* silent */ }
}
