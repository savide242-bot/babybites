import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/hooks/useLanguage";
import { Download, Smartphone, Zap, Globe } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/5 to-background p-6">
      <div className="max-w-2xl mx-auto space-y-8 pt-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-block p-4 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-3xl">
            <Download className="w-16 h-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            {t('install.title')}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t('install.description')}
          </p>
        </div>

        {/* Features */}
        <div className="grid gap-4">
          <Card className="p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <Smartphone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  {t('install.nativeExperience')}
                </h3>
                <p className="text-muted-foreground">
                  {t('install.nativeExperienceDesc')}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-secondary/5 to-transparent border-secondary/20">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-secondary/10 rounded-2xl">
                <Globe className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  {t('install.offlineAccess')}
                </h3>
                <p className="text-muted-foreground">
                  {t('install.offlineAccessDesc')}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-accent/5 to-transparent border-accent/20">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-accent/10 rounded-2xl">
                <Zap className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-2">
                  {t('install.fastLoading')}
                </h3>
                <p className="text-muted-foreground">
                  {t('install.fastLoadingDesc')}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Install Button */}
        {isInstallable && (
          <Button
            onClick={handleInstallClick}
            size="lg"
            className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-primary via-secondary to-accent hover:opacity-90 transition-opacity"
          >
            <Download className="w-5 h-5 mr-2" />
            {t('install.installNow')}
          </Button>
        )}

        {/* Manual Instructions */}
        <Card className="p-6 bg-muted/50">
          <h3 className="font-semibold text-lg mb-4">
            {t('install.manualInstall')}
          </h3>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div>
              <strong className="text-foreground">iPhone/iPad:</strong>
              <p className="mt-1">
                {t('install.iosInstructions')}
              </p>
            </div>
            <div>
              <strong className="text-foreground">Android:</strong>
              <p className="mt-1">
                {t('install.androidInstructions')}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Install;
