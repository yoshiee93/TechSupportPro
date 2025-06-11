import { useState, useRef, useEffect } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, X, Scan } from "lucide-react";

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Always create a fresh instance when dialog opens
      codeReader.current = new BrowserMultiFormatReader();
      console.log('BrowserMultiFormatReader initialized');
    }

    return () => {
      if (codeReader.current) {
        console.log('Cleaning up barcode scanner');
        codeReader.current.reset();
        codeReader.current = null;
      }
    };
  }, [isOpen]);

  const requestCameraPermission = async () => {
    try {
      // First try with preferred settings
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          } 
        });
      } catch (err) {
        // Fallback to basic video only
        console.log('Preferred camera settings failed, trying basic settings:', err);
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: true 
        });
      }
      
      setHasPermission(true);
      setError(null);
      console.log('Camera permission granted successfully');
      
      // Stop the stream immediately - we'll start a new one for scanning
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (err) {
      console.error('Camera permission error:', err);
      setHasPermission(false);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Camera access denied. Please allow camera access in your browser settings. Error: ${errorMessage}`);
      return false;
    }
  };

  const triggerFocus = async () => {
    console.log('Focus button clicked');
    
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
      // Stop and restart the video track to trigger refocus
      const settings = videoTrack.getSettings();
      console.log('Current video settings:', settings);
      
      // Apply new constraints to force camera refocus
      await videoTrack.applyConstraints({
        width: { ideal: 1280 },
        height: { ideal: 720 },
        focusMode: "single-shot"
      } as any);
      
      console.log('Focus constraints applied successfully');
      
      // Also try triggering a focus event on the video element
      if (videoRef.current) {
        videoRef.current.focus();
        console.log('Video element focused');
      }
      
    } catch (err) {
      console.log('Focus operation failed, trying alternative method:', err);
      
      // Alternative: briefly pause and resume video
      try {
        if (videoRef.current) {
          videoRef.current.pause();
          await new Promise(resolve => setTimeout(resolve, 100));
          videoRef.current.play();
          console.log('Video restarted for focus');
        }
      } catch (restartErr) {
        console.log('Video restart failed:', restartErr);
      }
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

      const hasCamera = await requestCameraPermission();
      if (!hasCamera) {
        console.log('Camera permission denied');
        setIsScanning(false);
        return;
      }

      console.log('Starting barcode scanning...');
      
      // Start decoding with improved callback handling
      await codeReader.current.decodeFromVideoDevice(
        null, // Use default device
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
            </Alert>
          )}

          {!isScanning && !error && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Camera className="w-8 h-8 text-gray-400" />
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Click start to begin scanning barcodes with your camera
              </p>
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
                  title="Tap to refocus camera"
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
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}