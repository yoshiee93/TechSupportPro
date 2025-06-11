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
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    if (isOpen) {
      initializeCameras();
    } else {
      cleanup();
    }
    return cleanup;
  }, [isOpen]);

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (codeReaderRef.current) {
      codeReaderRef.current = null;
    }
    setIsScanning(false);
    setError(null);
  };

  const initializeCameras = async () => {
    try {
      setError(null);
      
      // Request initial permission
      const testStream = await navigator.mediaDevices.getUserMedia({ video: true });
      testStream.getTracks().forEach(track => track.stop());

      // Get available cameras
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => 
        device.kind === 'videoinput' && device.deviceId
      );
      
      if (videoDevices.length === 0) {
        setError('No cameras found on this device.');
        return;
      }

      setCameras(videoDevices);
      
      // Auto-select the best camera (prefer back/environment camera)
      const backCamera = videoDevices.find(device => 
        device.label.toLowerCase().includes('back') || 
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('environment')
      );
      
      const selectedCamera = backCamera || videoDevices[videoDevices.length - 1] || videoDevices[0];
      setSelectedCameraId(selectedCamera.deviceId);
      
    } catch (err: any) {
      setError(`Camera initialization failed: ${err?.message || 'Unknown error'}. Please allow camera access.`);
    }
  };

  const startScanning = async () => {
    if (isScanning || !selectedCameraId) return;

    try {
      setError(null);
      setIsScanning(true);

      // Stop any existing streams
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Advanced camera constraints for better barcode scanning
      const constraints = {
        video: {
          deviceId: { exact: selectedCameraId },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          focusMode: "continuous",
          exposureMode: "continuous",
          whiteBalanceMode: "continuous",
          zoom: true
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Apply video track settings for better focus
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack && videoTrack.getCapabilities) {
          try {
            const capabilities = videoTrack.getCapabilities() as any;
            const settings: any = {};
            
            // Enable auto-focus if available
            if (capabilities.focusMode && capabilities.focusMode.includes && capabilities.focusMode.includes('continuous')) {
              settings.focusMode = 'continuous';
            }
            
            // Set zoom if available (for better close-up scanning)
            if (capabilities.zoom && capabilities.zoom.max) {
              settings.zoom = Math.min(capabilities.zoom.max, 2); // 2x zoom
            }
            
            if (Object.keys(settings).length > 0) {
              await videoTrack.applyConstraints({ advanced: [settings] });
            }
          } catch (e) {
            // Camera settings not supported, continue without them
          }
        }
      }

      // Initialize barcode reader
      codeReaderRef.current = new BrowserMultiFormatReader();
      
      // Start scanning with selected camera
      await codeReaderRef.current.decodeFromVideoDevice(
        selectedCameraId,
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
      setError(`Camera failed to start: ${err?.message || 'Unknown error'}. Try selecting a different camera.`);
      setIsScanning(false);
    }
  };

  const handleCameraChange = (cameraId: string) => {
    setSelectedCameraId(cameraId);
    if (isScanning) {
      cleanup();
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
              <Button 
                onClick={startScanning} 
                disabled={!selectedCameraId || cameras.length === 0}
                className="flex-1"
              >
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