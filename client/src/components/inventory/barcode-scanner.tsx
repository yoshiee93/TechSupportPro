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
    if (isOpen && !codeReader.current) {
      codeReader.current = new BrowserMultiFormatReader();
    }

    return () => {
      if (codeReader.current) {
        codeReader.current.reset();
      }
    };
  }, [isOpen]);

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "environment" // Use rear camera if available
        } 
      });
      setHasPermission(true);
      setError(null);
      
      // Stop the stream immediately - we'll start a new one for scanning
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (err) {
      setHasPermission(false);
      setError("Camera access denied. Please allow camera access to scan barcodes.");
      return false;
    }
  };

  const startScanning = async () => {
    if (!codeReader.current || !videoRef.current) return;

    try {
      setIsScanning(true);
      setError(null);

      const hasCamera = await requestCameraPermission();
      if (!hasCamera) return;

      // Start decoding from video device
      codeReader.current.decodeFromVideoDevice(
        null, // Use default device
        videoRef.current,
        (result, error) => {
          if (result) {
            const scannedText = result.getText();
            onScan(scannedText);
            stopScanning();
            onClose();
          }
          
          if (error && !(error instanceof NotFoundException)) {
            console.error("Scanning error:", error);
          }
        }
      );
    } catch (err) {
      console.error("Failed to start scanning:", err);
      setError("Failed to start camera. Please check your camera permissions.");
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
              
              <p className="text-sm text-center text-gray-600">
                Position the barcode within the frame to scan
              </p>
              
              <Button 
                onClick={stopScanning} 
                variant="outline" 
                className="w-full"
              >
                <X className="w-4 h-4 mr-2" />
                Stop Scanning
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}