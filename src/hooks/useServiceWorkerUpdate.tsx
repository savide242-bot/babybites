import { useEffect, useState, useCallback } from 'react';
import { toast } from '@/components/ui/use-toast';

export const useServiceWorkerUpdate = () => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  const activateUpdate = useCallback((worker: ServiceWorker) => {
    console.log('🔄 Activating update...');
    worker.postMessage({ type: 'SKIP_WAITING' });
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Workers not supported');
      return;
    }

    let updateCheckInterval: NodeJS.Timeout;
    let isInitialInstall = false;

    const setupServiceWorker = async () => {
      try {
        // Wait for service worker to be ready (not just registered)
        const reg = await navigator.serviceWorker.ready;
        
        setRegistration(reg);
        console.log('✅ Service Worker ready:', reg);

        // Check if this is the initial installation
        isInitialInstall = !navigator.serviceWorker.controller;
        
        if (isInitialInstall) {
          console.log('📦 Initial SW installation - skipping aggressive update checks');
          return; // Don't do anything aggressive on first install
        }

        // Only check for updates after a delay and with safeguards
        const safeUpdateCheck = async () => {
          try {
            // Only update if SW is active and we have a controller
            if (reg.active && navigator.serviceWorker.controller) {
              console.log('🔍 Checking for updates...');
              await reg.update();
            }
          } catch (error: any) {
            // Silently handle InvalidStateError
            if (error?.name === 'InvalidStateError') {
              console.log('⚠️ SW not ready for update check yet');
            } else {
              console.error('Error checking for updates:', error);
            }
          }
        };

        // Check for updates after 30 seconds (give app time to load)
        setTimeout(safeUpdateCheck, 30000);

        // Check for updates every 5 minutes (not every 10 seconds!)
        updateCheckInterval = setInterval(safeUpdateCheck, 5 * 60 * 1000);

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
              
              // Show toast notification - let user decide when to update
              toast({
                title: "Update Available",
                description: "A new version is ready. Refresh to update.",
                duration: 10000,
              });
              
              // Auto-activate after 10 seconds for smoother experience
              setTimeout(() => {
                if (newWorker.state === 'installed') {
                  activateUpdate(newWorker);
                }
              }, 10000);
            }
          });
        });

        // Listen for controller change (new SW took over)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('🔄 Controller changed, reloading...');
          window.location.reload();
        });

        // Handle waiting SW - but only if we're not in initial install
        if (reg.waiting && !isInitialInstall) {
          console.log('⚠️ SW already waiting');
          setNeedRefresh(true);
          
          // Give user a chance to see the app before reloading
          toast({
            title: "Update Ready",
            description: "Click refresh or wait 10 seconds to update.",
            duration: 10000,
          });
          
          setTimeout(() => {
            if (reg.waiting) {
              reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
          }, 10000);
        }

      } catch (error) {
        console.error('❌ Error setting up service worker:', error);
      }
    };

    // Delay setup slightly to ensure page is fully loaded
    const timeoutId = setTimeout(setupServiceWorker, 1000);

    return () => {
      clearTimeout(timeoutId);
      if (updateCheckInterval) {
        clearInterval(updateCheckInterval);
      }
    };
  }, [activateUpdate]);

  const forceUpdate = useCallback(async () => {
    if (registration) {
      const newWorker = registration.waiting || registration.installing;
      if (newWorker) {
        activateUpdate(newWorker);
      } else {
        try {
          await registration.update();
          toast({
            title: "Checking for Updates",
            description: "Looking for new version...",
          });
        } catch (error) {
          console.error('Update check failed:', error);
        }
      }
    }
  }, [registration, activateUpdate]);

  return {
    needRefresh,
    forceUpdate
  };
};
