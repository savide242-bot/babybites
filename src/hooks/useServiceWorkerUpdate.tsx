import { useEffect, useState, useCallback } from 'react';

export const useServiceWorkerUpdate = () => {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  const activateUpdate = useCallback((worker: ServiceWorker) => {
    console.log('🔄 Auto-activating update...');
    worker.postMessage({ type: 'SKIP_WAITING' });
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let updateCheckInterval: ReturnType<typeof setInterval>;

    const setupServiceWorker = async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        setRegistration(reg);

        const isInitialInstall = !navigator.serviceWorker.controller;
        if (isInitialInstall) return;

        const safeUpdateCheck = async () => {
          try {
            if (reg.active && navigator.serviceWorker.controller) {
              await reg.update();
            }
          } catch (error: unknown) {
            const err = error as { name?: string };
            if (err?.name !== 'InvalidStateError') {
              console.error('Update check failed:', error);
            }
          }
        };

        // Check sooner (10s) and more frequently (every 2 min)
        setTimeout(safeUpdateCheck, 10000);
        updateCheckInterval = setInterval(safeUpdateCheck, 2 * 60 * 1000);

        // Also check immediately when coming back online
        const onOnline = () => {
          console.log('🌐 Back online — checking for updates...');
          safeUpdateCheck();
        };
        window.addEventListener('online', onOnline);

        // Auto-activate new service worker as soon as it's installed
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🎉 New version installed — auto-activating...');
              setNeedRefresh(true);
              activateUpdate(newWorker);
            }
          });
        });

        // Auto-reload when new SW takes control
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('🔄 New SW active — reloading...');
          window.location.reload();
        });

        // Handle already-waiting SW
        if (reg.waiting) {
          console.log('⚠️ SW already waiting — auto-activating...');
          setNeedRefresh(true);
          activateUpdate(reg.waiting);
        }
      } catch (error) {
        console.error('❌ SW setup error:', error);
      }
    };

    const timeoutId = setTimeout(setupServiceWorker, 2000);

    return () => {
      clearTimeout(timeoutId);
      if (updateCheckInterval) clearInterval(updateCheckInterval);
      window.removeEventListener('online', () => {});
    };
  }, [activateUpdate]);

  const forceUpdate = useCallback(async () => {
    if (registration) {
      const newWorker = registration.waiting || registration.installing;
      if (newWorker) {
        activateUpdate(newWorker);
        setTimeout(() => window.location.reload(), 500);
      } else {
        try {
          await registration.update();
        } catch (error) {
          console.error('Update check failed:', error);
        }
      }
    }
  }, [registration, activateUpdate]);

  return { needRefresh, forceUpdate };
};
