import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePushNotifications } from './usePushNotifications';

/**
 * Auto-resubscribe ONLY if permission is already granted AND no DB subscription exists.
 * Runs once, 5s after mount. Does NOT compete with modal or manual flows.
 */
export function useAutoResubscribe() {
  const { isSupported, subscribeToPushNotifications, pushState } = usePushNotifications();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current || !isSupported) return;
    // Don't auto-resubscribe if another flow is already running
    if (pushState !== 'idle' && pushState !== 'ready') return;

    const check = async () => {
      hasChecked.current = true;
      if (Notification.permission !== 'granted') return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { count } = await supabase
          .from('push_subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        if (count === 0) {
          console.log('🔄 Auto-resubscribe: no backend sub found, re-subscribing...');
          await subscribeToPushNotifications();
        }
      } catch { /* silent */ }
    };

    const timer = setTimeout(check, 5000);
    return () => clearTimeout(timer);
  }, [isSupported, pushState]);
}
