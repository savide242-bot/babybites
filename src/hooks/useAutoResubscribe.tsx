import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePushNotifications } from './usePushNotifications';

/**
 * Auto-resubscribe if permission is granted but no DB subscription exists.
 * Runs once, 5s after mount.
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
        const { count } = await supabase
          .from('push_subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        if (count === 0) {
          console.log('🔄 Auto-resubscribe: no DB sub found, re-subscribing...');
          await subscribe();
        }
      } catch { /* silent */ }
    };

    const timer = setTimeout(check, 5000);
    return () => clearTimeout(timer);
  }, [isSupported, subscribe]);
}
