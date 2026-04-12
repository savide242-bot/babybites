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

/** True when running inside the Lovable preview iframe — push APIs are blocked here. */
function isPreview(): boolean {
  const h = location.hostname;
  if (h.includes('id-preview--') || h.includes('lovableproject.com')) return true;
  try { return self !== top; } catch { return true; }
}

/** Wrap a promise with a hard timeout. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`TIMEOUT:${label}`)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

// Prevent double-click
let _busy = false;

// ── Default meal times to seed on first activation ─────────────────
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

  // Feature-detect once
  const isSupported =
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window;

  // On mount, silently check for existing subscription
  useEffect(() => {
    if (!isSupported) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (sub) { setSubscription(sub); setPushState('ready'); }
      })
      .catch(() => {});
  }, [isSupported]);

  // ── Main subscribe function ────────────────────────────────────
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (_busy) return false;
    _busy = true;
    setPushState('working');
    setLastError(null);

    const fail = (err: PushError): false => {
      setPushState('error');
      setLastError(err);
      _busy = false;
      return false;
    };

    try {
      // 0. Guard: preview context
      if (isPreview()) return fail('preview_blocked');

      // 0b. Guard: browser support
      if (!isSupported) return fail('unsupported');

      // ── STEP 1: Permission (instant — browser native prompt) ───
      console.log('[push] 1/4 permission');
      let perm = Notification.permission;
      if (perm === 'default') {
        perm = await withTimeout(Notification.requestPermission(), 30_000, 'permission');
      }
      if (perm !== 'granted') return fail('permission_denied');

      // ── STEP 2: Service Worker (max 10s) ───────────────────────
      console.log('[push] 2/4 service worker');
      let reg: ServiceWorkerRegistration;
      try {
        reg = await withTimeout(navigator.serviceWorker.ready, 10_000, 'sw_ready');
      } catch {
        // Fallback: register manually
        try {
          await navigator.serviceWorker.register('/sw.js', { scope: '/' });
          reg = await withTimeout(navigator.serviceWorker.ready, 8_000, 'sw_manual');
        } catch {
          return fail('sw_failed');
        }
      }

      // ── STEP 3: VAPID key + PushManager.subscribe (max 10s) ───
      console.log('[push] 3/4 vapid + subscribe');
      const { data: vapid, error: vapidErr } = await withTimeout(
        supabase.functions.invoke('get-vapid-key'),
        10_000,
        'vapid',
      );
      if (vapidErr || !vapid?.vapidPublicKey) return fail('vapid_failed');

      // Re-use existing browser subscription if valid
      let sub = await reg.pushManager.getSubscription();
      if (sub && (!sub.getKey('p256dh') || !sub.getKey('auth'))) {
        await sub.unsubscribe();
        sub = null;
      }
      if (!sub) {
        try {
          sub = await withTimeout(
            reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: b64ToUint8(vapid.vapidPublicKey) as BufferSource,
            }),
            10_000,
            'push_subscribe',
          );
        } catch {
          return fail('subscribe_failed');
        }
      }
      if (!sub?.getKey('p256dh') || !sub?.getKey('auth')) return fail('subscribe_failed');

      // ── STEP 4: Save to DB (max 8s) ───────────────────────────
      console.log('[push] 4/4 saving');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return fail('no_user');

      const payload = {
        user_id: user.id,
        endpoint: sub.endpoint,
        keys: {
          p256dh: bufToB64(sub.getKey('p256dh')!),
          auth: bufToB64(sub.getKey('auth')!),
        },
      };

      // Replace old subs, insert new
      await supabase.from('push_subscriptions').delete().eq('user_id', user.id);
      const { error: insertErr } = await withTimeout(
        supabase.from('push_subscriptions').insert(payload),
        8_000,
        'db_insert',
      );
      if (insertErr) return fail('save_failed');

      // ── Done! ─────────────────────────────────────────────────
      setSubscription(sub);
      setPushState('ready');
      _busy = false;

      // Side-effects (fire-and-forget)
      seedMealTimesIfNeeded(user.id);
      saveTimezone(user.id);
      supabase.functions.invoke('test-push-notification').catch(() => {});

      return true;
    } catch (err: any) {
      console.error('[push] unexpected:', err);
      if (err?.message?.startsWith('TIMEOUT:')) return fail('timeout');
      return fail('unknown');
    } finally {
      _busy = false;
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
    } catch { /* ignore */ }
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

// ── Fire-and-forget helpers ──────────────────────────────────────
async function seedMealTimesIfNeeded(uid: string) {
  try {
    const { data } = await supabase.from('baby_meal_times').select('id').eq('user_id', uid).limit(1);
    if (data?.length) return;
    await supabase.from('baby_meal_times').insert(DEFAULT_MEALS.map((m) => ({ ...m, user_id: uid })));
  } catch { /* ignore */ }
}

async function saveTimezone(uid: string) {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    await supabase.from('profiles').update({ timezone: tz }).eq('id', uid);
  } catch { /* ignore */ }
}
