import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

// Fetch VAPID public key from edge function
const fetchVapidPublicKey = async (): Promise<string | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('get-vapid-key');
    
    if (error) {
      console.error('Error fetching VAPID key:', error);
      return null;
    }
    
    return data?.vapidPublicKey || null;
  } catch (error) {
    console.error('Error in fetchVapidPublicKey:', error);
    return null;
  }
};

export const usePushNotifications = () => {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if push notifications are supported
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    setIsSupported(supported);

    if (supported) {
      checkExistingSubscription();
    }
  }, []);

  const checkExistingSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSub = await registration.pushManager.getSubscription();
      
      if (existingSub) {
        setSubscription(existingSub);
      }
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const subscribeToPushNotifications = async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in your browser.",
        variant: "destructive"
      });
      return false;
    }

    try {
      // Request notification permission
      const permission = await Notification.requestPermission();
      
      if (permission !== 'granted') {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications to receive updates.",
          variant: "destructive"
        });
        return false;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Fetch VAPID key from edge function
      const vapidKey = await fetchVapidPublicKey();
      if (!vapidKey) {
        console.warn('VAPID_PUBLIC_KEY not available from edge function');
        toast({
          title: "Configuration Required",
          description: "Push notifications require VAPID keys to be configured.",
          variant: "destructive"
        });
        return false;
      }

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as any
      });

      setSubscription(sub);

      // Save subscription to database
      await saveSubscription(sub);

      toast({
        title: "✅ Push Notifications Enabled",
        description: "You'll be notified when updates are available!",
      });

      return true;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      toast({
        title: "Subscription Failed",
        description: "Could not enable push notifications.",
        variant: "destructive"
      });
      return false;
    }
  };

  const saveSubscription = async (sub: PushSubscription) => {
    try {
      console.log('💾 Starting saveSubscription...');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('⚠️ No user found, cannot save subscription');
        return;
      }
      console.log('👤 User ID:', user.id);

      const p256dh = sub.getKey('p256dh');
      const auth = sub.getKey('auth');

      const subscriptionData = {
        user_id: user.id,
        endpoint: sub.endpoint,
        keys: {
          p256dh: p256dh ? arrayBufferToBase64(p256dh) : '',
          auth: auth ? arrayBufferToBase64(auth) : ''
        }
      };

      console.log('📦 Subscription data prepared:', {
        user_id: subscriptionData.user_id,
        endpoint: subscriptionData.endpoint.substring(0, 50) + '...',
        has_p256dh: !!subscriptionData.keys.p256dh,
        has_auth: !!subscriptionData.keys.auth
      });

      // Save to push_subscriptions table
      const { data, error } = await supabase
        .from('push_subscriptions')
        .upsert(subscriptionData, { 
          onConflict: 'endpoint',
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        console.error('❌ Error saving subscription to database:', error);
        throw error;
      }
      
      console.log('✅ Push subscription saved successfully:', data);
    } catch (error) {
      console.error('💥 Error in saveSubscription:', error);
      throw error;
    }
  };

  const unsubscribeFromPushNotifications = async () => {
    if (!subscription) return;

    try {
      await subscription.unsubscribe();
      setSubscription(null);

      toast({
        title: "Unsubscribed",
        description: "You won't receive push notifications anymore.",
      });
    } catch (error) {
      console.error('Error unsubscribing:', error);
    }
  };

  return {
    isSupported,
    subscription,
    subscribeToPushNotifications,
    unsubscribeFromPushNotifications
  };
};

// Helper functions
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
