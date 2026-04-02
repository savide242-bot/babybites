import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Share } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

const SmartInstallBanner = () => {
  const { installPrompt, isInstalled } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);
    setIsStandalone(
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );

    const wasDismissed = localStorage.getItem('install_banner_dismissed');
    if (wasDismissed) {
      const dismissedAt = parseInt(wasDismissed, 10);
      // Show again after 3 days
      if (Date.now() - dismissedAt < 3 * 24 * 60 * 60 * 1000) {
        setDismissed(true);
      }
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('install_banner_dismissed', Date.now().toString());
  };

  const handleInstall = async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === 'accepted') {
        setDismissed(true);
      }
    }
  };

  // Don't show if already installed, dismissed, or in standalone mode
  if (isInstalled || isStandalone || dismissed) return null;

  // Show only if we have a Chrome install prompt OR if on iOS Safari
  const showForChrome = !!installPrompt;
  const showForIOS = isIOS;

  if (!showForChrome && !showForIOS) return null;

  return (
    <div className="fixed bottom-20 left-3 right-3 z-50 animate-fade-in lg:bottom-4 lg:left-auto lg:right-4 lg:max-w-sm">
      <div className="relative bg-card border border-border/60 rounded-2xl shadow-xl p-4">
        <button
          onClick={handleDismiss}
          className="absolute top-2.5 right-2.5 p-1 rounded-full hover:bg-muted/80 text-muted-foreground"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 pr-6">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
            <span className="text-xl">🍼</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground">Install BabyBites</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isIOS
                ? 'Tap the share button below, then "Add to Home Screen"'
                : 'Get meal reminders and quick access from your home screen'}
            </p>
          </div>
        </div>

        {showForChrome && (
          <Button
            onClick={handleInstall}
            size="sm"
            className="w-full mt-3 rounded-xl bg-gradient-to-r from-primary to-accent text-white gap-2"
          >
            <Download className="w-4 h-4" />
            Add to Home Screen
          </Button>
        )}

        {isIOS && !showForChrome && (
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-xl p-2.5">
            <Share className="w-4 h-4 shrink-0 text-primary" />
            <span>Tap <strong>Share</strong> → <strong>Add to Home Screen</strong></span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartInstallBanner;
