import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const currentStream = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      initializeScanner();
    } else {
      cleanup();
    }

    return () => cleanup();
  }, [isOpen]);

  const cleanup = () => {
    if (codeReader.current) {
      try {
        // The ZXing library doesn't have stopAsyncDecode, just set to null
        codeReader.current = null;
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    
    if (currentStream.current) {
      currentStream.current.getTracks().forEach(track => {
        track.stop();
      });
      currentStream.current = null;
    }
    
    setIsScanning(false);
    setError(null);
  };

  const initializeScanner = async () => {
    try {
      setError(null);
      
      // Request camera permission first
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop()); // Stop the test stream
        setCameraPermission('granted');
      } catch (permErr) {
        setError('Camera access denied. Please allow camera access and refresh the page.');
        setCameraPermission('denied');
        return;
      }

      // Initialize code reader
      codeReader.current = new BrowserMultiFormatReader();
      
      // Get available cameras after permission granted
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput' && device.deviceId);
      
      if (videoDevices.length === 0) {
        setError('No cameras found on this device.');
        return;
      }

      setCameras(videoDevices);
      
      // Auto-select camera (prefer back camera on mobile, first available on desktop)
      const backCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      );
      
      // For PC, usually the first camera is the default webcam
      const selectedCamera = backCamera || videoDevices[0];
      setSelectedCameraId(selectedCamera.deviceId);
      
    } catch (err: any) {
      console.error('Camera initialization error:', err);
      setError(`Camera initialization failed: ${err?.message || 'Unknown error'}. Please check camera permissions.`);
    }
  };

  const startScanning = async () => {
    if (!selectedCameraId || !codeReader.current || !videoRef.current) {
      setError('Please select a camera first.');
      return;
    }

    if (isScanning) return;

    try {
      setError(null);
      setIsScanning(true);

      // Stop any existing streams
      if (currentStream.current) {
        currentStream.current.getTracks().forEach(track => track.stop());
        currentStream.current = null;
      }

      // Create new code reader instance for each scan
      codeReader.current = new BrowserMultiFormatReader();

      // Test camera access first
      const constraints = {
        video: {
          deviceId: selectedCameraId ? { exact: selectedCameraId } : undefined,
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      currentStream.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Start decoding from the stream
      await codeReader.current.decodeFromVideoDevice(
        selectedCameraId,
        videoRef.current,
        (result, error) => {
          if (result) {
            setIsScanning(false);
            onScan(result.getText());
            handleClose();
          }
          // Ignore decode errors - they're expected during scanning
        }
      );

    } catch (err: any) {
      console.error('Scanning error:', err);
      setError(`Camera failed to start: ${err?.name === 'NotAllowedError' ? 'Permission denied' : err?.message || 'Unknown error'}. Try refreshing the page.`);
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReader.current) {
      try {
        // Clean up the code reader properly - no stopAsyncDecode method exists
        codeReader.current = null;
      } catch (e) {
        // Ignore errors
      }
    }
    setIsScanning(false);
  };

  const handleClose = () => {
    stopScanning();
    cleanup();
    onClose();
  };

  const handleCameraChange = (deviceId: string) => {
    stopScanning();
    setSelectedCameraId(deviceId);
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

          {cameras.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Camera:</label>
              <Select value={selectedCameraId} onValueChange={handleCameraChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a camera" />
                </SelectTrigger>
                <SelectContent>
                  {cameras.map((camera, index) => (
                    <SelectItem key={camera.deviceId} value={camera.deviceId}>
                      {camera.label || `Camera ${index + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
          </div>

          <div className="flex gap-2">
            {!isScanning ? (
              <Button 
                onClick={startScanning} 
                disabled={!selectedCameraId || cameras.length === 0}
                className="flex-1"
              >
                <Camera className="w-4 h-4 mr-2" />
                Start Scanning
              </Button>
            ) : (
              <Button onClick={stopScanning} variant="destructive" className="flex-1">
                Stop Scanning
              </Button>
            )}
            
            <Button onClick={handleClose} variant="outline">
              Cancel
            </Button>
          </div>

          {cameraPermission === 'denied' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Camera access denied. Please enable camera permissions in your browser settings and refresh the page.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}