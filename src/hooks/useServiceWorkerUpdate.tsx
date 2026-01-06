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

    let updateCheckInterval: ReturnType<typeof setInterval>;

    const setupServiceWorker = async () => {
      try {
        // Wait for service worker to be ready (not just registered)
        const reg = await navigator.serviceWorker.ready;
        
        setRegistration(reg);
        console.log('✅ Service Worker ready:', reg);

        // Check if this is the initial installation
        const isInitialInstall = !navigator.serviceWorker.controller;
        
        if (isInitialInstall) {
          console.log('📦 Initial SW installation - app will work normally');
          // On initial install, just let Workbox do its thing
          // Don't try to force any updates or reloads
          return;
        }

        // Only check for updates after a delay and with safeguards
        const safeUpdateCheck = async () => {
          try {
            // Only update if SW is active and we have a controller
            if (reg.active && navigator.serviceWorker.controller) {
              console.log('🔍 Checking for updates...');
              await reg.update();
            }
          } catch (error: unknown) {
            // Silently handle InvalidStateError
            const err = error as { name?: string };
            if (err?.name === 'InvalidStateError') {
              console.log('⚠️ SW not ready for update check yet');
            } else {
              console.error('Error checking for updates:', error);
            }
          }
        };

        // Check for updates after 60 seconds (give app plenty of time to load)
        setTimeout(safeUpdateCheck, 60000);

        // Check for updates every 10 minutes
        updateCheckInterval = setInterval(safeUpdateCheck, 10 * 60 * 1000);

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
                duration: 15000,
              });
              
              // DO NOT auto-activate - let user choose when to update
              // This prevents white screen issues during critical moments
            }
          });
        });

        // DO NOT auto-reload on controllerchange
        // This was causing white screens when cache was in inconsistent state
        // Let the user manually refresh when they're ready

        // Handle waiting SW - show notification only, no auto-activate
        if (reg.waiting) {
          console.log('⚠️ SW already waiting');
          setNeedRefresh(true);
          
          toast({
            title: "Update Ready",
            description: "Refresh the page when you're ready to update.",
            duration: 15000,
          });
        }

      } catch (error) {
        console.error('❌ Error setting up service worker:', error);
      }
    };

    // Delay setup to ensure page is fully loaded and stable
    const timeoutId = setTimeout(setupServiceWorker, 2000);

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
        // Reload after a brief delay to let SW activate
        setTimeout(() => {
          window.location.reload();
        }, 500);
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
