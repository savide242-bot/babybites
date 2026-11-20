import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  X, 
  Download, 
  Share, 
  Smartphone, 
  Laptop, 
  Sparkles, 
  CheckCircle2, 
  PlusSquare,
  ArrowRight
} from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export const SmartInstallBanner: React.FC = () => {
  const { installPrompt, isInstalled, promptToInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(true); // default true until verified
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    // 1. Detect environment
    const ua = navigator.userAgent || '';
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isAndroidDevice = /Android/i.test(ua);

    if (isIOSDevice) {
      setDeviceType('ios');
    } else if (isAndroidDevice) {
      setDeviceType('android');
    } else {
      setDeviceType('desktop');
    }

    // 2. Check if running in standalone mode (already installed as PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://') ||
      localStorage.getItem('babybites_pwa_installed') === 'true';

    if (isStandalone) {
      setDismissed(true);
      return;
    }

    // 3. Check dismissal memory (24h cooldown if user explicitly closes it)
    const wasDismissed = localStorage.getItem('babybites_install_banner_dismissed_v2');
    if (wasDismissed) {
      const dismissedAt = parseInt(wasDismissed, 10);
      if (Date.now() - dismissedAt < 24 * 60 * 60 * 1000) {
        setDismissed(true);
        return;
      }
    }

    // User is on web and hasn't dismissed it in the last 24h
    setDismissed(false);
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    try {
      localStorage.setItem('babybites_install_banner_dismissed_v2', Date.now().toString());
    } catch {}
  };

  const handleActionClick = async () => {
    // Attempt native browser prompt first if supported
    if (installPrompt) {
      const accepted = await promptToInstall();
      if (accepted) {
        toast.success("🎉 BabyBites added to your Home Screen!");
        setDismissed(true);
        return;
      }
    }

    // If native prompt is not directly triggerable (iOS Safari, blocked browser, or cancelled),
    // open the interactive step-by-step visual instruction guide!
    setShowGuideModal(true);
  };

  if (isInstalled || dismissed) {
    return (
      <InstallGuideDialog 
        open={showGuideModal} 
        onOpenChange={setShowGuideModal} 
        deviceType={deviceType} 
      />
    );
  }

  return (
    <>
      {/* SLEEK FLOATING PWA INSTALL BANNER */}
      <aside 
        aria-label="Install BabyBites"
        className="fixed bottom-[74px] sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:w-[380px] z-50 animate-in fade-in slide-in-from-bottom-5 duration-300 font-sans"
      >
        <div className="relative rounded-2xl bg-[#0F172A] border border-slate-800 text-white p-4 sm:p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-md">
          
          {/* Close 'X' button */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Close"
            className="absolute top-3.5 right-3.5 w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Top row: App Icon + Titles */}
          <div className="flex items-start gap-3.5 pr-6">
            {/* App Icon badge matching reference */}
            <div className="w-13 h-13 rounded-2xl bg-emerald-500 p-2 flex items-center justify-center shrink-0 shadow-md">
              <img 
                src="/logo.png" 
                alt="BabyBites" 
                className="w-full h-full object-contain"
                loading="eager"
              />
            </div>

            {/* Text content */}
            <div className="min-w-0 pt-0.5">
              <h3 className="font-bold text-base sm:text-lg text-white leading-tight">
                Install BabyBites
              </h3>
              <p className="text-xs sm:text-[13px] text-slate-400 mt-1 leading-snug">
                Access faster by adding to home screen
              </p>
            </div>
          </div>

          {/* Bottom row: Install button + 'Not now' */}
          <div className="mt-4 pt-1 flex items-center gap-3">
            <Button
              type="button"
              size="sm"
              onClick={handleActionClick}
              className="rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm px-7 h-10 shadow-sm transition-all active:scale-95"
            >
              Install
            </Button>

            <button
              type="button"
              onClick={handleDismiss}
              className="text-slate-400 hover:text-white text-sm font-medium px-2 py-2 transition-colors cursor-pointer"
            >
              Not now
            </button>
          </div>
        </div>
      </aside>

      {/* STEP-BY-STEP VISUAL INSTRUCTION MODAL */}
      <InstallGuideDialog 
        open={showGuideModal} 
        onOpenChange={setShowGuideModal} 
        deviceType={deviceType} 
      />
    </>
  );
};

interface InstallGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceType: 'ios' | 'android' | 'desktop';
}

const InstallGuideDialog: React.FC<InstallGuideProps> = ({ open, onOpenChange, deviceType }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 rounded-[28px] border border-[#EBE8DF] bg-[#FAF9F5] dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xl font-sans">
        <DialogHeader className="text-center space-y-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-white dark:bg-stone-800 p-2 border border-[#EBE8DF] dark:border-stone-700 shadow-sm flex items-center justify-center">
            <img src="/logo.png" alt="BabyBites" className="w-full h-full object-contain" />
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-times font-bold text-stone-950 dark:text-stone-50">
            How to Add BabyBites
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-stone-600 dark:text-stone-300">
            Follow these 3 quick steps on your device to enjoy the full app experience:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          {deviceType === 'ios' && (
            <>
              <div className="flex items-start gap-3 p-3 bg-white dark:bg-stone-800 rounded-xl border border-[#EBE8DF] dark:border-stone-700 shadow-2xs">
                <div className="w-7 h-7 rounded-full bg-[#EAF5EE] dark:bg-emerald-950 text-[#1E5E3A] dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div className="text-xs text-stone-800 dark:text-stone-200">
                  <span className="font-bold block text-sm mb-0.5">Tap the Share Button</span>
                  In Safari, tap the <strong>Share</strong> button <Share className="w-3.5 h-3.5 inline mx-1 text-blue-600" /> at the bottom of your screen.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white dark:bg-stone-800 rounded-xl border border-[#EBE8DF] dark:border-stone-700 shadow-2xs">
                <div className="w-7 h-7 rounded-full bg-[#EAF5EE] dark:bg-emerald-950 text-[#1E5E3A] dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div className="text-xs text-stone-800 dark:text-stone-200">
                  <span className="font-bold block text-sm mb-0.5">Select "Add to Home Screen"</span>
                  Scroll down the share menu and tap <strong>Add to Home Screen</strong> <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-stone-700 dark:text-stone-300" />.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white dark:bg-stone-800 rounded-xl border border-[#EBE8DF] dark:border-stone-700 shadow-2xs">
                <div className="w-7 h-7 rounded-full bg-[#EAF5EE] dark:bg-emerald-950 text-[#1E5E3A] dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <div className="text-xs text-stone-800 dark:text-stone-200">
                  <span className="font-bold block text-sm mb-0.5">Confirm &amp; Enjoy</span>
                  Tap <strong>Add</strong> in the top-right corner. BabyBites will appear directly on your phone screen!
                </div>
              </div>
            </>
          )}

          {deviceType === 'android' && (
            <>
              <div className="flex items-start gap-3 p-3 bg-white dark:bg-stone-800 rounded-xl border border-[#EBE8DF] dark:border-stone-700 shadow-2xs">
                <div className="w-7 h-7 rounded-full bg-[#EAF5EE] dark:bg-emerald-950 text-[#1E5E3A] dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div className="text-xs text-stone-800 dark:text-stone-200">
                  <span className="font-bold block text-sm mb-0.5">Tap the Browser Menu</span>
                  Tap the three dots <strong>(⋮)</strong> in the top-right corner of Chrome or your browser.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white dark:bg-stone-800 rounded-xl border border-[#EBE8DF] dark:border-stone-700 shadow-2xs">
                <div className="w-7 h-7 rounded-full bg-[#EAF5EE] dark:bg-emerald-950 text-[#1E5E3A] dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div className="text-xs text-stone-800 dark:text-stone-200">
                  <span className="font-bold block text-sm mb-0.5">Select "Install App"</span>
                  Tap <strong>Install app</strong> or <strong>Add to Home screen</strong> in the menu.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white dark:bg-stone-800 rounded-xl border border-[#EBE8DF] dark:border-stone-700 shadow-2xs">
                <div className="w-7 h-7 rounded-full bg-[#EAF5EE] dark:bg-emerald-950 text-[#1E5E3A] dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <div className="text-xs text-stone-800 dark:text-stone-200">
                  <span className="font-bold block text-sm mb-0.5">Confirm Installation</span>
                  Tap <strong>Install</strong> to add BabyBites to your app drawer and home screen.
                </div>
              </div>
            </>
          )}

          {deviceType === 'desktop' && (
            <>
              <div className="flex items-start gap-3 p-3 bg-white dark:bg-stone-800 rounded-xl border border-[#EBE8DF] dark:border-stone-700 shadow-2xs">
                <div className="w-7 h-7 rounded-full bg-[#EAF5EE] dark:bg-emerald-950 text-[#1E5E3A] dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                  1
                </div>
                <div className="text-xs text-stone-800 dark:text-stone-200">
                  <span className="font-bold block text-sm mb-0.5">Locate the Address Bar</span>
                  Look at the right side of your browser's address bar at the top of the window.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white dark:bg-stone-800 rounded-xl border border-[#EBE8DF] dark:border-stone-700 shadow-2xs">
                <div className="w-7 h-7 rounded-full bg-[#EAF5EE] dark:bg-emerald-950 text-[#1E5E3A] dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                  2
                </div>
                <div className="text-xs text-stone-800 dark:text-stone-200">
                  <span className="font-bold block text-sm mb-0.5">Click the Install Icon</span>
                  Click the <strong>Install [⊕]</strong> icon or <strong>Computer icon</strong> in the address bar.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-white dark:bg-stone-800 rounded-xl border border-[#EBE8DF] dark:border-stone-700 shadow-2xs">
                <div className="w-7 h-7 rounded-full bg-[#EAF5EE] dark:bg-emerald-950 text-[#1E5E3A] dark:text-emerald-300 flex items-center justify-center font-bold text-xs shrink-0">
                  3
                </div>
                <div className="text-xs text-stone-800 dark:text-stone-200">
                  <span className="font-bold block text-sm mb-0.5">Launch Standalone App</span>
                  Click <strong>Install</strong> to open BabyBites in its own clean window without browser tabs!
                </div>
              </div>
            </>
          )}
        </div>

        <Button
          type="button"
          onClick={() => onOpenChange(false)}
          className="w-full mt-2 rounded-full bg-[#1E5E3A] hover:bg-[#16482c] text-white font-bold text-sm h-11"
        >
          Got It, Thanks!
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default SmartInstallBanner;
