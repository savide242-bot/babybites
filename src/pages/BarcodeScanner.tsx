import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scan, AlertTriangle, CheckCircle2, Camera, X, Loader2, Flashlight, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BrowserMultiFormatReader, BarcodeFormat } from "@zxing/browser";
import { Html5Qrcode } from "html5-qrcode";

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
    setRetryCount(0); // Reset retry count when stopping
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

      // CRITICAL: Connect stream to video element immediately
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
      } else {
        console.warn('⚠️ Video element not ready yet');
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setHasMultipleCameras(videoDevices.length > 1);
      console.log(`📹 Found ${videoDevices.length} camera(s)`);

      return true;
    } catch (error: any) {
      console.error('❌ Camera permission error:', error);
      setCameraState('ERROR');
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setStatusMessage('Camera access denied. Please enable camera in your browser settings.');
        toast({
          title: "Camera Access Denied",
          description: "Please enable camera permissions in your browser settings and try again.",
          variant: "destructive"
        });
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
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
        console.error('❌ Video element not found');
        throw new Error('Video element not found');
      }

      // CRITICAL: Ensure stream is connected to video
      if (!videoRef.current.srcObject && streamRef.current) {
        console.log('🔗 Connecting stream to video...');
        videoRef.current.srcObject = streamRef.current;
        await videoRef.current.play();
      }

      if (!videoRef.current.srcObject) {
        throw new Error('Video has no stream source');
      }

      console.log('⏳ Waiting for video to be ready...');
      await waitForVideoReady(videoRef.current, INIT_TIMEOUT);
      console.log('✅ Video ready:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);

      const codeReader = new BrowserMultiFormatReader();
      scannerRef.current = codeReader;

      const videoDevices = await BrowserMultiFormatReader.listVideoInputDevices();
      
      if (videoDevices.length === 0) {
        throw new Error('No camera devices found');
      }

      const selectedDevice = videoDevices.find(device => 
        device.label.toLowerCase().includes(cameraFacingMode === 'environment' ? 'back' : 'front')
      ) || videoDevices[0];

      console.log('📹 Selected camera:', selectedDevice.label);

      await codeReader.decodeFromVideoDevice(
        selectedDevice.deviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            const detectedCode = result.getText();
            console.log('📸 ZXing detected:', detectedCode);
            handleBarcodeDetected(detectedCode);
          }
        }
      );

      setCameraState('SCANNING');
      setScanningStatus('scanning');
      setStatusMessage('Point camera at barcode...');
      console.log('✅ ZXing scanner initialized');
      
      return true;
    } catch (error: any) {
      console.error('❌ ZXing initialization error:', error);
      setStatusMessage(error.message || 'Scanner initialization failed');
      return false;
    }
  };

  const initializeHtml5QrCodeScanner = async (): Promise<boolean> => {
    try {
      console.log('🔧 Initializing HTML5-QRCode scanner (fallback)...');
      setCameraState('INITIALIZING');
      setStatusMessage('Initializing fallback scanner...');

      await new Promise(resolve => setTimeout(resolve, 200));

      const readerElement = document.getElementById('barcode-reader');
      if (!readerElement) {
        console.error('❌ barcode-reader element not found');
        throw new Error('HTML Element with id=barcode-reader not found');
      }

      // Connect stream to video if available
      if (streamRef.current && videoRef.current && !videoRef.current.srcObject) {
        videoRef.current.srcObject = streamRef.current;
        await videoRef.current.play();
      }

      const html5QrCode = new Html5Qrcode("barcode-reader");
      html5QrCodeRef.current = html5QrCode;

      const startPromise = html5QrCode.start(
        { facingMode: cameraFacingMode },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          console.log('📸 HTML5-QRCode detected:', decodedText);
          handleBarcodeDetected(decodedText);
        },
        (errorMessage) => {
          // Scanning errors are normal, ignore
        }
      );

      const timeoutPromise = new Promise((_, reject) => {
        initTimeoutRef.current = setTimeout(() => {
          reject(new Error('HTML5-QRCode initialization timeout'));
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
      console.log('✅ HTML5-QRCode scanner initialized');
      
      return true;
    } catch (error: any) {
      console.error('❌ HTML5-QRCode initialization error:', error);
      setStatusMessage(error.message || 'Fallback scanner initialization failed');
      return false;
    }
  };

  const checkBrowserCompatibility = (): { compatible: boolean; issues: string[] } => {
    const issues: string[] = [];
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      issues.push('Camera access not supported in this browser');
    }
    
    if (!window.MediaStream) {
      issues.push('Media streaming not supported');
    }
    
    const isSecureContext = window.isSecureContext || location.protocol === 'https:';
    if (!isSecureContext && location.hostname !== 'localhost') {
      issues.push('Camera requires HTTPS connection');
    }
    
    return {
      compatible: issues.length === 0,
      issues
    };
  };

  const startCameraScanner = async () => {
    try {
      console.log('🚀 Starting camera scanner...');
      
      const compatibility = checkBrowserCompatibility();
      if (!compatibility.compatible) {
        throw new Error(`Browser incompatibility: ${compatibility.issues.join(', ')}`);
      }
      
      setCameraState('INITIALIZING');
      
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) return;

      let success = false;

      // Try ZXing first
      if (scannerMethod === 'zxing') {
        success = await initializeZXingScanner();
        
        if (!success) {
          console.log('⚠️ ZXing failed, trying HTML5-QRCode...');
          toast({
            title: "Switching Scanner",
            description: "Trying alternative method...",
          });
          setScannerMethod('html5qrcode');
          success = await initializeHtml5QrCodeScanner();
        }
      } else {
        success = await initializeHtml5QrCodeScanner();
        
        if (!success) {
          console.log('⚠️ HTML5-QRCode failed, trying ZXing...');
          setScannerMethod('zxing');
          success = await initializeZXingScanner();
        }
      }

      if (!success) {
        throw new Error('Scanner initialization failed. Please check camera permissions and try again.');
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
      setStatusMessage(error.message || 'Failed to start scanner. Please use manual entry.');
      toast({
        title: "Scanner Error",
        description: error.message || "Failed to initialize camera. Please try manual entry.",
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
        toast({
          title: torchEnabled ? "Flashlight Off" : "Flashlight On",
        });
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
    setTimeout(() => {
      startCameraScanner();
    }, 500);
  };

  const handleBarcodeDetected = (decodedText: string) => {
    if (scanCooldown) return;

    const validation = validateBarcode(decodedText);
    if (!validation.valid) return;

    const newBuffer = new Map(scanBuffer);
    const count = (newBuffer.get(decodedText) || 0) + 1;
    newBuffer.set(decodedText, count);
    setScanBuffer(newBuffer);
    
    setStatusMessage(`Scan ${count}/${CONFIRMATION_THRESHOLD} - Keep steady...`);

    if (count >= CONFIRMATION_THRESHOLD) {
      processConfirmedScan(decodedText, validation.type);
    }
  };

  const processConfirmedScan = async (confirmedBarcode: string, barcodeType: string) => {
    console.log('✅ Barcode confirmed:', confirmedBarcode);
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
        setStatusMessage('Product verified successfully!');
        
        toast({
          title: "Product Scanned",
          description: productData.product_name || "Product information retrieved",
        });
      } else {
        setScanningStatus('error');
        setStatusMessage('Product not found in database');
        toast({
          title: "Product Not Found",
          description: "This product is not in our database yet.",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('❌ Scan processing error:', error);
      setScanningStatus('error');
      setStatusMessage('Error processing scan');
      toast({
        title: "Scan Error",
        description: error.message || "Failed to process barcode",
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
    try {
      const { data, error } = await supabase.functions.invoke('verify-product', {
        body: { barcode, barcodeType }
      });

      if (error) throw error;
      return data as ScanResult;
    } catch (error: any) {
      console.error('Product verification error:', error);
      throw error;
    }
  };

  const saveToDatabase = async (productData: ScanResult) => {
    try {
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
      console.log('✅ Product saved to database');
    } catch (error: any) {
      console.error('Database save error:', error);
      throw error;
    }
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
        setStatusMessage('Product verified successfully!');
        
        toast({
          title: "Product Found",
          description: productData.product_name || "Product information retrieved",
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
    setRetryCount(0); // Reset retry count
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Barcode Scanner</h1>
          {cameraState === 'SCANNING' && (
            <div className="flex gap-2">
              {hasMultipleCameras && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={switchCamera}
                  title="Switch Camera"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTorch}
                title="Toggle Flashlight"
              >
                <Flashlight className={`h-4 w-4 ${torchEnabled ? 'text-yellow-500' : ''}`} />
              </Button>
            </div>
          )}
        </div>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Manual Entry</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="barcode">Enter Barcode Number</Label>
              <Input
                id="barcode"
                type="text"
                placeholder="e.g., 7891234567890"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                disabled={scanningStatus === 'verifying'}
              />
            </div>
            <Button
              onClick={handleManualScan}
              disabled={scanningStatus === 'verifying'}
              className="w-full"
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

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Camera Scanner</h2>
          
          {cameraState === 'IDLE' && (
            <Button onClick={startCameraScanner} className="w-full">
              <Camera className="mr-2 h-4 w-4" />
              Start Camera
            </Button>
          )}

          {cameraState === 'REQUESTING_PERMISSION' && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">{statusMessage}</p>
            </div>
          )}

          {(cameraState === 'INITIALIZING' || cameraState === 'SCANNING') && (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                <div id="barcode-reader" className="absolute inset-0" />
                
                {cameraState === 'INITIALIZING' && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-white" />
                      <p className="text-sm text-white">{statusMessage}</p>
                    </div>
                  </div>
                )}
                
                {cameraState === 'SCANNING' && (
                  <>
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute inset-0 border-2 border-primary/50 animate-pulse" />
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-32 border-2 border-primary rounded-lg transition-all duration-300" />
                    </div>

                    {scanningStatus === 'confirming' && (
                      <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-full text-sm font-medium animate-in zoom-in-50 duration-300 shadow-lg">
                        ✓ Detected! Confirming...
                      </div>
                    )}
                    
                    {scanningStatus === 'verifying' && (
                      <div className="absolute inset-0 bg-green-500/20 animate-pulse backdrop-blur-sm flex items-center justify-center">
                        <div className="bg-green-500 text-white px-6 py-3 rounded-full text-sm font-medium shadow-2xl animate-in zoom-in-75 duration-500">
                          ✓ Verifying Product...
                        </div>
                      </div>
                    )}
                    
                    {scanningStatus === 'success' && (
                      <div className="absolute inset-0 bg-green-500/30 animate-in fade-in duration-300 backdrop-blur-sm flex items-center justify-center">
                        <div className="bg-green-500 text-white px-6 py-3 rounded-full text-lg font-bold shadow-2xl animate-in zoom-in-95 duration-700 scale-110">
                          ✓ Success!
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{statusMessage}</p>
                <Button variant="destructive" size="sm" onClick={stopCameraScanner}>
                  <X className="mr-2 h-4 w-4" />
                  Stop
                </Button>
              </div>
            </div>
          )}

          {cameraState === 'ERROR' && (
            <div className="text-center py-8 space-y-4">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
              <p className="text-sm text-muted-foreground">{statusMessage}</p>
              <Button onClick={startCameraScanner} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          )}
        </Card>

        {result && scanningStatus === 'success' && (
          <Card className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <h2 className="text-lg font-semibold">Scan Result</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={resetScanner}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {result.image_url && (
                <img
                  src={result.image_url}
                  alt={result.product_name}
                  className="w-full h-48 object-contain rounded-lg bg-muted"
                />
              )}

              <div>
                <h3 className="font-semibold text-lg">{result.product_name}</h3>
                {result.brands && (
                  <p className="text-sm text-muted-foreground">{result.brands}</p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Baby Safe:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  result.is_baby_safe
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                }`}>
                  {result.is_baby_safe ? 'Yes' : 'No'}
                </span>
              </div>

              {result.nutrition_grade && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Nutrition Grade:</span>
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded text-sm font-bold">
                    {result.nutrition_grade.toUpperCase()}
                  </span>
                </div>
              )}

              {result.allergens && result.allergens.length > 0 && (
                <div>
                  <span className="text-sm font-medium block mb-2">Allergens:</span>
                  <div className="flex flex-wrap gap-2">
                    {result.allergens.map((allergen, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 rounded text-xs"
                      >
                        {allergen}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {result.safety_notes && (
                <div>
                  <span className="text-sm font-medium block mb-2">Safety Notes:</span>
                  <p className="text-sm text-muted-foreground">{result.safety_notes}</p>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Barcode: {result.barcode} ({result.barcode_type})
                </p>
                <p className="text-xs text-muted-foreground">
                  Source: {result.verification_source}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BarcodeScanner;
