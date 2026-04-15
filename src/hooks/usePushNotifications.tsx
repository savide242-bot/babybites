import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

function isPreviewEnv(): boolean {
  try {
    if (window.self !== window.top) return true;
    if (window.location.hostname.includes('lovableproject.com')) return true;
    if (window.location.hostname.includes('id-preview')) return true;
  } catch { return true; }
  return false;
}

export function usePushNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSupported = typeof window !== 'undefined' 
    && 'serviceWorker' in navigator 
    && 'PushManager' in window 
    && 'Notification' in window;

  useEffect(() => {
    if (!isSupported) return;
    (async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) return;
        const sub = await reg.pushManager.getSubscription();
        setIsSubscribed(!!sub);
      } catch { /* silent */ }
    })();
  }, [isSupported]);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) { setError('Push notifications not supported'); return false; }
    if (isPreviewEnv()) { setError('Test on published domain'); return false; }

    setIsLoading(true);
    setError(null);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { setError('Permission denied'); return false; }

      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      }
      await navigator.serviceWorker.ready;

      const { data: vapidData, error: vapidError } = await supabase.functions.invoke('get-vapid-key');
      if (vapidError || !vapidData?.vapidPublicKey) {
        setError('Failed to get notification key');
        return false;
      }
      const vapidKey = vapidData.vapidPublicKey.replace(/^["']|["']$/g, '').trim();

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      const subJson = subscription.toJSON();
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        setError('Invalid subscription');
        return false;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('Not authenticated'); return false; }

      const { error: dbError } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          endpoint: subJson.endpoint!,
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        } as any, { onConflict: 'user_id,endpoint' });

      if (dbError) { setError('Failed to save subscription'); console.error(dbError); return false; }

      await supabase.from('profiles').update({ timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }).eq('id', user.id);

      setIsSubscribed(true);
      console.log('✅ Push subscription saved successfully');
      return true;
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      console.error('Push subscription error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('user_id', user.id)
              .eq('endpoint', sub.endpoint);
          }
        }
      }
      setIsSubscribed(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isSubscribed, isLoading, error, subscribe, unsubscribe, isSupported };
}
