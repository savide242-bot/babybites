import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scan, AlertTriangle, CheckCircle2, Camera, X, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

type CameraState = 'IDLE' | 'REQUESTING_PERMISSION' | 'INITIALIZING' | 'SCANNING' | 'PAUSED' | 'ERROR';
type ScanningStatus = 'idle' | 'scanning' | 'confirming' | 'verifying' | 'success' | 'error';

interface ScanResult {
  barcode: string;
  barcode_type: string;
  product_name: string;
  brands?: string;
  ingredients?: string;
  allergens?: string[];
  nutrition_grade?: string;
  is_baby_safe: boolean;
  safety_notes: string;
  image_url?: string;
  verified: boolean;
  verification_source: string;
}

const validateEAN13 = (barcode: string): boolean => {
  if (!/^\d{13}$/.test(barcode)) return false;
  const digits = barcode.split('').map(Number);
  const checkDigit = digits.pop()!;
  const oddSum = digits.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0);
  const evenSum = digits.filter((_, i) => i % 2 === 1).reduce((a, b) => a + b, 0) * 3;
  const totalSum = oddSum + evenSum;
  const calculatedCheck = (10 - (totalSum % 10)) % 10;
  return checkDigit === calculatedCheck;
};

const validateUPC = (barcode: string): boolean => {
  if (!/^\d{12}$/.test(barcode)) return false;
  const digits = barcode.split('').map(Number);
  const checkDigit = digits.pop()!;
  const oddSum = digits.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0) * 3;
  const evenSum = digits.filter((_, i) => i % 2 === 1).reduce((a, b) => a + b, 0);
  const totalSum = oddSum + evenSum;
  const calculatedCheck = (10 - (totalSum % 10)) % 10;
  return checkDigit === calculatedCheck;
};

const validateBarcode = (code: string): { valid: boolean; type: string } => {
  if (code.length < 8 || code.length > 14) return { valid: false, type: 'invalid_length' };
  if (!/^\d+$/.test(code)) return { valid: false, type: 'invalid_format' };
  if (code.length === 13 && validateEAN13(code)) return { valid: true, type: 'EAN-13' };
  if (code.length === 12 && validateUPC(code)) return { valid: true, type: 'UPC-A' };
  if (code.length === 8) return { valid: true, type: 'EAN-8' };
  return { valid: false, type: 'invalid_checksum' };
};

const BarcodeScanner = () => {
  const [barcode, setBarcode] = useState("");
  const [cameraState, setCameraState] = useState<CameraState>('IDLE');
  const [scanningStatus, setScanningStatus] = useState<ScanningStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanBuffer, setScanBuffer] = useState<Map<string, number>>(new Map());
  const [scanCooldown, setScanCooldown] = useState(false);
  const { toast } = useToast();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrCodeRegionId = "qr-reader";
  const CONFIRMATION_THRESHOLD = 3;
  const COOLDOWN_DURATION = 3000;

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, []);

  const stopCameraScanner = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      }
      setCameraState('IDLE');
      setScanningStatus('idle');
      setScanBuffer(new Map());
    } catch (error) {
      console.error("Error stopping scanner:", error);
    }
  };

  const verifyProduct = async (barcode: string, barcodeType: string): Promise<ScanResult | null> => {
    try {
      setScanningStatus('verifying');
      setStatusMessage('Verifying product...');
      
      const { data, error } = await supabase.functions.invoke('verify-product', {
        body: { barcode }
      });
      
      if (error) {
        console.error('Edge function error:', error);
        toast({ title: "Verification Error", description: "Unable to verify product.", variant: "destructive" });
        return null;
      }
      
      if (!data.found) {
        toast({ title: "Product Not Found", description: data.message || "Not in database.", variant: "destructive" });
        return null;
      }
      
      return {
        barcode, barcode_type: barcodeType, product_name: data.product_name, brands: data.brands,
        ingredients: data.ingredients, allergens: data.allergens, nutrition_grade: data.nutrition_grade,
        is_baby_safe: data.is_baby_safe, safety_notes: data.safety_notes, image_url: data.image_url,
        verified: true, verification_source: 'Open Food Facts'
      };
    } catch (error) {
      console.error('Error verifying product:', error);
      toast({ title: "Verification Failed", description: "An error occurred.", variant: "destructive" });
      return null;
    }
  };

  const saveToDatabase = async (productData: ScanResult) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      await supabase.from("scanned_products").insert({
        user_id: user.id, barcode: productData.barcode, barcode_type: productData.barcode_type,
        product_name: productData.product_name, brands: productData.brands, allergens: productData.allergens,
        nutrition_grade: productData.nutrition_grade, image_url: productData.image_url,
        is_baby_safe: productData.is_baby_safe, safety_notes: productData.safety_notes,
        verified: productData.verified, verification_source: productData.verification_source,
        suggested_recipes: []
      });
    } catch (error) {
      console.error('Error saving to database:', error);
    }
  };

  const handleBarcodeDetected = async (decodedText: string) => {
    if (scanCooldown) return;
    const validation = validateBarcode(decodedText);
    if (!validation.valid) {
      setScanningStatus('error');
      setStatusMessage(`Invalid barcode: ${validation.type}`);
      return;
    }
    
    setScanBuffer(prev => {
      const newBuffer = new Map(prev);
      const currentCount = newBuffer.get(decodedText) || 0;
      newBuffer.set(decodedText, currentCount + 1);
      const scanCount = currentCount + 1;
      
      if (scanCount < CONFIRMATION_THRESHOLD) {
        setScanningStatus('confirming');
        setStatusMessage(`Scan ${scanCount}/${CONFIRMATION_THRESHOLD} - Keep scanning...`);
      } else if (scanCount === CONFIRMATION_THRESHOLD) {
        processConfirmedScan(decodedText, validation.type);
      }
      return newBuffer;
    });
  };

  const processConfirmedScan = async (barcode: string, barcodeType: string) => {
    setScanningStatus('verifying');
    setStatusMessage('Product verified! ✓ Fetching details...');
    setScanCooldown(true);
    await stopCameraScanner();
    
    const productData = await verifyProduct(barcode, barcodeType);
    if (productData) {
      setScanningStatus('success');
      setStatusMessage('Product verified successfully!');
      setResult(productData);
      await saveToDatabase(productData);
      toast({ title: "Product Verified ✓", description: `${productData.product_name} analyzed.` });
    } else {
      setScanningStatus('error');
      setStatusMessage('Product not found');
    }
    
    setTimeout(() => { setScanCooldown(false); setScanBuffer(new Map()); }, COOLDOWN_DURATION);
  };

  const startCameraScanner = async () => {
    try {
      setCameraState('REQUESTING_PERMISSION');
      setStatusMessage('Requesting camera permission...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      stream.getTracks().forEach(track => track.stop());
      
      setCameraState('INITIALIZING');
      if (scannerRef.current) await scannerRef.current.stop();
      
      scannerRef.current = new Html5Qrcode(qrCodeRegionId);
      await scannerRef.current.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 }, formatsToSupport: [
          Html5QrcodeSupportedFormats.EAN_13, Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.UPC_A, Html5QrcodeSupportedFormats.UPC_E
        ]},
        handleBarcodeDetected,
        () => {}
      );
      
      setCameraState('SCANNING');
      setScanningStatus('scanning');
      setStatusMessage('Position barcode in frame...');
    } catch (error: any) {
      toast({ title: "Scanner Error", description: "Failed to start camera.", variant: "destructive" });
      setCameraState('ERROR');
    }
  };

  const handleManualScan = async () => {
    const validation = validateBarcode(barcode.trim());
    if (!validation.valid) {
      toast({ title: "Invalid Barcode", description: `Invalid format: ${validation.type}`, variant: "destructive" });
      return;
    }
    const productData = await verifyProduct(barcode.trim(), validation.type);
    if (productData) { setResult(productData); await saveToDatabase(productData); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/5 to-primary/5 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2 py-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">Barcode Scanner</h1>
          <p className="text-muted-foreground text-lg">Scan product barcodes to check baby safety</p>
        </div>

        {statusMessage && (
          <Card className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
            <div className="flex items-center gap-3">
              {scanningStatus === 'verifying' && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
              {scanningStatus === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              {scanningStatus === 'error' && <AlertTriangle className="h-5 w-5 text-destructive" />}
              <p className="font-medium">{statusMessage}</p>
            </div>
          </Card>
        )}

        {cameraState === 'IDLE' ? (
          <Card className="p-6 space-y-6">
            <div className="space-y-4">
              <div><Label htmlFor="barcode">Enter Barcode Manually</Label>
                <Input id="barcode" type="text" placeholder="EAN-13, UPC" value={barcode}
                  onChange={(e) => setBarcode(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleManualScan()} className="mt-2" />
              </div>
              <Button onClick={handleManualScan} className="w-full"><Scan className="mr-2 h-4 w-4" />Scan Manually</Button>
            </div>
            <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or</span></div>
            </div>
            <Button onClick={startCameraScanner} variant="outline" className="w-full"><Camera className="mr-2 h-4 w-4" />Use Camera</Button>
          </Card>
        ) : (
          <Card className="p-6 space-y-4">
            <div className="relative">
              <div id={qrCodeRegionId} className="rounded-lg overflow-hidden border-2 border-primary/30" />
              {cameraState === 'SCANNING' && <div className="absolute top-2 left-2 right-2 bg-black/50 text-white text-sm p-2 rounded">{statusMessage}</div>}
            </div>
            <Button onClick={stopCameraScanner} variant="destructive" className="w-full"><X className="mr-2 h-4 w-4" />Stop Camera</Button>
          </Card>
        )}

        {result && (
          <Card className="p-6 space-y-4">
            <div className="flex items-start gap-4">
              {result.image_url && <img src={result.image_url} alt={result.product_name} className="w-24 h-24 object-cover rounded-lg border" />}
              <div className="flex-1 space-y-2">
                <h2 className="text-2xl font-bold">{result.product_name}</h2>
                {result.brands && <p className="text-muted-foreground">{result.brands}</p>}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Barcode:</span>
                  <code className="text-sm bg-muted px-2 py-1 rounded">{result.barcode}</code>
                  <span className="text-xs text-muted-foreground">({result.barcode_type})</span>
                </div>
              </div>
            </div>
            <div className={`p-4 rounded-lg border-2 ${result.is_baby_safe ? 'bg-green-50 dark:bg-green-950/20 border-green-500' : 'bg-red-50 dark:bg-red-950/20 border-red-500'}`}>
              <div className="flex items-start gap-3">
                {result.is_baby_safe ? <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" /> : <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />}
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">{result.is_baby_safe ? 'Safe for Babies' : 'Not Recommended'}</h3>
                  <div className="whitespace-pre-line text-sm">{result.safety_notes}</div>
                </div>
              </div>
            </div>
            {result.ingredients && <div className="space-y-2"><h4 className="font-semibold">Ingredients:</h4><p className="text-sm text-muted-foreground">{result.ingredients}</p></div>}
          </Card>
        )}

        <Card className="p-6 bg-muted/50">
          <h3 className="font-bold text-lg mb-4">How It Works</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Only EAN-13, EAN-8, UPC-A, UPC-E barcodes accepted</li>
            <li>• Checksums validated for authenticity</li>
            <li>• Products verified against Open Food Facts</li>
            <li>• Safety analysis for honey, sugars, salt, allergens</li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default BarcodeScanner;
