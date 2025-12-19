import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

// Fetch VAPID public key from edge function
const fetchVapidPublicKey = async (): Promise<string | null> => {
  try {
    console.log('🔑 Fetching VAPID public key...');
    const { data, error } = await supabase.functions.invoke('get-vapid-key');

    if (error) {
      console.error('❌ Error fetching VAPID key:', error);
      return null;
    }

    if (!data?.vapidPublicKey) {
      console.error('❌ No VAPID key in response:', data);
      return null;
    }

    console.log('✅ VAPID key received, length:', data.vapidPublicKey.length);
    return data.vapidPublicKey;
  } catch (error) {
    console.error('💥 Error in fetchVapidPublicKey:', error);
    return null;
  }
};

export const usePushNotifications = () => {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);
    console.log('📱 Push notifications supported:', supported);

    if (supported) {
      checkExistingSubscription();
    }
  }, []);

  const checkExistingSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const existingSub = await registration.pushManager.getSubscription();

      if (existingSub) {
        console.log('✅ Found existing push subscription');
        setSubscription(existingSub);
        // Ensure it's saved to database
        await saveSubscription(existingSub);
      } else {
        console.log('📭 No existing push subscription found');
      }
    } catch (error) {
      console.error('❌ Error checking subscription:', error);
    }
  };

  const subscribeToPushNotifications = async (): Promise<boolean> => {
    console.log('🔔 Starting push notification subscription...');

    if (!isSupported) {
      console.error('❌ Push notifications not supported');
      toast({
        title: "Not Supported",
        description: "Push notifications are not supported in your browser.",
        variant: "destructive"
      });
      return false;
    }

    try {
      // Step 1: Request notification permission
      console.log('🔐 Requesting notification permission...');
      const permission = await Notification.requestPermission();
      console.log('🔐 Permission result:', permission);

      if (permission !== 'granted') {
        toast({
          title: "Permission Denied",
          description: "Please enable notifications in your browser settings to receive meal reminders.",
          variant: "destructive"
        });
        return false;
      }

      // Step 2: Get service worker registration
      console.log('⚙️ Getting service worker registration...');
      const registration = await navigator.serviceWorker.ready;
      console.log('✅ Service worker ready');

      // Step 3: ALWAYS unsubscribe existing and create new subscription
      // This ensures we're using the current VAPID key
      const existingSub = await registration.pushManager.getSubscription();
      if (existingSub) {
        console.log('🔄 Unsubscribing from old subscription to ensure fresh key...');
        await existingSub.unsubscribe();
      }

      // Step 4: Fetch VAPID key from edge function
      console.log('🔑 Fetching VAPID key...');
      const vapidKey = await fetchVapidPublicKey();

      if (!vapidKey) {
        console.error('❌ Failed to get VAPID key');
        toast({
          title: "Configuration Error",
          description: "Could not configure push notifications. Please try again later.",
          variant: "destructive"
        });
        return false;
      }

      // Step 5: Create NEW push subscription with current VAPID key
      console.log('📱 Creating new push subscription with current VAPID key...');
      let sub: PushSubscription;
      try {
        const applicationServerKey = urlBase64ToUint8Array(vapidKey);
        sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey.buffer as ArrayBuffer
        });
        console.log('✅ Push subscription created successfully');
        console.log('📍 Endpoint:', sub.endpoint.substring(0, 60) + '...');
      } catch (subscribeError) {
        console.error('❌ Push subscribe failed:', subscribeError);
        toast({
          title: "Subscription Failed",
          description: subscribeError instanceof Error ? subscribeError.message : "Could not enable push notifications.",
          variant: "destructive"
        });
        return false;
      }

      setSubscription(sub);

      // Step 6: Save subscription to database
      console.log('💾 Saving subscription to database...');
      const saved = await saveSubscription(sub);

      if (!saved) {
        console.error('❌ Failed to save subscription to database');
        toast({
          title: "Save Failed",
          description: "Could not save notification settings. Please try again.",
          variant: "destructive"
        });
        return false;
      }

      console.log('🎉 Push notification subscription complete!');
      toast({
        title: "Notifications Enabled",
        description: "You'll receive meal reminders at your scheduled times!",
      });

      return true;
    } catch (error) {
      console.error('💥 Error in subscribeToPushNotifications:', error);
      toast({
        title: "Error",
        description: "Could not enable push notifications. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  };

  const saveSubscription = async (sub: PushSubscription): Promise<boolean> => {
    try {
      console.log('💾 Starting saveSubscription...');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('⚠️ No user found, cannot save subscription');
        return false;
      }
      console.log('👤 User ID:', user.id);

      const p256dh = sub.getKey('p256dh');
      const auth = sub.getKey('auth');

      if (!p256dh || !auth) {
        console.error('❌ Missing encryption keys from subscription');
        return false;
      }

      const subscriptionData = {
        user_id: user.id,
        endpoint: sub.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(p256dh),
          auth: arrayBufferToBase64(auth)
        }
      };

      console.log('📦 Subscription data:', {
        user_id: subscriptionData.user_id,
        endpoint: subscriptionData.endpoint.substring(0, 60) + '...',
        p256dh_length: subscriptionData.keys.p256dh.length,
        auth_length: subscriptionData.keys.auth.length
      });

      // Delete any existing subscription for this user
      const { error: deleteError } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) {
        console.warn('⚠️ Could not delete old subscription:', deleteError);
      }

      // Insert new subscription
      const { data, error } = await supabase
        .from('push_subscriptions')
        .insert(subscriptionData)
        .select();

      if (error) {
        console.error('❌ Database insert error:', error);
        return false;
      }

      console.log('✅ Push subscription saved to database:', data);
      return true;
    } catch (error) {
      console.error('💥 Error in saveSubscription:', error);
      return false;
    }
  };

  const unsubscribeFromPushNotifications = async () => {
    if (!subscription) return;

    try {
      await subscription.unsubscribe();
      setSubscription(null);

      // Remove from database
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id);
      }

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
    .replace(/-/g, '+')
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
