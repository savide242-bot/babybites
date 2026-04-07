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
        localStorage.setItem('install_banner_dismissed', Date.now().toString());
      }
    }
  };

  if (isInstalled || isStandalone || dismissed) return null;

  const showForChrome = !!installPrompt;
  const showForIOS = isIOS;

  if (!showForChrome && !showForIOS) return null;

  return (
    <div className="fixed bottom-20 left-2 right-2 z-50 animate-fade-in lg:bottom-4 lg:left-auto lg:right-4 lg:max-w-sm">
      <div className="relative bg-gradient-to-r from-primary/95 to-accent/95 backdrop-blur-xl rounded-2xl shadow-2xl p-4 border border-white/20">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-white/20 text-white/80 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 pr-6">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-lg">
            <span className="text-2xl">🍼</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-white">Download BabyBites</p>
            <p className="text-xs text-white/80 mt-0.5">
              {isIOS
                ? 'Tap Share → "Add to Home Screen"'
                : 'Quick access & push notifications from your home screen'}
            </p>
          </div>
        </div>

        {showForChrome && (
          <Button
            onClick={handleInstall}
            size="sm"
            className="w-full mt-3 rounded-xl bg-white text-primary hover:bg-white/90 font-bold gap-2 shadow-lg h-11"
          >
            <Download className="w-4 h-4" />
            Install App — It's Free
          </Button>
        )}

        {isIOS && !showForChrome && (
          <div className="mt-3 flex items-center gap-2 text-xs text-white/90 bg-white/15 rounded-xl p-3">
            <Share className="w-5 h-5 shrink-0" />
            <span>Tap <strong>Share</strong> → <strong>Add to Home Screen</strong></span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartInstallBanner;
