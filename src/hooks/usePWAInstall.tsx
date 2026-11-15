import { useState, useEffect, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const usePWAInstall = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    return (typeof window !== 'undefined' && (window as any).__pwaInstallPrompt) || null;
  });
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const checkIfInstalled = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true ||
        document.referrer.includes('android-app://') ||
        localStorage.getItem('babybites_pwa_installed') === 'true';
      setIsInstalled(isStandalone);
      return isStandalone;
    };

    checkIfInstalled();

    if ((window as any).__pwaInstallPrompt) {
      setInstallPrompt((window as any).__pwaInstallPrompt);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      (window as any).__pwaInstallPrompt = e;
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const handleCustomPrompt = (e: any) => {
      if (e.detail) {
        setInstallPrompt(e.detail);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      (window as any).__pwaInstallPrompt = null;
      try {
        localStorage.setItem('babybites_pwa_installed', 'true');
      } catch (err) {
        console.warn('Could not store install state:', err);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('pwa-prompt-available', handleCustomPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('pwa-prompt-available', handleCustomPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptToInstall = useCallback(async (): Promise<boolean> => {
    const prompt = installPrompt || (window as any).__pwaInstallPrompt;
    if (!prompt) return false;

    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setInstallPrompt(null);
        (window as any).__pwaInstallPrompt = null;
        try {
          localStorage.setItem('babybites_pwa_installed', 'true');
        } catch {}
        return true;
      }
      return false;
    } catch (err) {
      console.warn('PWA install prompt error:', err);
      return false;
    }
  }, [installPrompt]);

  return { installPrompt, isInstalled, promptToInstall };
};
