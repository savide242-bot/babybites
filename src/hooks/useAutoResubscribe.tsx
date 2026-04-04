import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePushNotifications } from './usePushNotifications';

/**
 * Auto-resubscribe if permission is granted but no DB subscription exists.
 * Only runs once per mount, does NOT compete with the modal or other flows.
 */
export function useAutoResubscribe() {
  const { isSupported, subscribeToPushNotifications } = usePushNotifications();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current || !isSupported) return;

    const checkAndResubscribe = async () => {
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
          await subscribeToPushNotifications();
        }
      } catch {
        // Silently fail
      }
    };

    const timer = setTimeout(checkAndResubscribe, 3000);
    return () => clearTimeout(timer);
  }, [isSupported, subscribeToPushNotifications]);
}
