import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share, Plus, Check } from 'lucide-react';

interface IOSInstallPromptProps {
  onDismiss?: () => void;
}

const IOSInstallPrompt = ({ onDismiss }: IOSInstallPromptProps) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Detect if running as standalone (PWA installed)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Only show prompt on iOS when NOT in standalone mode
    if (iOS && !standalone) {
      // Check if user has dismissed before
      const dismissed = localStorage.getItem('ios-install-prompt-dismissed');
      const lastDismissed = dismissed ? parseInt(dismissed, 10) : 0;
      const daysSinceDismissed = (Date.now() - lastDismissed) / (1000 * 60 * 60 * 24);

      // Show again after 7 days
      if (!dismissed || daysSinceDismissed > 7) {
        // Delay showing to not interrupt initial experience
        const timer = setTimeout(() => setShowPrompt(true), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('ios-install-prompt-dismissed', Date.now().toString());
    setShowPrompt(false);
    onDismiss?.();
  };

  // Don't render if not iOS or already installed
  if (!isIOS || isStandalone) {
    return null;
  }

  return (
    <Dialog open={showPrompt} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="max-w-sm mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            📱 Instalar BabyBites
          </DialogTitle>
          <DialogDescription className="text-left">
            Para receber notificações de refeições no seu iPhone, precisa instalar a app.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-muted rounded-lg p-4 space-y-4">
            <h4 className="font-semibold text-sm">Como instalar:</h4>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    Toque no ícone <Share className="inline w-4 h-4 mx-1" /> de partilhar no Safari
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    Deslize para baixo e toque em <strong>"Adicionar ao Ecrã de Início"</strong> <Plus className="inline w-4 h-4 mx-1" />
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <div className="flex-1">
                  <p className="text-sm">
                    Toque em <strong>"Adicionar"</strong> no canto superior direito
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Abra o BabyBites a partir do ícone no ecrã de início e ative as notificações!
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              <strong>Nota:</strong> O iOS só permite notificações push em apps instaladas no ecrã de início. 
              Requer iOS 16.4 ou superior.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleDismiss} className="flex-1">
            Mais tarde
          </Button>
          <Button onClick={handleDismiss} className="flex-1">
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Hook to check iOS PWA status
export const useIOSPWAStatus = () => {
  const [status, setStatus] = useState({
    isIOS: false,
    isStandalone: false,
    canReceiveNotifications: false,
    iosVersion: 0,
  });

  useEffect(() => {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (navigator as any).standalone === true;
    
    // Parse iOS version
    let iosVersion = 0;
    if (iOS) {
      const match = navigator.userAgent.match(/OS (\d+)_/);
      if (match) {
        iosVersion = parseInt(match[1], 10);
      }
    }

    // iOS 16.4+ is required for Web Push
    const canReceiveNotifications = !iOS || (standalone && iosVersion >= 16);

    setStatus({
      isIOS: iOS,
      isStandalone: standalone,
      canReceiveNotifications,
      iosVersion,
    });
  }, []);

  return status;
};

export default IOSInstallPrompt;
