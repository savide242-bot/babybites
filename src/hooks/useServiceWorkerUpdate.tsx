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

    // Check for existing service worker
    const checkServiceWorker = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          setRegistration(reg);
          console.log('Service Worker found:', reg);

          // Check for updates immediately
          await reg.update();

          // Check for updates every 60 seconds
          const interval = setInterval(async () => {
            try {
              await reg.update();
            } catch (error) {
              console.error('Error checking for updates:', error);
            }
          }, 60000);

          // Listen for updates
          reg.addEventListener('updatefound', () => {
            const newWorker = reg.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available
                setNeedRefresh(true);
                
                toast({
                  title: "🎉 Update Available!",
                  description: "A new version of BabyBites is ready. Updating now...",
                  duration: 3000,
                });

                // Auto-update after 2 seconds
                setTimeout(() => {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }, 2000);
              }
            });
          });

          // Listen for controller change (new SW activated)
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
          });

          return () => clearInterval(interval);
        }
      } catch (error) {
        console.error('Error checking service worker:', error);
      }
    };

    checkServiceWorker();
  }, []);

  const forceUpdate = async () => {
    if (registration) {
      const newWorker = registration.waiting || registration.installing;
      if (newWorker) {
        newWorker.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    }
  };

  return {
    needRefresh,
    forceUpdate
  };
};
