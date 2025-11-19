import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scan, AlertTriangle, CheckCircle2, Camera, X, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { BrowserMultiFormatReader, BarcodeFormat } from "@zxing/browser";

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

const validateBarcode = (code: string): { valid: boolean; type: string } => {
  console.log('🔍 Validating barcode:', code);
  
  if (code.length < 8 || code.length > 14) {
    console.log('❌ Invalid length:', code.length);
    return { valid: false, type: 'invalid_length' };
  }
  if (!/^\d+$/.test(code)) {
    console.log('❌ Invalid format (not numeric)');
    return { valid: false, type: 'invalid_format' };
  }
  
  console.log('✅ Barcode accepted:', code);
  if (code.length === 13) return { valid: true, type: 'EAN-13' };
  if (code.length === 12) return { valid: true, type: 'UPC-A' };
  if (code.length === 8) return { valid: true, type: 'EAN-8' };
  return { valid: true, type: 'UNKNOWN' };
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
  const scannerRef = useRef<BrowserMultiFormatReader | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const CONFIRMATION_THRESHOLD = 2;
  const COOLDOWN_DURATION = 3000;
  const [lastDetection, setLastDetection] = useState<string>('');

  useEffect(() => {
    return () => {
      stopCameraScanner();
    };
  }, []);

  const stopCameraScanner = () => {
    if (scannerRef.current) {
      scannerRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraState('IDLE');
    setScanningStatus('idle');
    setStatusMessage('');
    setScanBuffer(new Map());
  };

  const handleBarcodeDetected = (decodedText: string) => {
    console.log('📸 Barcode detected:', decodedText);
    setLastDetection(decodedText);
    
    if (scanCooldown) {
      console.log('⏸️ In cooldown, ignoring scan');
      return;
    }

    const validation = validateBarcode(decodedText);
    if (!validation.valid) {
      console.log('❌ Invalid barcode format:', validation.type);
      return;
    }

    const newBuffer = new Map(scanBuffer);
    const count = (newBuffer.get(decodedText) || 0) + 1;
    newBuffer.set(decodedText, count);
    setScanBuffer(newBuffer);
    
    console.log(`📊 Buffer count for ${decodedText}: ${count}/${CONFIRMATION_THRESHOLD}`);
    setStatusMessage(`Scan ${count}/${CONFIRMATION_THRESHOLD} - Keep scanning...`);

    if (count >= CONFIRMATION_THRESHOLD) {
      console.log('✅ Confirmation threshold reached!');
      setScanCooldown(true);
      processConfirmedScan(decodedText, validation.type);
    }
  };

  const processConfirmedScan = async (barcode: string, barcodeType: string) => {
    console.log('🔄 Processing confirmed scan:', barcode);
    setScanningStatus('verifying');
    setStatusMessage('Verifying product...');
    
    const productData = await verifyProduct(barcode, barcodeType);
    
    if (productData) {
      console.log('💾 Saving to database...');
      await saveToDatabase(productData);
      setResult(productData);
      setScanningStatus('success');
      setStatusMessage('Product verified successfully!');
      toast({
        title: "Product Scanned",
        description: productData.product_name,
      });
    } else {
      console.log('❌ No product data received');
      setScanningStatus('error');
      setStatusMessage('Product not found');
    }
    
    console.log('⏱️ Starting cooldown...');
    setTimeout(() => { 
      setScanCooldown(false); 
      setScanBuffer(new Map());
      setStatusMessage('Scanning... Point camera at barcode');
    }, COOLDOWN_DURATION);
  };

  const verifyProduct = async (barcode: string, barcodeType: string): Promise<ScanResult | null> => {
    try {
      console.log('📡 Verifying product with API:', barcode);
      setScanningStatus('verifying');
      setStatusMessage('Verifying product...');
      
      const { data, error } = await supabase.functions.invoke('verify-product', {
        body: { barcode }
      });
      
      if (error) {
        console.error('❌ Edge function error:', error);
        toast({ title: "Verification Error", description: "Unable to verify product.", variant: "destructive" });
        return null;
      }
      
      if (!data.found) {
        console.log('❌ Product not found in database');
        toast({ title: "Product Not Found", description: data.message || "Not in database.", variant: "destructive" });
        return null;
      }
      
      console.log('✅ Product verified successfully:', data.product_name);
      return {
        barcode, 
        barcode_type: barcodeType, 
        product_name: data.product_name, 
        brands: data.brands,
        ingredients: data.ingredients, 
        allergens: data.allergens, 
        nutrition_grade: data.nutrition_grade,
        is_baby_safe: data.is_baby_safe, 
        safety_notes: data.safety_notes, 
        image_url: data.image_url,
        verified: true, 
        verification_source: data.verification_source || "Open Food Facts"
      };
    } catch (error) {
      console.error('❌ Verification error:', error);
      toast({ title: "Error", description: "Failed to verify product", variant: "destructive" });
      return null;
    }
  };

  const saveToDatabase = async (productData: ScanResult) => {
    try {
      console.log('💾 Saving product to database...');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('❌ No authenticated user');
        return;
      }

      const { error } = await supabase.from('scanned_products').insert({
        user_id: user.id,
        barcode: productData.barcode,
        barcode_type: productData.barcode_type,
        product_name: productData.product_name,
        brands: productData.brands,
        allergens: productData.allergens,
        nutrition_grade: productData.nutrition_grade,
        is_baby_safe: productData.is_baby_safe,
        safety_notes: productData.safety_notes,
        image_url: productData.image_url,
        verified: productData.verified,
        verification_source: productData.verification_source,
      });

      if (error) {
        console.error('❌ Database error:', error);
      } else {
        console.log('✅ Product saved to database');
      }
    } catch (error) {
      console.error('❌ Save error:', error);
    }
  };

  const startCameraScanner = async () => {
    try {
      setCameraState('REQUESTING_PERMISSION');
      setStatusMessage('Requesting camera permission...');
      
      console.log('🚀 Initializing ZXing scanner...');
      const codeReader = new BrowserMultiFormatReader();
      
      // Set hints for barcode formats
      const hints = new Map();
      const formats = [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
      ];
      hints.set(2, formats); // DecodeHintType.POSSIBLE_FORMATS = 2
      
      setCameraState('INITIALIZING');
      console.log('📹 Starting camera...');
      
      if (!videoRef.current) {
        throw new Error('Video element not found');
      }

      // Get video devices
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      // Prefer back camera
      const backCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear')
      );
      
      const selectedDeviceId = backCamera?.deviceId || videoDevices[0]?.deviceId;
      
      console.log('📱 Using camera:', backCamera?.label || videoDevices[0]?.label);
      
      scannerRef.current = codeReader;
      
      await codeReader.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            console.log('✅ ZXing detected:', result.getText());
            handleBarcodeDetected(result.getText());
          }
        }
      );
      
      console.log('✅ Scanner started successfully');
      setCameraState('SCANNING');
      setScanningStatus('scanning');
      setStatusMessage('Scanning... Point camera at barcode');
      
      toast({
        title: "Camera Ready",
        description: "Point your camera at a barcode to scan",
      });
    } catch (error: any) {
      console.error('❌ Scanner initialization error:', error);
      toast({ 
        title: "Scanner Error", 
        description: error.message || "Failed to start camera.", 
        variant: "destructive" 
      });
      setCameraState('ERROR');
    }
  };

  const handleManualScan = async () => {
    const validation = validateBarcode(barcode.trim());
    if (!validation.valid) {
      toast({ title: "Invalid Barcode", description: `Invalid format: ${validation.type}`, variant: "destructive" });
      return;
    }
    
    setScanningStatus('verifying');
    const productData = await verifyProduct(barcode.trim(), validation.type);
    
    if (productData) {
      await saveToDatabase(productData);
      setResult(productData);
      setScanningStatus('success');
    } else {
      setScanningStatus('error');
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
        Barcode Scanner
      </h1>

      {cameraState === 'IDLE' ? (
        <Card className="p-6 space-y-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="barcode">Enter Barcode Manually</Label>
              <Input 
                id="barcode" 
                type="text" 
                placeholder="EAN-13, UPC" 
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)} 
                onKeyPress={(e) => e.key === 'Enter' && handleManualScan()} 
                className="mt-2" 
              />
            </div>
            <Button onClick={handleManualScan} className="w-full">
              <Scan className="mr-2 h-4 w-4" />Scan Manually
            </Button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>
          <Button onClick={startCameraScanner} variant="outline" className="w-full">
            <Camera className="mr-2 h-4 w-4" />Use Camera
          </Button>
        </Card>
      ) : (
        <Card className="p-6 space-y-4">
          <div className="relative">
            <div className="relative rounded-lg overflow-hidden border-2 border-primary/30 bg-black">
              <video 
                ref={videoRef}
                className="w-full h-auto"
                style={{ maxHeight: '500px' }}
                autoPlay
                playsInline
                muted
              />
              
              {cameraState === 'SCANNING' && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="relative w-[400px] h-[150px] max-w-[90%]">
                    <div className="absolute inset-0 border-2 border-primary/60 rounded-lg shadow-lg" />
                    <div className="scan-line" />
                  </div>
                </div>
              )}
              
              {cameraState === 'SCANNING' && (
                <div className="absolute top-2 left-2 right-2 bg-black/50 text-white text-sm p-2 rounded z-10">
                  {statusMessage}
                </div>
              )}
            </div>
            
            {lastDetection && (
              <div className="mt-2 p-2 bg-muted rounded text-sm text-center">
                <span className="text-muted-foreground">Last detection: </span>
                <span className="font-mono font-bold">{lastDetection}</span>
              </div>
            )}
          </div>
          <Button onClick={stopCameraScanner} variant="destructive" className="w-full">
            <X className="mr-2 h-4 w-4" />Stop Camera
          </Button>
        </Card>
      )}

      {result && (
        <Card className="p-6 mt-6 space-y-4 animate-fade-in">
          <div className="flex items-start gap-4">
            {result.image_url && (
              <img src={result.image_url} alt={result.product_name} className="w-24 h-24 object-cover rounded-lg" />
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">{result.product_name}</h2>
              {result.brands && <p className="text-sm text-muted-foreground mb-2">{result.brands}</p>}
              <div className="flex items-center gap-2 text-sm">
                <span className="font-mono bg-muted px-2 py-1 rounded">{result.barcode}</span>
                <span className="text-xs text-muted-foreground">({result.barcode_type})</span>
              </div>
            </div>
          </div>
          <div className={`p-4 rounded-lg border-2 ${result.is_baby_safe ? 'bg-green-50 dark:bg-green-950/20 border-green-500' : 'bg-red-50 dark:bg-red-950/20 border-red-500'}`}>
            <div className="flex items-start gap-3">
              {result.is_baby_safe ? 
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" /> : 
                <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
              }
              <div className="flex-1">
                <h3 className="font-bold text-lg mb-2">{result.is_baby_safe ? 'Safe for Babies' : 'Not Recommended'}</h3>
                <div className="whitespace-pre-line text-sm">{result.safety_notes}</div>
              </div>
            </div>
          </div>
          {result.ingredients && (
            <div className="space-y-2">
              <h4 className="font-semibold">Ingredients:</h4>
              <p className="text-sm text-muted-foreground">{result.ingredients}</p>
            </div>
          )}
        </Card>
      )}

      {scanningStatus === 'verifying' && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Verifying product...</span>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;
