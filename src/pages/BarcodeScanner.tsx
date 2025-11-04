import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scan, AlertTriangle, CheckCircle2, Camera, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Html5Qrcode } from "html5-qrcode";
import { useLanguage } from "@/hooks/useLanguage";

const BarcodeScanner = () => {
  const { t } = useLanguage();
  const [barcode, setBarcode] = useState("");
  const [scanning, setScanning] = useState(false);
  const [cameraScanning, setCameraScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrCodeRegionId = "qr-reader";

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const startCameraScanner = async () => {
    try {
      // Check if running on HTTPS or localhost
      if (!window.isSecureContext && window.location.hostname !== 'localhost') {
        toast({
          title: "Conexão Segura Necessária",
          description: "A câmera requer HTTPS. Por favor, aceda através de uma conexão segura.",
          variant: "destructive",
        });
        return;
      }

      // Request camera permission explicitly
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop()); // Stop test stream
      } catch (permissionError) {
        toast({
          title: "Permissão da Câmera Negada",
          description: "Por favor, permita o acesso à câmera nas configurações do navegador.",
          variant: "destructive",
        });
        return;
      }

      setCameraScanning(true);
      
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(qrCodeRegionId);
      }

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          setBarcode(decodedText);
          stopCameraScanner();
          handleScan(decodedText);
        },
        (errorMessage) => {
          // Silently handle scan errors during active scanning
        }
      );
    } catch (err) {
      console.error("Error starting camera:", err);
      toast({
        title: "Erro na Câmera",
        description: "Não foi possível aceder à câmera. Verifique as permissões.",
        variant: "destructive",
      });
      setCameraScanning(false);
    }
  };

  const stopCameraScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current = null;
      }
      setCameraScanning(false);
    } catch (err) {
      console.error("Error stopping camera:", err);
    }
  };

  const handleScan = async (scannedCode?: string) => {
    const codeToScan = scannedCode || barcode;
    if (!codeToScan.trim()) {
      toast({
        title: t('scanner.missingBarcode'),
        description: t('scanner.enterBarcodeError'),
        variant: "destructive",
      });
      return;
    }

    setScanning(true);
    
    // Simulate scanning and safety check
    setTimeout(() => {
      const mockResult = {
        product_name: "Baby Food Product",
        is_baby_safe: Math.random() > 0.3,
        safety_notes: Math.random() > 0.3 
          ? "This product is safe for babies 6+ months. Contains no common allergens."
          : "Warning: This product may contain honey (not recommended for babies under 12 months) or added sugar.",
        suggested_recipes: ["Sweet Potato Puree", "Banana Pancakes", "Veggie Smoothie"],
      };

      setResult(mockResult);
      setScanning(false);

      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase.from("scanned_products").insert({
            barcode: codeToScan,
            product_name: mockResult.product_name,
            is_baby_safe: mockResult.is_baby_safe,
            safety_notes: mockResult.safety_notes,
            suggested_recipes: mockResult.suggested_recipes,
            user_id: user.id,
          });
        }
      });
    }, 2000);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-primary/5 to-background pt-20 pb-8">
      <div className="container max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-primary mb-2">{t('scanner.title')}</h1>
        <p className="text-lg text-muted-foreground mb-8">
          {t('scanner.subtitle')}
        </p>

        {!cameraScanning ? (
          <Card className="p-6 mb-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="barcode">{t('scanner.barcode')}</Label>
                <div className="flex gap-2">
                  <Input
                    id="barcode"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder={t('scanner.enterBarcode')}
                    disabled={scanning}
                  />
                  <Button onClick={() => handleScan()} disabled={scanning}>
                    <Scan className="w-4 h-4 mr-2" />
                    {scanning ? t('scanner.scanning') : t('scanner.scan')}
                  </Button>
                </div>
              </div>

              <div className="text-center">
                <Button 
                  onClick={startCameraScanner} 
                  variant="outline"
                  className="w-full"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {t('scanner.useCamera')}
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  {t('scanner.cameraDesc')}
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-6 mb-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{t('scanner.cameraScanning')}</h3>
                <Button 
                  onClick={stopCameraScanner} 
                  variant="ghost"
                  size="sm"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div id={qrCodeRegionId} className="w-full" />
              <p className="text-sm text-muted-foreground text-center">
                {t('scanner.positionBarcode')}
              </p>
            </div>
          </Card>
        )}

        {result && (
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                {result.is_baby_safe ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                )}
                <div>
                  <h2 className="text-xl font-bold mb-1">{result.product_name}</h2>
                  <p className={`font-semibold ${result.is_baby_safe ? "text-green-600" : "text-yellow-600"}`}>
                    {result.is_baby_safe ? `✓ ${t('scanner.safe')}` : `⚠ ${t('scanner.caution')}`}
                  </p>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">{t('scanner.safetyInfo')}</h3>
                <p className="text-sm">{result.safety_notes}</p>
              </div>

              {result.suggested_recipes && result.suggested_recipes.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">{t('scanner.suggested')}</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {result.suggested_recipes.map((recipe: string, index: number) => (
                      <li key={index} className="text-sm text-muted-foreground">
                        {recipe}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        )}

        <Card className="p-6 mt-6 bg-primary/5">
          <h3 className="font-semibold mb-2">{t('scanner.howItWorks')}</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>{t('scanner.step1')}</li>
            <li>{t('scanner.step2')}</li>
            <li>{t('scanner.step3')}</li>
            <li>{t('scanner.step4')}</li>
          </ol>
        </Card>
      </div>
    </main>
  );
};

export default BarcodeScanner;
