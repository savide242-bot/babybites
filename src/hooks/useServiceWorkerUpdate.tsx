import { useEffect, useState } from 'react';
import { toast } from '@/components/ui/use-toast';

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

          newWorker.addEventListener('statechange', () => {
            console.log(`SW state: ${newWorker.state}`);
            
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🎉 New version available!');
              setNeedRefresh(true);
              
              toast({
                title: "🎉 Update Available!",
                description: "Updating BabyBites now...",
                duration: 2000,
              });

              // Force skip waiting immediately
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              
              // Reload after 1 second
              setTimeout(() => {
                console.log('🔄 Reloading page...');
                window.location.reload();
              }, 1000);
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

  const forceUpdate = async () => {
    if (registration) {
      const newWorker = registration.waiting || registration.installing;
      if (newWorker) {
        newWorker.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
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
