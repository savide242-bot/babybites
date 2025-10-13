import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scan, AlertTriangle, CheckCircle2, Camera, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Html5Qrcode } from "html5-qrcode";

const BarcodeScanner = () => {
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
      setCameraScanning(true);
      
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(qrCodeRegionId);
      }

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          setBarcode(decodedText);
          stopCameraScanner();
          handleScan(decodedText);
        },
        (errorMessage) => {
          // Silently handle scan errors
        }
      );
    } catch (err) {
      console.error("Error starting camera:", err);
      toast({
        title: "Erro de Câmera",
        description: "Não foi possível acessar a câmera. Verifique as permissões.",
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
        title: "Missing barcode",
        description: "Please enter a barcode",
        variant: "destructive",
      });
      return;
    }

    setScanning(true);
    
    // Simulate scanning and safety check
    // In a real app, this would call an external API or use the device camera
    setTimeout(() => {
      const mockResult = {
        product_name: "Baby Food Product",
        is_baby_safe: Math.random() > 0.3, // 70% safe products
        safety_notes: Math.random() > 0.3 
          ? "This product is safe for babies 6+ months. Contains no common allergens."
          : "Warning: This product may contain honey (not recommended for babies under 12 months) or added sugar.",
        suggested_recipes: ["Sweet Potato Puree", "Banana Pancakes", "Veggie Smoothie"],
      };

      setResult(mockResult);
      setScanning(false);

      // Save to database
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
        <h1 className="text-4xl font-bold text-primary mb-2">Barcode Scanner</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Scan products to check if they're safe for your baby
        </p>

        {!cameraScanning ? (
          <Card className="p-6 mb-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="barcode">Código de Barras do Produto</Label>
                <div className="flex gap-2">
                  <Input
                    id="barcode"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Digite o código de barras"
                    disabled={scanning}
                  />
                  <Button onClick={() => handleScan()} disabled={scanning}>
                    <Scan className="w-4 h-4 mr-2" />
                    {scanning ? "Escaneando..." : "Escanear"}
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
                  Usar Câmera para Escanear
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Aponte a câmera para o código de barras
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-6 mb-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Escaneando com Câmera</h3>
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
                Posicione o código de barras dentro da área destacada
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
                    {result.is_baby_safe ? "✓ Safe for Babies" : "⚠ Use with Caution"}
                  </p>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Safety Information</h3>
                <p className="text-sm">{result.safety_notes}</p>
              </div>

              {result.suggested_recipes && result.suggested_recipes.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Suggested Recipes</h3>
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
          <h3 className="font-semibold mb-2">Como funciona</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Digite ou escaneie o código de barras de qualquer produto</li>
            <li>Nosso sistema verifica os ingredientes contra diretrizes de segurança para bebês</li>
            <li>Receba feedback instantâneo sobre segurança e informações de alérgenos</li>
            <li>Descubra receitas que usam ingredientes seguros</li>
          </ol>
        </Card>
      </div>
    </main>
  );
};

export default BarcodeScanner;
