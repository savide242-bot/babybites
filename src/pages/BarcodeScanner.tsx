import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Scan, AlertTriangle, CheckCircle2, Camera, X, Loader2, Flashlight, 
  RefreshCw, ShieldCheck, ShieldX, ShieldAlert, Sparkles, Info,
  Package, AlertCircle, ChevronDown, ChevronUp, Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BrowserMultiFormatReader, BarcodeFormat } from "@zxing/browser";
import { DecodeHintType } from "@zxing/library";
import { Html5Qrcode } from "html5-qrcode";
import { motion, AnimatePresence } from "framer-motion";

type CameraState = 'IDLE' | 'REQUESTING_PERMISSION' | 'INITIALIZING' | 'SCANNING' | 'ERROR';
type ScanningStatus = 'idle' | 'scanning' | 'confirming' | 'verifying' | 'success' | 'error';
type ScannerMethod = 'zxing' | 'html5qrcode';

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
  if (code.length < 8 || code.length > 14) {
    return { valid: false, type: 'invalid_length' };
  }
  if (!/^\d+$/.test(code)) {
    return { valid: false, type: 'invalid_format' };
  }
  
  if (code.length === 13) return { valid: true, type: 'EAN-13' };
  if (code.length === 12) return { valid: true, type: 'UPC-A' };
  if (code.length === 8) return { valid: true, type: 'EAN-8' };
  return { valid: true, type: 'UNKNOWN' };
};

const getNutritionGradeColor = (grade: string) => {
  const colors: Record<string, { bg: string; text: string; border: string }> = {
    a: { bg: 'bg-green-500', text: 'text-green-600', border: 'border-green-500' },
    b: { bg: 'bg-lime-500', text: 'text-lime-600', border: 'border-lime-500' },
    c: { bg: 'bg-yellow-500', text: 'text-yellow-600', border: 'border-yellow-500' },
    d: { bg: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-500' },
    e: { bg: 'bg-red-500', text: 'text-red-600', border: 'border-red-500' },
  };
  return colors[grade?.toLowerCase()] || colors.c;
};

const BarcodeScanner = () => {
  const [barcode, setBarcode] = useState("");
  const [cameraState, setCameraState] = useState<CameraState>('IDLE');
  const [scanningStatus, setScanningStatus] = useState<ScanningStatus>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanBuffer, setScanBuffer] = useState<Map<string, number>>(new Map());
  const [scanCooldown, setScanCooldown] = useState(false);
  const [scannerMethod, setScannerMethod] = useState<ScannerMethod>('zxing');
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [retryCount, setRetryCount] = useState(0);
  const [showSafetyDetails, setShowSafetyDetails] = useState(false);
  
  const { toast } = useToast();
  const scannerRef = useRef<BrowserMultiFormatReader | null>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const initTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const CONFIRMATION_THRESHOLD = 2;
  const COOLDOWN_DURATION = 3000;
  const INIT_TIMEOUT = 10000;
  const MAX_RETRIES = 3;

  useEffect(() => {
    return () => {
      stopCameraScanner();
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
      }
    };
  }, []);

  const stopCameraScanner = async () => {
    console.log('🛑 Stopping scanner...');
    
    if (initTimeoutRef.current) {
      clearTimeout(initTimeoutRef.current);
      initTimeoutRef.current = null;
    }
    
    if (scannerRef.current) {
      scannerRef.current = null;
    }

    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch (e) {
        console.error('Error stopping HTML5-QRCode:', e);
      }
      html5QrCodeRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🎥 Stopped track:', track.label);
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraState('IDLE');
    setScanningStatus('idle');
    setStatusMessage('');
    setScanBuffer(new Map());
    setTorchEnabled(false);
    setRetryCount(0);
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      console.log('📷 Requesting camera permission...');
      setCameraState('REQUESTING_PERMISSION');
      setStatusMessage('Requesting camera access...');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: cameraFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      streamRef.current = stream;
      console.log('✅ Camera permission granted');

      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        console.log('✅ Stream connected to video element');
        
        try {
          await videoRef.current.play();
          console.log('✅ Video playing');
        } catch (playError) {
          console.warn('⚠️ Video play warning:', playError);
        }
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setHasMultipleCameras(videoDevices.length > 1);

      return true;
    } catch (error: any) {
      console.error('❌ Camera permission error:', error);
      setCameraState('ERROR');
      
      if (error.name === 'NotAllowedError') {
        setStatusMessage('Camera access denied. Please enable camera in your browser settings.');
        toast({
          title: "Camera Access Denied",
          description: "Please enable camera permissions and try again.",
          variant: "destructive"
        });
      } else if (error.name === 'NotFoundError') {
        setStatusMessage('No camera found. Please connect a camera device.');
        toast({
          title: "No Camera Found",
          description: "Please connect a camera and try again.",
          variant: "destructive"
        });
      } else {
        setStatusMessage('Failed to access camera. Please try again.');
        toast({
          title: "Camera Error",
          description: error.message || "Failed to access camera",
          variant: "destructive"
        });
      }
      
      return false;
    }
  };

  const waitForVideoReady = async (video: HTMLVideoElement, timeout: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Video initialization timeout'));
      }, timeout);

      const checkReady = () => {
        if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
          clearTimeout(timeoutId);
          resolve();
        } else if (video.readyState >= 2) {
          video.addEventListener('loadeddata', () => {
            clearTimeout(timeoutId);
            resolve();
          }, { once: true });
        } else {
          video.addEventListener('loadedmetadata', () => {
            if (video.videoWidth > 0 && video.videoHeight > 0) {
              clearTimeout(timeoutId);
              resolve();
            } else {
              video.addEventListener('loadeddata', () => {
                clearTimeout(timeoutId);
                resolve();
              }, { once: true });
            }
          }, { once: true });
        }
      };

      checkReady();
    });
  };

  const initializeZXingScanner = async (): Promise<boolean> => {
    try {
      console.log('🔧 Initializing ZXing scanner...');
      setCameraState('INITIALIZING');
      setStatusMessage('Initializing scanner...');

      await new Promise(resolve => setTimeout(resolve, 200));

      if (!videoRef.current) {
        throw new Error('Video element not found');
      }

      if (!videoRef.current.srcObject && streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        await videoRef.current.play();
      }

      if (!videoRef.current.srcObject) {
        throw new Error('Video has no stream source');
      }

      await waitForVideoReady(videoRef.current, INIT_TIMEOUT);

      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.CODE_128,
        BarcodeFormat.CODE_39,
        BarcodeFormat.QR_CODE,
        BarcodeFormat.DATA_MATRIX
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true);

      const codeReader = new BrowserMultiFormatReader(hints);
      scannerRef.current = codeReader;

      const videoDevices = await BrowserMultiFormatReader.listVideoInputDevices();
      
      if (videoDevices.length === 0) {
        throw new Error('No camera devices found');
      }

      const selectedDevice = videoDevices.find(device => 
        device.label.toLowerCase().includes(cameraFacingMode === 'environment' ? 'back' : 'front')
      ) || videoDevices[0];
      
      await codeReader.decodeFromVideoDevice(
        selectedDevice.deviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            const detectedCode = result.getText();
            handleBarcodeDetected(detectedCode);
          }
        }
      );

      setCameraState('SCANNING');
      setScanningStatus('scanning');
      setStatusMessage('Point camera at barcode...');
      
      return true;
    } catch (error: any) {
      console.error('❌ ZXing initialization error:', error);
      setStatusMessage(error.message || 'Scanner initialization failed');
      return false;
    }
  };

  const initializeHtml5QrCodeScanner = async (): Promise<boolean> => {
    try {
      console.log('🔧 Initializing HTML5-QRCode scanner...');
      setCameraState('INITIALIZING');
      setStatusMessage('Initializing scanner...');

      await new Promise(resolve => setTimeout(resolve, 200));

      const readerElement = document.getElementById('barcode-reader');
      if (!readerElement) {
        throw new Error('Scanner element not found');
      }

      if (streamRef.current && videoRef.current && !videoRef.current.srcObject) {
        videoRef.current.srcObject = streamRef.current;
        await videoRef.current.play();
      }

      const html5QrCode = new Html5Qrcode("barcode-reader");
      html5QrCodeRef.current = html5QrCode;
      
      const startPromise = html5QrCode.start(
        { facingMode: cameraFacingMode },
        {
          fps: 15,
          qrbox: { width: 300, height: 200 }
        },
        (decodedText) => {
          handleBarcodeDetected(decodedText);
        },
        () => {}
      );

      const timeoutPromise = new Promise((_, reject) => {
        initTimeoutRef.current = setTimeout(() => {
          reject(new Error('Scanner initialization timeout'));
        }, INIT_TIMEOUT);
      });

      await Promise.race([startPromise, timeoutPromise]);
      
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }

      setCameraState('SCANNING');
      setScanningStatus('scanning');
      setStatusMessage('Point camera at barcode...');
      
      return true;
    } catch (error: any) {
      console.error('❌ HTML5-QRCode initialization error:', error);
      setStatusMessage(error.message || 'Scanner initialization failed');
      return false;
    }
  };

  const checkBrowserCompatibility = (): { compatible: boolean; issues: string[] } => {
    const issues: string[] = [];
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      issues.push('Camera access not supported');
    }
    
    if (!window.MediaStream) {
      issues.push('Media streaming not supported');
    }
    
    const isSecureContext = window.isSecureContext || location.protocol === 'https:';
    if (!isSecureContext && location.hostname !== 'localhost') {
      issues.push('Camera requires HTTPS');
    }
    
    return { compatible: issues.length === 0, issues };
  };

  const startCameraScanner = async () => {
    try {
      const compatibility = checkBrowserCompatibility();
      if (!compatibility.compatible) {
        throw new Error(`Browser issue: ${compatibility.issues.join(', ')}`);
      }
      
      setCameraState('INITIALIZING');
      
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) return;

      let success = false;

      if (scannerMethod === 'zxing') {
        success = await initializeZXingScanner();
        
        if (!success) {
          toast({ title: "Switching Scanner", description: "Trying alternative..." });
          setScannerMethod('html5qrcode');
          success = await initializeHtml5QrCodeScanner();
        }
      } else {
        success = await initializeHtml5QrCodeScanner();
        
        if (!success) {
          setScannerMethod('zxing');
          success = await initializeZXingScanner();
        }
      }

      if (!success) {
        throw new Error('Scanner initialization failed');
      } else {
        setRetryCount(0);
        toast({
          title: "Scanner Ready ✅",
          description: "Point your camera at a barcode",
        });
      }
    } catch (error: any) {
      console.error('❌ Failed to start scanner:', error);
      setCameraState('ERROR');
      setStatusMessage(error.message || 'Failed to start scanner');
      toast({
        title: "Scanner Error",
        description: error.message || "Please try manual entry",
        variant: "destructive"
      });
      setRetryCount(0);
    }
  };

  const toggleTorch = async () => {
    if (!streamRef.current) return;

    try {
      const track = streamRef.current.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;

      if (capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !torchEnabled } as any]
        });
        setTorchEnabled(!torchEnabled);
        toast({ title: torchEnabled ? "Flashlight Off" : "Flashlight On" });
      } else {
        toast({
          title: "Not Supported",
          description: "Your device doesn't support flashlight",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error toggling torch:', error);
    }
  };

  const switchCamera = async () => {
    await stopCameraScanner();
    setCameraFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    setTimeout(() => startCameraScanner(), 500);
  };

  const handleBarcodeDetected = (decodedText: string) => {
    if (scanCooldown) return;

    const validation = validateBarcode(decodedText);
    if (!validation.valid) return;

    const newBuffer = new Map(scanBuffer);
    const count = (newBuffer.get(decodedText) || 0) + 1;
    newBuffer.set(decodedText, count);
    setScanBuffer(newBuffer);
    
    setStatusMessage(`Scan ${count}/${CONFIRMATION_THRESHOLD} - Hold steady...`);

    if (count >= CONFIRMATION_THRESHOLD) {
      processConfirmedScan(decodedText, validation.type);
    }
  };

  const processConfirmedScan = async (confirmedBarcode: string, barcodeType: string) => {
    setScanCooldown(true);
    setScanningStatus('verifying');
    setStatusMessage('Verifying product...');
    setScanBuffer(new Map());

    toast({
      title: "Barcode Detected!",
      description: `Verifying ${confirmedBarcode}...`,
    });

    try {
      const productData = await verifyProduct(confirmedBarcode, barcodeType);
      
      if (productData) {
        await saveToDatabase(productData);
        setResult(productData);
        setScanningStatus('success');
        setStatusMessage('Product verified!');
        
        toast({
          title: "Product Found",
          description: productData.product_name || "Product verified",
        });
      } else {
        setScanningStatus('error');
        setStatusMessage('Product not found');
        toast({
          title: "Product Not Found",
          description: "This product is not in our database yet.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('❌ Scan processing error:', error);
      setScanningStatus('error');
      
      const errorMessage = error.message === 'Product not found in database'
        ? 'Product not found'
        : error.message || 'Failed to verify';
      
      setStatusMessage(errorMessage);
      
      toast({
        title: error.message === 'Product not found in database' ? "Product Not Found" : "Scan Error",
        description: errorMessage,
        variant: "destructive"
      });
    }

    setTimeout(() => {
      setScanCooldown(false);
      if (scanningStatus !== 'success') {
        setScanningStatus('scanning');
        setStatusMessage('Point camera at barcode...');
      }
    }, COOLDOWN_DURATION);
  };

  const verifyProduct = async (barcode: string, barcodeType: string): Promise<ScanResult | null> => {
    const { data, error } = await supabase.functions.invoke('verify-product', {
      body: { barcode, barcodeType }
    });

    if (error) throw new Error(error.message || 'Verification failed');
    if (!data || !data.product) throw new Error('Product not found in database');

    return data as ScanResult;
  };

  const saveToDatabase = async (productData: ScanResult) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

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

    if (error) throw error;
  };

  const handleManualScan = async () => {
    if (!barcode.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please enter a barcode number",
        variant: "destructive"
      });
      return;
    }

    const validation = validateBarcode(barcode);
    if (!validation.valid) {
      toast({
        title: "Invalid Barcode",
        description: "Please enter a valid barcode (8-14 digits)",
        variant: "destructive"
      });
      return;
    }

    setScanningStatus('verifying');
    setStatusMessage('Verifying product...');

    try {
      const productData = await verifyProduct(barcode, validation.type);
      
      if (productData) {
        await saveToDatabase(productData);
        setResult(productData);
        setScanningStatus('success');
        setStatusMessage('Product verified!');
        
        toast({
          title: "Product Found",
          description: productData.product_name || "Product verified",
        });
      } else {
        setScanningStatus('error');
        setStatusMessage('Product not found');
        toast({
          title: "Product Not Found",
          description: "This product is not in our database",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Manual scan error:', error);
      setScanningStatus('error');
      setStatusMessage('Error verifying product');
      toast({
        title: "Verification Error",
        description: error.message || "Failed to verify barcode",
        variant: "destructive"
      });
    }
  };

  const resetScanner = () => {
    stopCameraScanner();
    setResult(null);
    setScanningStatus('idle');
    setStatusMessage('');
    setBarcode('');
    setRetryCount(0);
    setShowSafetyDetails(false);
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden relative pt-16 pb-24 lg:pb-8">
      {/* Animated Background - Responsive */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-48 sm:w-72 md:w-96 h-48 sm:h-72 md:h-96 bg-gradient-to-br from-primary/15 to-secondary/10 rounded-full blur-3xl animate-float-orb" />
        <div className="absolute -bottom-20 -right-20 w-40 sm:w-64 md:w-80 h-40 sm:h-64 md:h-80 bg-gradient-to-br from-secondary/15 to-accent/10 rounded-full blur-3xl animate-float-orb" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 bg-gradient-to-br from-mint/10 to-primary/10 rounded-full blur-3xl animate-float-orb" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto px-3 sm:px-4 md:px-6">
        {/* Premium Header - Responsive */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20">
                <ShieldCheck className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Safety Scanner
                </h1>
                <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
                  Verify products for your baby
                </p>
              </div>
            </div>
            {cameraState === 'SCANNING' && (
              <div className="flex gap-1.5 sm:gap-2">
                {hasMultipleCameras && (
                  <Button variant="outline" size="icon" onClick={switchCamera} className="h-9 w-9 sm:h-10 sm:w-10 backdrop-blur-sm bg-background/50">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="outline" size="icon" onClick={toggleTorch} className="h-9 w-9 sm:h-10 sm:w-10 backdrop-blur-sm bg-background/50">
                  <Flashlight className={`h-4 w-4 ${torchEnabled ? 'text-accent' : ''}`} />
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Main Content - Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Left Column - Manual Entry */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-4 sm:p-6 backdrop-blur-xl bg-card/80 border-primary/10 shadow-xl h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-semibold">Manual Entry</h2>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Enter barcode number</p>
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <Label htmlFor="barcode" className="text-muted-foreground text-xs sm:text-sm">Barcode Number</Label>
                  <Input
                    id="barcode"
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g., 7891234567890"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    disabled={scanningStatus === 'verifying'}
                    className="mt-1 sm:mt-1.5 bg-muted/50 border-primary/10 focus:border-primary/30 h-10 sm:h-11"
                  />
                </div>
                <Button
                  onClick={handleManualScan}
                  disabled={scanningStatus === 'verifying'}
                  className="w-full h-10 sm:h-11 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg text-sm sm:text-base"
                >
                  {scanningStatus === 'verifying' ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Scan className="mr-2 h-4 w-4" />
                      Verify Barcode
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Right Column - Camera Scanner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-4 sm:p-6 backdrop-blur-xl bg-card/80 border-primary/10 shadow-xl overflow-hidden h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-br from-secondary/20 to-mint/20">
                  <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-semibold">Camera Scanner</h2>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Scan with your camera</p>
                </div>
              </div>
              
              {cameraState === 'IDLE' && (
                <Button 
                  onClick={startCameraScanner} 
                  className="w-full bg-gradient-to-r from-secondary to-mint hover:from-secondary/90 hover:to-mint/90 shadow-lg h-12 sm:h-14 text-sm sm:text-base"
                >
                  <Camera className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Start Camera Scanner
                </Button>
              )}

              {cameraState === 'REQUESTING_PERMISSION' && (
                <div className="text-center py-8 sm:py-12">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-glow-pulse" />
                    <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary relative" />
                  </div>
                  <p className="text-muted-foreground mt-3 sm:mt-4 text-sm">{statusMessage}</p>
                </div>
              )}

              {(cameraState === 'INITIALIZING' || cameraState === 'SCANNING') && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="relative rounded-xl sm:rounded-2xl overflow-hidden bg-black aspect-[4/3] shadow-2xl">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      autoPlay
                      playsInline
                      muted
                    />
                    <div id="barcode-reader" className="absolute inset-0" />
                    
                    {cameraState === 'INITIALIZING' && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <div className="text-center">
                          <div className="relative inline-block mb-3 sm:mb-4">
                            <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-glow-pulse" />
                            <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-white relative" />
                          </div>
                          <p className="text-white/90 font-medium text-sm sm:text-base">{statusMessage}</p>
                        </div>
                      </div>
                    )}
                    
                    {cameraState === 'SCANNING' && (
                      <>
                        {/* Scanning Badge */}
                        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 bg-mint text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 shadow-lg animate-pulse">
                          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full" />
                          Scanning
                        </div>

                        {/* Viewfinder - Responsive */}
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                          <div className="relative w-[70%] max-w-[280px] aspect-[16/10]">
                            <div className="absolute inset-0 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-mint/50 shadow-[0_0_20px_rgba(34,197,94,0.3)] sm:shadow-[0_0_30px_rgba(34,197,94,0.3)]" />
                            
                            {/* Corners */}
                            <div className="absolute -top-0.5 -left-0.5 w-8 sm:w-12 h-8 sm:h-12 border-t-2 sm:border-t-4 border-l-2 sm:border-l-4 border-mint rounded-tl-xl sm:rounded-tl-2xl" />
                            <div className="absolute -top-0.5 -right-0.5 w-8 sm:w-12 h-8 sm:h-12 border-t-2 sm:border-t-4 border-r-2 sm:border-r-4 border-mint rounded-tr-xl sm:rounded-tr-2xl" />
                            <div className="absolute -bottom-0.5 -left-0.5 w-8 sm:w-12 h-8 sm:h-12 border-b-2 sm:border-b-4 border-l-2 sm:border-l-4 border-mint rounded-bl-xl sm:rounded-bl-2xl" />
                            <div className="absolute -bottom-0.5 -right-0.5 w-8 sm:w-12 h-8 sm:h-12 border-b-2 sm:border-b-4 border-r-2 sm:border-r-4 border-mint rounded-br-xl sm:rounded-br-2xl" />
                            
                            {/* Scan Beam */}
                            <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-mint to-transparent shadow-[0_0_10px_rgba(34,197,94,0.8)] animate-scan-beam" />
                          </div>
                        </div>

                        {/* Status */}
                        <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 sm:px-6 py-1.5 sm:py-2.5 rounded-full text-xs sm:text-sm backdrop-blur-md font-medium max-w-[90%] text-center">
                          {statusMessage}
                        </div>

                        {/* Verifying Overlay */}
                        <AnimatePresence>
                          {scanningStatus === 'verifying' && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 bg-mint/20 backdrop-blur-sm flex items-center justify-center"
                            >
                              <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                className="bg-mint text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl text-base sm:text-lg font-bold shadow-2xl flex items-center gap-2 sm:gap-3"
                              >
                                <Loader2 className="h-5 w-5 sm:h-6 sm:w-6 animate-spin" />
                                Verifying...
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Success */}
                        <AnimatePresence>
                          {scanningStatus === 'success' && (
                            <motion.div
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="absolute inset-0 bg-mint/30 backdrop-blur-sm flex items-center justify-center"
                            >
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="bg-mint text-white px-8 sm:px-10 py-4 sm:py-5 rounded-xl sm:rounded-2xl text-lg sm:text-xl font-bold shadow-2xl flex items-center gap-2 sm:gap-3"
                              >
                                <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8" />
                                Success!
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs sm:text-sm text-muted-foreground truncate mr-2">{statusMessage}</p>
                    <Button variant="destructive" size="sm" onClick={stopCameraScanner} className="shadow-lg shrink-0">
                      <X className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Stop
                    </Button>
                  </div>
                </div>
              )}

              {cameraState === 'ERROR' && (
                <div className="text-center py-8 sm:py-12 space-y-3 sm:space-y-4">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-destructive/20 rounded-full blur-xl" />
                    <AlertTriangle className="h-12 w-12 sm:h-16 sm:w-16 text-destructive relative" />
                  </div>
                  <p className="text-muted-foreground text-sm">{statusMessage}</p>
                  <Button onClick={startCameraScanner} variant="outline" className="shadow-lg">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Try Again
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        {/* Result Card - Full Width Below Grid */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ type: "spring", damping: 20 }}
              className="mt-4 sm:mt-6"
            >
              <Card className="overflow-hidden border-0 shadow-2xl backdrop-blur-xl bg-card/90">
                {/* Safety Status Header */}
                <div className={`p-4 sm:p-6 ${
                  result.is_baby_safe 
                    ? 'bg-gradient-to-r from-green-500/20 via-emerald-500/15 to-teal-500/20' 
                    : 'bg-gradient-to-r from-red-500/20 via-rose-500/15 to-pink-500/20'
                }`}>
                  <div className="flex items-center gap-4 sm:gap-6">
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.2 }}
                      className={`relative p-3 sm:p-4 rounded-xl sm:rounded-2xl ${result.is_baby_safe ? 'bg-green-500' : 'bg-red-500'} shadow-xl`}
                    >
                      <div className={`absolute inset-0 rounded-xl sm:rounded-2xl ${result.is_baby_safe ? 'bg-green-500' : 'bg-red-500'} blur-xl opacity-50 animate-glow-pulse`} />
                      {result.is_baby_safe ? (
                        <ShieldCheck className="w-8 h-8 sm:w-12 sm:h-12 text-white relative" />
                      ) : (
                        <ShieldX className="w-8 h-8 sm:w-12 sm:h-12 text-white relative" />
                      )}
                    </motion.div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl sm:text-2xl font-bold truncate">{result.product_name || 'Unknown Product'}</h3>
                      {result.brands && (
                        <p className="text-muted-foreground text-sm truncate">{result.brands}</p>
                      )}
                      <p className={`text-sm sm:text-base font-semibold mt-1 ${result.is_baby_safe ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {result.is_baby_safe ? '✓ Safe for Your Baby' : '✗ Not Recommended'}
                      </p>
                    </div>

                    {result.nutrition_grade && (
                      <div className="hidden sm:block shrink-0">
                        <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl ${getNutritionGradeColor(result.nutrition_grade).bg} flex items-center justify-center shadow-xl`}>
                          <span className="text-2xl sm:text-3xl font-black text-white uppercase">{result.nutrition_grade}</span>
                        </div>
                        <p className="text-[10px] sm:text-xs text-center text-muted-foreground mt-1">Nutri-Score</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-4 sm:p-6 space-y-4">
                  {/* Mobile Nutri-Score */}
                  {result.nutrition_grade && (
                    <div className="flex sm:hidden items-center gap-3 p-3 rounded-xl bg-muted/50">
                      <div className={`w-10 h-10 rounded-lg ${getNutritionGradeColor(result.nutrition_grade).bg} flex items-center justify-center`}>
                        <span className="text-lg font-black text-white uppercase">{result.nutrition_grade}</span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">Nutri-Score</p>
                        <p className="text-xs text-muted-foreground">Nutritional quality rating</p>
                      </div>
                    </div>
                  )}

                  {/* Allergens */}
                  {result.allergens && result.allergens.length > 0 && (
                    <div className="p-3 sm:p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-center gap-2 mb-2 sm:mb-3">
                        <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
                        <h4 className="font-semibold text-amber-700 dark:text-amber-400 text-sm sm:text-base">Allergens</h4>
                      </div>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {result.allergens.map((allergen, idx) => (
                          <Badge key={idx} variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs">
                            {allergen}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Safety Notes */}
                  {result.safety_notes && (
                    <div className="p-3 sm:p-4 rounded-xl bg-primary/5 border border-primary/10">
                      <button 
                        onClick={() => setShowSafetyDetails(!showSafetyDetails)}
                        className="w-full flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                          <h4 className="font-semibold text-sm sm:text-base">Safety Information</h4>
                        </div>
                        {showSafetyDetails ? (
                          <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                        )}
                      </button>
                      <AnimatePresence>
                        {showSafetyDetails && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <p className="text-muted-foreground text-xs sm:text-sm mt-3 leading-relaxed">
                              {result.safety_notes}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Verification Badge */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="flex items-center gap-2">
                      {result.verified ? (
                        <Badge className="bg-mint/20 text-mint-foreground border-mint/30 text-xs">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Unverified
                        </Badge>
                      )}
                      {result.verification_source && (
                        <span className="text-[10px] sm:text-xs text-muted-foreground">
                          via {result.verification_source}
                        </span>
                      )}
                    </div>
                    <Button onClick={resetScanner} variant="outline" size="sm" className="text-xs sm:text-sm">
                      Scan Another
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default BarcodeScanner;
