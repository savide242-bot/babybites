import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Scan, AlertTriangle, CheckCircle2, Camera, X, Loader2, Flashlight, 
  RefreshCw, ShieldCheck, ShieldX, ShieldAlert, Sparkles, Info,
  Package, AlertCircle, ChevronDown, ChevronUp
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
  const colors: Record<string, { bg: string; text: string; glow: string }> = {
    a: { bg: 'bg-green-500', text: 'text-green-500', glow: 'shadow-green-500/50' },
    b: { bg: 'bg-lime-500', text: 'text-lime-500', glow: 'shadow-lime-500/50' },
    c: { bg: 'bg-yellow-500', text: 'text-yellow-500', glow: 'shadow-yellow-500/50' },
    d: { bg: 'bg-orange-500', text: 'text-orange-500', glow: 'shadow-orange-500/50' },
    e: { bg: 'bg-red-500', text: 'text-red-500', glow: 'shadow-red-500/50' },
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
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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
    <div className="min-h-screen bg-background overflow-hidden relative">
      {/* Animated Background Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-br from-primary/20 to-secondary/10 rounded-full blur-3xl animate-float-orb" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-gradient-to-br from-secondary/20 to-accent/10 rounded-full blur-3xl animate-float-orb" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-mint/10 to-primary/10 rounded-full blur-3xl animate-float-orb" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6 pb-24">
        {/* Premium Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Safety Scanner
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Verify products for your baby's safety
              </p>
            </div>
            {cameraState === 'SCANNING' && (
              <div className="flex gap-2">
                {hasMultipleCameras && (
                  <Button variant="outline" size="icon" onClick={switchCamera} className="backdrop-blur-sm bg-background/50">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
                <Button variant="outline" size="icon" onClick={toggleTorch} className="backdrop-blur-sm bg-background/50">
                  <Flashlight className={`h-4 w-4 ${torchEnabled ? 'text-accent' : ''}`} />
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Manual Entry Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6 backdrop-blur-xl bg-card/80 border-primary/10 shadow-xl mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Manual Entry</h2>
                <p className="text-xs text-muted-foreground">Enter barcode number</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="barcode" className="text-muted-foreground text-sm">Barcode Number</Label>
                <Input
                  id="barcode"
                  type="text"
                  placeholder="e.g., 7891234567890"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  disabled={scanningStatus === 'verifying'}
                  className="mt-1.5 bg-muted/50 border-primary/10 focus:border-primary/30"
                />
              </div>
              <Button
                onClick={handleManualScan}
                disabled={scanningStatus === 'verifying'}
                className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg"
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

        {/* Camera Scanner Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 backdrop-blur-xl bg-card/80 border-primary/10 shadow-xl mb-6 overflow-hidden">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-secondary/20 to-mint/20">
                <Camera className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Camera Scanner</h2>
                <p className="text-xs text-muted-foreground">Scan barcodes with your camera</p>
              </div>
            </div>
            
            {cameraState === 'IDLE' && (
              <Button 
                onClick={startCameraScanner} 
                className="w-full bg-gradient-to-r from-secondary to-mint hover:from-secondary/90 hover:to-mint/90 shadow-lg h-14 text-base"
              >
                <Camera className="mr-2 h-5 w-5" />
                Start Camera Scanner
              </Button>
            )}

            {cameraState === 'REQUESTING_PERMISSION' && (
              <div className="text-center py-12">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-glow-pulse" />
                  <Loader2 className="h-12 w-12 animate-spin text-primary relative" />
                </div>
                <p className="text-muted-foreground mt-4">{statusMessage}</p>
              </div>
            )}

            {(cameraState === 'INITIALIZING' || cameraState === 'SCANNING') && (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden bg-black aspect-video shadow-2xl">
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
                        <div className="relative inline-block mb-4">
                          <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl animate-glow-pulse" />
                          <Loader2 className="h-10 w-10 animate-spin text-white relative" />
                        </div>
                        <p className="text-white/90 font-medium">{statusMessage}</p>
                      </div>
                    </div>
                  )}
                  
                  {cameraState === 'SCANNING' && (
                    <>
                      {/* Scanning Active Badge */}
                      <div className="absolute top-4 left-4 bg-mint text-white px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg animate-pulse-soft">
                        <span className="w-2 h-2 bg-white rounded-full" />
                        Scanning
                      </div>

                      {/* Premium Viewfinder */}
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <div className="relative w-72 h-44">
                          {/* Glowing Border */}
                          <div className="absolute inset-0 rounded-2xl border-4 border-mint/50 shadow-[0_0_30px_rgba(34,197,94,0.3)]" />
                          
                          {/* Animated Corners */}
                          <div className="absolute -top-1 -left-1 w-12 h-12 border-t-4 border-l-4 border-mint rounded-tl-2xl" />
                          <div className="absolute -top-1 -right-1 w-12 h-12 border-t-4 border-r-4 border-mint rounded-tr-2xl" />
                          <div className="absolute -bottom-1 -left-1 w-12 h-12 border-b-4 border-l-4 border-mint rounded-bl-2xl" />
                          <div className="absolute -bottom-1 -right-1 w-12 h-12 border-b-4 border-r-4 border-mint rounded-br-2xl" />
                          
                          {/* Scanning Beam */}
                          <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-mint to-transparent shadow-[0_0_10px_rgba(34,197,94,0.8)] animate-scan-beam" />
                        </div>
                      </div>

                      {/* Status Message */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-6 py-2.5 rounded-full text-sm backdrop-blur-md font-medium">
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
                              className="bg-mint text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-2xl flex items-center gap-3"
                            >
                              <Loader2 className="h-6 w-6 animate-spin" />
                              Verifying Product...
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Success Flash */}
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
                              className="bg-mint text-white px-10 py-5 rounded-2xl text-xl font-bold shadow-2xl flex items-center gap-3"
                            >
                              <CheckCircle2 className="h-8 w-8" />
                              Success!
                            </motion.div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{statusMessage}</p>
                  <Button variant="destructive" size="sm" onClick={stopCameraScanner} className="shadow-lg">
                    <X className="mr-2 h-4 w-4" />
                    Stop
                  </Button>
                </div>
              </div>
            )}

            {cameraState === 'ERROR' && (
              <div className="text-center py-12 space-y-4">
                <div className="relative inline-block">
                  <div className="absolute inset-0 bg-destructive/20 rounded-full blur-xl" />
                  <AlertTriangle className="h-16 w-16 text-destructive relative" />
                </div>
                <p className="text-muted-foreground">{statusMessage}</p>
                <Button onClick={startCameraScanner} variant="outline" className="shadow-lg">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Premium Result Card */}
        <AnimatePresence>
          {result && scanningStatus === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", duration: 0.5 }}
            >
              <Card className="overflow-hidden backdrop-blur-xl bg-card/90 border-0 shadow-2xl">
                {/* Safety Status Header */}
                <div className={`p-6 ${result.is_baby_safe ? 'bg-gradient-to-r from-mint/20 via-secondary/10 to-mint/20' : 'bg-gradient-to-r from-destructive/20 via-orange-500/10 to-destructive/20'}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <motion.div 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.2 }}
                        className="relative"
                      >
                        <div className={`absolute inset-0 rounded-full blur-xl ${result.is_baby_safe ? 'bg-mint/40' : 'bg-destructive/40'} animate-glow-pulse`} />
                        <div className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-2xl ${result.is_baby_safe ? 'bg-gradient-to-br from-mint to-secondary' : 'bg-gradient-to-br from-destructive to-orange-500'}`}>
                          {result.is_baby_safe ? (
                            <ShieldCheck className="w-10 h-10 text-white" />
                          ) : (
                            <ShieldX className="w-10 h-10 text-white" />
                          )}
                        </div>
                      </motion.div>
                      <div>
                        <motion.h2 
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 }}
                          className={`text-2xl font-bold ${result.is_baby_safe ? 'text-mint' : 'text-destructive'}`}
                        >
                          {result.is_baby_safe ? 'Safe for Baby' : 'Not Recommended'}
                        </motion.h2>
                        <motion.p 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="text-muted-foreground"
                        >
                          {result.is_baby_safe ? 'This product meets safety guidelines' : 'Review safety notes below'}
                        </motion.p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={resetScanner} className="hover:bg-background/50">
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-6 space-y-6">
                  {/* Product Header */}
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex gap-4"
                  >
                    {result.image_url && (
                      <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <img
                          src={result.image_url}
                          alt={result.product_name}
                          className="w-24 h-24 object-contain rounded-2xl bg-muted/50 p-2 relative transition-transform group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-xl">{result.product_name}</h3>
                      {result.brands && (
                        <p className="text-muted-foreground">{result.brands}</p>
                      )}
                      
                      {/* Nutrition Grade Badge */}
                      {result.nutrition_grade && (
                        <div className="mt-3 inline-flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Nutri-Score:</span>
                          <div className={`w-10 h-10 rounded-xl ${getNutritionGradeColor(result.nutrition_grade).bg} flex items-center justify-center text-white font-bold text-lg shadow-lg ${getNutritionGradeColor(result.nutrition_grade).glow}`}>
                            {result.nutrition_grade.toUpperCase()}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {/* Allergens */}
                  {result.allergens && result.allergens.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="h-4 w-4 text-orange-500" />
                        <span className="font-semibold text-sm">Allergens</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {result.allergens.map((allergen, index) => (
                          <motion.span
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.7 + index * 0.1 }}
                            className="px-3 py-1.5 bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/50 dark:to-amber-900/50 text-orange-700 dark:text-orange-300 rounded-full text-sm font-medium shadow-sm"
                          >
                            {allergen}
                          </motion.span>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Safety Notes */}
                  {result.safety_notes && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                    >
                      <button
                        onClick={() => setShowSafetyDetails(!showSafetyDetails)}
                        className="flex items-center justify-between w-full p-4 rounded-xl bg-muted/50 hover:bg-muted/70 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4 text-primary" />
                          <span className="font-semibold text-sm">Safety Details</span>
                        </div>
                        {showSafetyDetails ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
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
                            <p className="p-4 text-sm text-muted-foreground leading-relaxed">
                              {result.safety_notes}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}

                  {/* Barcode Info Footer */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="pt-4 border-t border-border/50"
                  >
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Barcode: {result.barcode} ({result.barcode_type})</span>
                      <span className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        {result.verification_source}
                      </span>
                    </div>
                  </motion.div>

                  {/* Scan Another Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                  >
                    <Button
                      onClick={resetScanner}
                      className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 shadow-lg h-12"
                    >
                      <Scan className="mr-2 h-5 w-5" />
                      Scan Another Product
                    </Button>
                  </motion.div>
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
