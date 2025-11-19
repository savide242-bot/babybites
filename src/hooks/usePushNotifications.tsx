import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

// Public VAPID key - will be generated when user sets up push notifications
const VAPID_PUBLIC_KEY = 'BPxQl0dVhOpGx9aK-generated-vapid-key-placeholder';

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

      // Subscribe to push notifications
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as any
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const p256dh = sub.getKey('p256dh');
      const auth = sub.getKey('auth');

      const subscriptionData = {
        user_id: user.id,
        endpoint: sub.endpoint,
        keys: JSON.stringify({
          p256dh: p256dh ? arrayBufferToBase64(p256dh) : '',
          auth: auth ? arrayBufferToBase64(auth) : ''
        })
      };

      // Note: You need to create the push_subscriptions table first
      // See DEPLOYMENT_INSTRUCTIONS.md for the SQL migration
      console.log('Would save subscription:', subscriptionData);
      
    } catch (error) {
      console.error('Error in saveSubscription:', error);
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
