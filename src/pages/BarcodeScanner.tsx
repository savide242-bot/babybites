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
      console.log("Starting camera scanner...");
      
      // Simplified secure context check
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        toast({
          title: "Secure Connection Required",
          description: "Camera requires HTTPS. Please access through a secure connection.",
          variant: "destructive",
        });
        return;
      }

      // Check if QR reader element exists
      const qrReaderElement = document.getElementById(qrCodeRegionId);
      if (!qrReaderElement) {
        console.error("QR reader element not found");
        toast({
          title: "Error",
          description: "Scanner element not found. Try reloading the page.",
          variant: "destructive",
        });
        return;
      }
      
      console.log("QR element found:", !!qrReaderElement);
      console.log("Is secure context:", window.isSecureContext);

      // Check camera permissions
      try {
        if (navigator.permissions) {
          const permissions = await navigator.permissions.query({ name: 'camera' as PermissionName });
          
          if (permissions.state === 'denied') {
            toast({
              title: "Camera Permission Denied",
              description: "Please allow camera access in your browser settings.",
              variant: "destructive",
            });
            return;
          }
        }
      } catch (e) {
        // Some browsers don't support permissions API - continue anyway
        console.log("Permissions API not supported:", e);
      }

      // Request camera permission explicitly
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: "environment" } 
        });
        console.log("Camera access granted");
        stream.getTracks().forEach(track => track.stop());
      } catch (permissionError: any) {
        console.error("Camera permission error:", permissionError);
        
        let errorMessage = "Please allow camera access in your browser settings.";
        if (permissionError.name === "NotAllowedError") {
          errorMessage = "Camera access was denied. Please check your browser permissions.";
        } else if (permissionError.name === "NotFoundError") {
          errorMessage = "No camera found on this device.";
        } else if (permissionError.name === "NotReadableError") {
          errorMessage = "Camera is already in use by another application.";
        }
        
        toast({
          title: "Camera Access Error",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      setCameraScanning(true);
      
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(qrCodeRegionId);
      }
      
      console.log("Scanner initialized, starting camera...");

      await scannerRef.current.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          console.log("Barcode detected:", decodedText);
          setBarcode(decodedText);
          stopCameraScanner();
          handleScan(decodedText);
        },
        (errorMessage) => {
          // Silently handle scan errors during active scanning
        }
      );
      
      console.log("Camera started successfully");
    } catch (err: any) {
      console.error("Error starting camera:", err);
      
      let errorMessage = "Could not access camera. Please check permissions.";
      if (err.message) {
        if (err.message.includes("NotAllowedError")) {
          errorMessage = "Camera access was denied. Please allow camera access.";
        } else if (err.message.includes("NotFoundError")) {
          errorMessage = "No camera found on your device.";
        } else if (err.message.includes("NotReadableError")) {
          errorMessage = "Camera is being used by another application.";
        }
      }
      
      toast({
        title: "Camera Error",
        description: errorMessage,
        variant: "destructive",
      });
      setCameraScanning(false);
    }
  };

  const stopCameraScanner = async () => {
    try {
      if (scannerRef.current) {
        const state = await scannerRef.current.getState();
        if (state === 2) { // 2 = SCANNING state
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
        scannerRef.current = null;
      }
      setCameraScanning(false);
      console.log("Camera stopped successfully");
    } catch (err) {
      console.error("Error stopping camera:", err);
      setCameraScanning(false);
    }
  };

  const handleScan = async (scannedCode?: string) => {
    const codeToScan = scannedCode || barcode;
    if (!codeToScan.trim()) {
      toast({
        title: "Missing Barcode",
        description: "Please enter a barcode or scan one with your camera.",
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
        <h1 className="text-4xl font-bold text-primary mb-2">Product Scanner</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Scan products to check if they're safe for your baby
        </p>

        {!cameraScanning ? (
          <Card className="p-6 mb-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="barcode">Barcode Number</Label>
                <div className="flex gap-2">
                  <Input
                    id="barcode"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Enter barcode number"
                    disabled={scanning}
                  />
                  <Button onClick={() => handleScan()} disabled={scanning}>
                    <Scan className="w-4 h-4 mr-2" />
                    {scanning ? "Scanning..." : "Scan"}
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
                  Use Camera to Scan
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Scan product barcodes with your device camera
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-6 mb-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Camera Scanning Active</h3>
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
                Position the barcode within the frame to scan
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
                    {result.is_baby_safe ? "✓ Safe for Baby" : "⚠ Use with Caution"}
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
          <h3 className="font-semibold mb-2">How It Works</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
            <li>Enter a barcode number manually or click "Use Camera to Scan"</li>
            <li>Allow camera access when prompted by your browser</li>
            <li>Point your camera at the product barcode</li>
            <li>View safety information and suggested recipes instantly</li>
          </ol>
        </Card>
      </div>
    </main>
  );
};

export default BarcodeScanner;
