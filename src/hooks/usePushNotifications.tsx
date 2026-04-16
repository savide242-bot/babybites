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

  // Check real subscription state on mount
  useEffect(() => {
    if (!isSupported) return;
    (async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) { setIsSubscribed(false); return; }
        const sub = await reg.pushManager.getSubscription();
        if (!sub) { setIsSubscribed(false); return; }
        
        // Verify it's also saved in DB
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setIsSubscribed(false); return; }
        
        const { data: dbSub } = await supabase
          .from('push_subscriptions')
          .select('id')
          .eq('user_id', user.id)
          .eq('endpoint', sub.endpoint)
          .maybeSingle();
        
        setIsSubscribed(!!dbSub);
        
        // If browser has subscription but DB doesn't, persist it now
        if (!dbSub) {
          console.log('🔄 Browser has subscription but DB missing — re-persisting...');
          await persistSubscription(sub, user.id);
        }
      } catch { /* silent */ }
    })();
  }, [isSupported]);

  const persistSubscription = useCallback(async (subscription: PushSubscription, userId: string): Promise<boolean> => {
    const subJson = subscription.toJSON();
    if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
      console.error('❌ Invalid subscription object — missing keys');
      setError('Invalid subscription');
      return false;
    }

    console.log('💾 Persisting subscription to DB...', {
      endpoint: subJson.endpoint.substring(0, 60) + '...',
      p256dh: subJson.keys.p256dh.substring(0, 20) + '...',
      auth: subJson.keys.auth.substring(0, 10) + '...',
    });

    const { error: dbError } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint: subJson.endpoint,
        p256dh: subJson.keys.p256dh,
        auth: subJson.keys.auth,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      } as any, { onConflict: 'user_id,endpoint' });

    if (dbError) {
      console.error('❌ Failed to save subscription to DB:', dbError);
      setError('Failed to save subscription');
      return false;
    }

    // Also update profile timezone
    await supabase
      .from('profiles')
      .update({ timezone: Intl.DateTimeFormat().resolvedOptions().timeZone })
      .eq('id', userId);

    console.log('✅ Push subscription saved successfully to DB');
    setIsSubscribed(true);
    return true;
  }, []);

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) { setError('Push notifications not supported'); return false; }
    if (isPreviewEnv()) { setError('Push notifications only work on the published app'); return false; }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { 
        setError('Notification permission denied'); 
        return false; 
      }

      // 2. Get service worker
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      }
      registration = await navigator.serviceWorker.ready;

      // 3. Get VAPID key
      const { data: vapidData, error: vapidError } = await supabase.functions.invoke('get-vapid-key');
      if (vapidError || !vapidData?.vapidPublicKey) {
        console.error('❌ VAPID key fetch failed:', vapidError);
        setError('Failed to get notification key');
        return false;
      }
      const vapidKey = vapidData.vapidPublicKey.replace(/^["']|["']$/g, '').trim();

      // 4. Get or create browser subscription
      let subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });
      }

      // 5. Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError('Not authenticated'); return false; }

      // 6. Persist to DB — this is the critical step
      const saved = await persistSubscription(subscription, user.id);
      
      if (!saved) {
        console.error('❌ Subscription created in browser but FAILED to save to DB');
        return false;
      }

      // 7. Verify it was actually saved
      const { data: verify } = await supabase
        .from('push_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('endpoint', subscription.endpoint)
        .maybeSingle();
      
      if (!verify) {
        console.error('❌ Verification failed — row not found after upsert');
        setError('Subscription save could not be verified');
        setIsSubscribed(false);
        return false;
      }

      console.log('✅ Push subscription fully verified in DB');
      return true;
    } catch (err: any) {
      setError(err.message || 'Unknown error');
      console.error('❌ Push subscription error:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, persistSubscription]);

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
