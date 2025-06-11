import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { X, Camera, AlertCircle } from 'lucide-react';

interface BarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
  title?: string;
}

export default function BarcodeScanner({ isOpen, onClose, onScan, title = "Scan Barcode" }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!isOpen) {
      cleanup();
    }
    return cleanup;
  }, [isOpen]);

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
    setError(null);
  };

  const startScanning = async () => {
    if (isScanning) return;

    try {
      setError(null);
      setIsScanning(true);

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Initialize barcode reader
      const codeReader = new BrowserMultiFormatReader();
      
      // Start scanning
      codeReader.decodeFromVideoDevice(
        undefined, // Use default camera
        videoRef.current!,
        (result) => {
          if (result) {
            cleanup();
            onScan(result.getText());
            onClose();
          }
        }
      );

    } catch (err: any) {
      setError(`Camera access failed: ${err?.message || 'Unknown error'}. Please allow camera access.`);
      setIsScanning(false);
    }
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              {title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            
            {!isScanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-center text-white">
                  <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Camera preview will appear here</p>
                </div>
              </div>
            )}

            {isScanning && (
              <div className="absolute inset-0 border-4 border-blue-500 rounded-lg pointer-events-none">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <div className="w-48 h-32 border-2 border-red-500 rounded-lg"></div>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {!isScanning ? (
              <Button onClick={startScanning} className="flex-1">
                <Camera className="w-4 h-4 mr-2" />
                Start Scanning
              </Button>
            ) : (
              <Button onClick={cleanup} variant="destructive" className="flex-1">
                Stop Scanning
              </Button>
            )}
            
            <Button onClick={handleClose} variant="outline">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}