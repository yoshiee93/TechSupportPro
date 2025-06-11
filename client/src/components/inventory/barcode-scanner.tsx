import { useState, useRef, useEffect } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Camera, X, Scan, Smartphone } from "lucide-react";

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
  title?: string;
}

export default function BarcodeScanner({ isOpen, onClose, onScan, title = "Scan Barcode" }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isMobile, setIsMobile] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Always create a fresh instance when dialog opens
      codeReader.current = new BrowserMultiFormatReader();
      console.log('BrowserMultiFormatReader initialized');
      
      // Detect if mobile device
      const checkMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(checkMobile);
      
      // Enumerate cameras if mobile
      if (checkMobile) {
        enumerateCameras();
      }
    }

    return () => {
      if (codeReader.current) {
        console.log('Cleaning up barcode scanner');
        codeReader.current.reset();
        codeReader.current = null;
      }
    };
  }, [isOpen]);

  const enumerateCameras = async () => {
    try {
      // Request basic camera permission first to get device labels
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      
      // Now enumerate devices with proper labels
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      // Filter for rear cameras (Samsung phones)
      const rearCameras = videoDevices.filter(device => {
        const label = device.label.toLowerCase();
        return label.includes('back') || label.includes('rear') || 
               (!label.includes('front') && !label.includes('user'));
      });
      
      console.log('Available cameras:', videoDevices);
      console.log('Rear cameras found:', rearCameras);
      
      setAvailableCameras(rearCameras);
      
      // Auto-select the first rear camera (usually main camera)
      if (rearCameras.length > 0) {
        setSelectedCameraId(rearCameras[0].deviceId);
      }
      
    } catch (err) {
      console.log('Camera enumeration failed:', err);
      // Fallback to default camera selection
    }
  };

  const getCameraDisplayName = (device: MediaDeviceInfo) => {
    const label = device.label.toLowerCase();
    
    if (label.includes('ultra') || label.includes('wide')) {
      return '📐 Ultra Wide';
    } else if (label.includes('telephoto') || label.includes('tele') || label.includes('zoom')) {
      return '🔍 Telephoto';
    } else if (label.includes('macro')) {
      return '🔬 Macro';
    } else {
      return '📷 Main Camera';
    }
  };

  const requestCameraPermission = async (cameraId?: string) => {
    try {
      // Check if mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported by this browser');
      }

      console.log('Attempting to request camera permission...', cameraId ? `for camera: ${cameraId}` : 'default');
      
      // Build video constraints
      const videoConstraints: MediaTrackConstraints = {
        facingMode: "environment"
      };
      
      // Use specific camera if provided
      if (cameraId) {
        videoConstraints.deviceId = { exact: cameraId };
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: videoConstraints 
      });
      
      setHasPermission(true);
      setError(null);
      console.log('Camera permission granted successfully');
      
      // Stop the stream immediately - we'll start a new one for scanning
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (err) {
      console.error('Camera permission error:', err);
      setHasPermission(false);
      
      let errorMessage = 'Camera access denied';
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Camera access denied. Please click the camera icon in your browser address bar and allow camera access.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No camera found. Please ensure your device has a camera.';
        } else if (err.name === 'NotSupportedError') {
          errorMessage = 'Camera not supported by this browser.';
        } else {
          errorMessage = `Camera error: ${err.message}`;
        }
      }
      
      setError(errorMessage);
      return false;
    }
  };

  const triggerFocus = async () => {
    console.log('Focus button clicked - attempting Samsung-compatible focus');
    
    if (!videoRef.current || !videoRef.current.srcObject) {
      console.log('No video stream available for focusing');
      return;
    }

    const stream = videoRef.current.srcObject as MediaStream;
    const videoTrack = stream.getVideoTracks()[0];
    
    if (!videoTrack) {
      console.log('No video track available');
      return;
    }

    try {
      // Method 1: Try torch toggle (works on many Samsung phones)
      const capabilities = videoTrack.getCapabilities();
      console.log('Camera capabilities:', capabilities);
      
      if ('torch' in capabilities) {
        try {
          await videoTrack.applyConstraints({ torch: true } as any);
          await new Promise(resolve => setTimeout(resolve, 200));
          await videoTrack.applyConstraints({ torch: false } as any);
          console.log('Torch focus method applied');
          return;
        } catch (torchErr) {
          console.log('Torch method failed:', torchErr);
        }
      }
      
      // Method 2: Restart camera stream for Samsung phones
      console.log('Attempting camera stream restart for focus...');
      const currentConstraints = videoTrack.getConstraints();
      
      // Stop current track
      videoTrack.stop();
      
      // Wait briefly
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Request new stream with same constraints
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          ...currentConstraints,
          facingMode: "environment"
        }
      });
      
      // Replace video source
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
        console.log('Camera stream restarted successfully for focus');
      }
      
    } catch (err) {
      console.log('All focus methods failed:', err);
      
      // Fallback: Just try to restart video element
      try {
        if (videoRef.current) {
          videoRef.current.pause();
          await new Promise(resolve => setTimeout(resolve, 100));
          await videoRef.current.play();
          console.log('Video element restarted as fallback');
        }
      } catch (fallbackErr) {
        console.log('Fallback focus failed:', fallbackErr);
      }
    }
  };

  const switchCamera = async (newCameraId: string) => {
    if (!isScanning) {
      setSelectedCameraId(newCameraId);
      return;
    }

    console.log('Switching camera during scanning to:', newCameraId);
    
    // Stop current scanning
    if (codeReader.current) {
      codeReader.current.reset();
    }
    
    // Update selected camera
    setSelectedCameraId(newCameraId);
    
    // Wait briefly for cleanup
    await new Promise(resolve => setTimeout(resolve, 200));
    
    try {
      // Start with new camera
      await codeReader.current.decodeFromVideoDevice(
        newCameraId,
        videoRef.current,
        (result, error) => {
          if (result) {
            const scannedText = result.getText();
            console.log('Barcode detected successfully:', {
              text: scannedText,
              format: result.getBarcodeFormat(),
              length: scannedText.length,
              rawBytes: Array.from(scannedText).map(c => c.charCodeAt(0)),
              trimmed: scannedText.trim(),
              timestamp: new Date().toISOString()
            });
            
            const cleanText = scannedText.trim();
            console.log('Sending cleaned barcode to parent:', cleanText);
            onScan(cleanText);
            stopScanning();
            onClose();
          }
          
          if (error && !(error instanceof NotFoundException)) {
            console.error("Scanning error:", error);
          }
          
          if (!result && Math.random() < 0.01) {
            console.log('Scanner actively looking for barcodes...');
          }
        }
      );
      
      console.log('Camera switched successfully');
    } catch (err) {
      console.error('Camera switch failed:', err);
      setError('Failed to switch camera. Please try again.');
      setIsScanning(false);
    }
  };

  const startScanning = async () => {
    console.log('Start scanning button clicked');
    
    // Ensure scanner is initialized
    if (!codeReader.current) {
      console.log('Initializing codeReader...');
      codeReader.current = new BrowserMultiFormatReader();
    }
    
    // Set scanning state first to show video element
    setIsScanning(true);
    setError(null);
    
    // Wait for video element to be rendered
    await new Promise(resolve => setTimeout(resolve, 100));
    
    if (!videoRef.current) {
      console.log('Video element not available after render');
      setError("Video element not available");
      setIsScanning(false);
      return;
    }
    
    console.log('Scanner components ready:', { 
      hasCodeReader: !!codeReader.current, 
      hasVideoRef: !!videoRef.current 
    });

    try {
      console.log('Requesting camera permission...');

      const hasCamera = await requestCameraPermission(selectedCameraId);
      if (!hasCamera) {
        console.log('Camera permission denied');
        setIsScanning(false);
        return;
      }

      console.log('Starting barcode scanning...');
      
      // Start decoding with selected camera device
      await codeReader.current.decodeFromVideoDevice(
        selectedCameraId || null, // Use selected camera or default
        videoRef.current,
        (result, error) => {
          if (result) {
            const scannedText = result.getText();
            console.log('Barcode detected successfully:', {
              text: scannedText,
              format: result.getBarcodeFormat(),
              length: scannedText.length,
              rawBytes: Array.from(scannedText).map(c => c.charCodeAt(0)),
              trimmed: scannedText.trim(),
              timestamp: new Date().toISOString()
            });
            
            // Ensure we pass a clean, consistent value
            const cleanText = scannedText.trim();
            console.log('Sending cleaned barcode to parent:', cleanText);
            onScan(cleanText);
            stopScanning();
            onClose();
          }
          
          // Log scanning attempts (but not NotFoundException which is normal)
          if (error && !(error instanceof NotFoundException)) {
            console.error("Scanning error:", error);
          }
          
          // Add periodic logging to show scanning is active
          if (!result && Math.random() < 0.01) { // Log 1% of scans to show activity
            console.log('Scanner actively looking for barcodes...');
          }
        }
      );
      
      // Trigger focus after a short delay
      setTimeout(() => {
        triggerFocus();
      }, 1000);
      
      console.log('Barcode scanner started successfully - camera will auto-focus for better detection');
    } catch (err) {
      console.error("Failed to start scanning:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(`Failed to start camera: ${errorMessage}`);
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReader.current) {
      codeReader.current.reset();
    }
    setIsScanning(false);
  };

  const handleClose = () => {
    stopScanning();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      stopScanning();
      setError(null);
      setHasPermission(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scan className="w-5 h-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
              <div className="mt-3 space-y-2">
                <Button 
                  onClick={() => {
                    setError(null);
                    setHasPermission(null);
                  }} 
                  variant="outline" 
                  size="sm"
                  className="w-full"
                >
                  Try Again
                </Button>
                <div className="text-xs text-gray-500">
                  If camera access keeps failing, check browser settings or try refreshing the page
                </div>
              </div>
            </Alert>
          )}

          {!isScanning && !error && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Camera className="w-8 h-8 text-gray-400" />
                </div>
              </div>
              
              {/* Camera Selector for Mobile */}
              {isMobile && availableCameras.length > 1 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                    <Smartphone className="w-4 h-4" />
                    Multiple cameras detected
                  </div>
                  <Select value={selectedCameraId} onValueChange={setSelectedCameraId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select camera" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCameras.map((camera) => (
                        <SelectItem key={camera.deviceId} value={camera.deviceId}>
                          {getCameraDisplayName(camera)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-gray-500">
                    💡 Ultra-wide for large items, telephoto for small/distant barcodes
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Click start to begin scanning barcodes with your camera
                </p>
                <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                  ⚠️ Make sure to allow camera access when prompted by your browser
                </div>
              </div>
              <Button onClick={startScanning} className="w-full">
                <Camera className="w-4 h-4 mr-2" />
                Start Camera
              </Button>
            </div>
          )}

          {isScanning && (
            <div className="space-y-4">
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full h-64 bg-black rounded-lg object-cover"
                  autoPlay
                  playsInline
                  muted
                />
                
                {/* Scanning overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-32 border-2 border-blue-500 rounded-lg relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500"></div>
                  </div>
                </div>
              </div>
              
              {/* Camera Selector During Scanning */}
              {isMobile && availableCameras.length > 1 && (
                <div className="space-y-2">
                  <div className="text-xs text-center text-gray-600">Switch Camera:</div>
                  <Select value={selectedCameraId} onValueChange={switchCamera}>
                    <SelectTrigger className="w-full h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCameras.map((camera) => (
                        <SelectItem key={camera.deviceId} value={camera.deviceId}>
                          {getCameraDisplayName(camera)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Position the barcode within the frame to scan
                </p>
                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  💡 Tips: Hold steady, ensure good lighting, try different distances from camera
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  onClick={triggerFocus} 
                  variant="outline" 
                  size="sm"
                  title="Tap to refocus camera (optimized for Samsung phones)"
                >
                  <Camera className="w-4 h-4 mr-1" />
                  Focus
                </Button>
                <Button 
                  onClick={stopScanning} 
                  variant="outline" 
                  size="sm"
                >
                  <X className="w-4 h-4 mr-1" />
                  Stop
                </Button>
              </div>
              <div className="text-xs text-gray-500 text-center">
                Samsung phones: Focus button restarts camera for better detection
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}