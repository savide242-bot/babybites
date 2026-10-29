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
    let cleanupListeners: (() => void) | null = null;

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
          } catch {
            // Silently swallow update check errors from proxy/redirects
          }
        };

        // Check periodically — 5 min interval
        setTimeout(safeUpdateCheck, 2000);
        updateCheckInterval = setInterval(safeUpdateCheck, 5 * 60 * 1000);

        // Check immediately when coming back online
        const onOnline = () => {
          console.log('🌐 Back online — checking for updates...');
          safeUpdateCheck();
        };
        window.addEventListener('online', onOnline);

        // Check for updates whenever app resumes from background or screen turns on (Mobile PWA)
        const onVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
            console.log('📱 PWA resumed into view — checking for updates...');
            safeUpdateCheck();
          }
        };
        const onFocus = () => {
          safeUpdateCheck();
        };
        document.addEventListener('visibilitychange', onVisibilityChange);
        window.addEventListener('focus', onFocus);

        cleanupListeners = () => {
          window.removeEventListener('online', onOnline);
          document.removeEventListener('visibilitychange', onVisibilityChange);
          window.removeEventListener('focus', onFocus);
        };

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
          console.log('🔄 New SW active — reloading app...');
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
      if (cleanupListeners) cleanupListeners();
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
