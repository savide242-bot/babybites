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
      {/* LUXURY BOTANICAL FLOATING PWA BANNER */}
      <aside 
        aria-label="Add BabyBites to Home Screen"
        className="fixed bottom-[74px] sm:bottom-6 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-in fade-in slide-in-from-bottom-5 duration-300"
      >
        <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#123E24] via-[#1A5432] to-[#123E24] text-white p-4 shadow-[0_16px_40px_-8px_rgba(18,62,36,0.55)] border border-emerald-400/30 backdrop-blur-xl">
          
          {/* Subtle botanical glow */}
          <div className="absolute -top-12 -right-12 w-28 h-28 bg-emerald-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-[#48B774]/20 rounded-full blur-xl pointer-events-none" />

          {/* Close button */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Close download banner"
            className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white/80 transition-colors z-10"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-start gap-3.5 pr-6">
            {/* App Icon */}
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-white p-1 border border-emerald-300/40 shadow-sm shrink-0">
              <img 
                src="/logo.png" 
                alt="BabyBites" 
                className="w-full h-full object-contain"
                loading="eager"
              />
            </div>

            {/* Banner Copy */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="font-times font-bold text-base sm:text-lg text-white leading-tight tracking-tight">
                  Add BabyBites to Screen
                </h3>
                <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                  <Sparkles className="w-2.5 h-2.5 text-emerald-300" /> Free
                </span>
              </div>
              <p className="text-xs text-stone-200 mt-1 leading-snug font-sans">
                {deviceType === 'ios'
                  ? 'Access 390+ recipes & meal alerts directly from your iPhone home screen.'
                  : 'Instant offline access & timely meal reminders directly on your phone.'}
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between gap-3">
            <span className="text-[11px] text-stone-300 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>0 MB storage required</span>
            </span>

            <Button
              type="button"
              size="sm"
              onClick={handleActionClick}
              className="rounded-full bg-[#FAF9F5] hover:bg-white text-[#1E5E3A] font-bold text-xs px-4 h-9 shadow-md gap-1.5 transition-all hover:scale-[1.02] active:scale-95 shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-[#1E5E3A]" />
              <span>Add to Screen</span>
            </Button>
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
