import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePushNotifications } from './usePushNotifications';

/**
 * Auto-resubscribe if notification permission is granted on this browser/device
 * but this device is not yet registered in push_subscriptions.
 * Runs shortly after mount so user never misses scheduled meal reminders or broadcasts.
 */
export function useAutoResubscribe() {
  const { isSupported, subscribe } = usePushNotifications();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current || !isSupported) return;

    const check = async () => {
      hasChecked.current = true;
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if current browser already has a subscription
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.ready;
          const currentSub = await reg.pushManager.getSubscription();

          if (!currentSub) {
            console.log('🔄 Auto-resubscribe: Notification permission granted but no browser subscription. Subscribing now...');
            await subscribe();
            return;
          }

          // Check if this specific endpoint is saved in DB for this user
          const { data: dbSub } = await supabase
            .from('push_subscriptions')
            .select('id')
            .eq('user_id', user.id)
            .eq('endpoint', currentSub.endpoint)
            .maybeSingle();

          if (!dbSub) {
            console.log('🔄 Auto-resubscribe: Browser subscription missing in DB for this user. Persisting now...');
            await subscribe();
          }
        }
      } catch (err) {
        console.warn('Auto-resubscribe check error:', err);
      }
    };

    const timer = setTimeout(check, 2500);
    return () => clearTimeout(timer);
  }, [isSupported, subscribe]);
}
