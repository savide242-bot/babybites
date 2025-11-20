import { useEffect, useState } from 'react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useServiceWorkerUpdate = () => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Workers not supported');
      return;
    }

    let updateCheckInterval: NodeJS.Timeout;

    const setupServiceWorker = async () => {
      try {
        // Register with updateViaCache: 'none' to prevent HTTP caching
        const reg = await navigator.serviceWorker.register('/sw.js', {
          updateViaCache: 'none'
        });
        
        setRegistration(reg);
        console.log('✅ Service Worker registered:', reg);

        // Check for updates immediately
        await reg.update();

        // Check for updates every 10 seconds (aggressive)
        updateCheckInterval = setInterval(async () => {
          try {
            console.log('🔍 Checking for updates...');
            await reg.update();
          } catch (error) {
            console.error('Error checking for updates:', error);
          }
        }, 10000);

        // Listen for new service worker installation
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          console.log('📦 New service worker found, installing...');

          newWorker.addEventListener('statechange', async () => {
            console.log(`SW state: ${newWorker.state}`);
            
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🎉 New version available!');
              setNeedRefresh(true);
              
              // Try to show native notification first
              if (Notification.permission === 'granted') {
                await showNativeUpdateNotification(newWorker);
              } else {
                // Fallback to in-app toast
                toast({
                  title: "🎉 Update Available!",
                  description: "A new version is ready. Click 'Update Now' to install.",
                  duration: 0,
                });
                
                // Auto-activate after 3 seconds
                setTimeout(() => activateUpdate(newWorker), 3000);
              }
            }
          });
        });

        // Listen for controller change
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('🔄 Controller changed, reloading...');
          window.location.reload();
        });

        // Check if there's already a waiting SW
        if (reg.waiting) {
          console.log('⚠️ SW already waiting, activating now...');
          reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          window.location.reload();
        }

      } catch (error) {
        console.error('❌ Error setting up service worker:', error);
      }
    };

    setupServiceWorker();

    return () => {
      if (updateCheckInterval) {
        clearInterval(updateCheckInterval);
      }
    };
  }, []);

  const showNativeUpdateNotification = async (newWorker: ServiceWorker) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = user ? await supabase
        .from('profiles')
        .select('mother_name')
        .eq('id', user.id)
        .single() : { data: null };

      const motherName = profile?.mother_name || 'there';

      const notification = new Notification("🎉 BabyBites Update Available!", {
        body: `Hi ${motherName}! A new version is ready. Click to update now.`,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: 'app-update',
        requireInteraction: true
      });

      notification.onclick = () => {
        activateUpdate(newWorker);
        notification.close();
        window.focus();
      };
    } catch (error) {
      console.error('Error showing native notification:', error);
      // Fallback to toast
      toast({
        title: "🎉 Update Available!",
        description: "A new version is ready. Reloading in 3 seconds...",
      });
      setTimeout(() => activateUpdate(newWorker), 3000);
    }
  };

  const activateUpdate = (worker: ServiceWorker) => {
    console.log('🔄 Activating update...');
    worker.postMessage({ type: 'SKIP_WAITING' });
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const forceUpdate = async () => {
    if (registration) {
      const newWorker = registration.waiting || registration.installing;
      if (newWorker) {
        activateUpdate(newWorker);
      } else {
        // Force check for updates
        await registration.update();
        toast({
          title: "Checking for Updates",
          description: "Looking for new version...",
        });
      }
    }
  };

  return {
    needRefresh,
    forceUpdate
  };
};
