import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePushNotifications } from './usePushNotifications';

/**
 * Hook that auto-resubscribes to push notifications if:
 * 1. Browser has permission granted
 * 2. But no subscription exists in database
 * 
 * This handles cases where subscription expired or was lost.
 */
export function useAutoResubscribe() {
  const { isSupported, subscribeToPushNotifications } = usePushNotifications();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    if (!isSupported) return;
    
    const checkAndResubscribe = async () => {
      hasChecked.current = true;
      
      // Only proceed if permission was previously granted
      if (Notification.permission !== 'granted') {
        return;
      }
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        // Check if user has active subscription in database
        const { count } = await supabase
          .from('push_subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        
        if (count === 0) {
          // Permission granted but no subscription - auto-resubscribe
          console.log('🔄 Auto-resubscribing: permission granted but no subscription found');
          await subscribeToPushNotifications();
        }
      } catch (error) {
        console.error('Auto-resubscribe check failed:', error);
      }
    };
    
    // Small delay to not block initial render
    const timer = setTimeout(checkAndResubscribe, 2000);
    return () => clearTimeout(timer);
  }, [isSupported, subscribeToPushNotifications]);
}
