import { useState, useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, X, RotateCcw } from 'lucide-react';

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
  const [cameraRefreshKey, setCameraRefreshKey] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const activeStreams = useRef<MediaStream[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Reset all state when opening
      setAvailableCameras([]);
      setSelectedCameraId('');
      setHasPermission(null);
      setError(null);
      setIsScanning(false);
      
      codeReader.current = new BrowserMultiFormatReader();
      
      const checkMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(checkMobile);
      
      // Delay to ensure complete browser camera state reset
      setTimeout(() => {
        enumerateCameras();
      }, 500);
    }

    return () => {
      if (codeReader.current) {
        codeReader.current.reset();
        codeReader.current = null;
      }
    };
  }, [isOpen]);

  const forceCleanupAllCameraStreams = async () => {
    // Stop all active streams
    activeStreams.current.forEach(stream => {
      stream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
    });
    activeStreams.current = [];
    
    // Force browser to release camera resources
    try {
      const dummyStream = await navigator.mediaDevices.getUserMedia({ video: { width: 1, height: 1 } });
      await new Promise(resolve => setTimeout(resolve, 100));
      dummyStream.getTracks().forEach(track => track.stop());
    } catch (err) {
      // Silent fail for cleanup
    }
  };

  const enumerateCameras = async () => {
    try {
      // Force camera resource cleanup
      await forceCleanupAllCameraStreams();
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Multiple permission requests to reset Samsung camera state
      const streams: MediaStream[] = [];
      
      try {
        // Request all different camera types to force enumeration refresh
        const constraints = [
          { video: true },
          { video: { facingMode: "environment" } },
          { video: { facingMode: "user" } },
          { video: { width: 640, height: 480 } }
        ];
        
        for (const constraint of constraints) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia(constraint);
            streams.push(stream);
            activeStreams.current.push(stream);
            await new Promise(resolve => setTimeout(resolve, 150));
          } catch (err) {
            // Silently continue if constraint fails
          }
        }
        
        // Clean up all streams
        streams.forEach(stream => {
          stream.getTracks().forEach(track => track.stop());
        });
        activeStreams.current = [];
        
      } catch (permErr) {
        // Fallback to standard single permission request
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              facingMode: { ideal: "environment" },
              width: { ideal: 1280 },
              height: { ideal: 720 }
            } 
          });
          
          activeStreams.current.push(stream);
          await new Promise(resolve => setTimeout(resolve, 200));
          stream.getTracks().forEach(track => track.stop());
          activeStreams.current = [];
        } catch (fallbackErr) {
          throw fallbackErr;
        }
      }
      
      // Multiple enumeration attempts for Samsung phones
      let devices = await navigator.mediaDevices.enumerateDevices();
      let videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      // Samsung phones often need multiple attempts with delays
      let attempts = 0;
      while (videoDevices.length < 4 && attempts < 3) {
        attempts++;
        await new Promise(resolve => setTimeout(resolve, 500 * attempts));
        devices = await navigator.mediaDevices.enumerateDevices();
        videoDevices = devices.filter(device => device.kind === 'videoinput');
      }
      
      // Always use all video devices to ensure consistent camera list
      let cameraList = videoDevices;
      
      // For mobile, filter for rear cameras but keep all as fallback
      if (isMobile) {
        const rearCameras = videoDevices.filter(device => {
          const label = device.label.toLowerCase();
          return label.includes('back') || label.includes('rear') || 
                 (!label.includes('front') && !label.includes('user') && !label.includes('facing'));
        });
        
        // Only use rear cameras if we have enough, otherwise use all
        if (rearCameras.length >= 3) {
          cameraList = rearCameras;
        } else {
          cameraList = videoDevices;
        }
      }
      
      setAvailableCameras(cameraList);
      
      // Priority for 4th camera (index 3) as requested by user
      let selectedCamera;
      if (cameraList.length >= 4) {
        selectedCamera = cameraList[3]; // 4th camera (0-indexed)
      } else if (cameraList.length > 0) {
        selectedCamera = cameraList[0]; // First camera as fallback
      }
      
      if (selectedCamera) {
        setSelectedCameraId(selectedCamera.deviceId);
      }
      
    } catch (err) {
      // More robust fallback
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setAvailableCameras(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedCameraId(videoDevices[0].deviceId);
        }
      } catch (fallbackErr) {
        setError('Camera access failed. Please check permissions.');
      }
    }
  };

  const getCameraDisplayName = (device: MediaDeviceInfo, index?: number) => {
    const label = device.label.toLowerCase();
    const deviceIndex = index !== undefined ? index : availableCameras.findIndex(cam => cam.deviceId === device.deviceId);
    const displayIndex = deviceIndex + 1;
    
    // Star indicator for 4th camera (Samsung preferred)
    const starIndicator = displayIndex === 4 ? ' ⭐' : '';
    
    if (label.includes('back') || label.includes('rear')) {
      return `Camera ${displayIndex} (Rear)${starIndicator}`;
    }
    if (label.includes('front') || label.includes('user')) {
      return `Camera ${displayIndex} (Front)${starIndicator}`;
    }
    if (label.includes('ultra') || label.includes('wide')) {
      return `Camera ${displayIndex} (Ultra Wide)${starIndicator}`;
    }
    if (label.includes('telephoto') || label.includes('zoom')) {
      return `Camera ${displayIndex} (Telephoto)${starIndicator}`;
    }
    if (label.includes('macro')) {
      return `Camera ${displayIndex} (Macro)${starIndicator}`;
    }
    
    return `Camera ${displayIndex}${starIndicator}`;
  };

  const requestCameraPermission = async () => {
    try {
      setHasPermission(null);
      setError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      setHasPermission(true);
      
      // Re-enumerate cameras after permission granted
      await enumerateCameras();
      
    } catch (err) {
      setHasPermission(false);
      setError('Camera permission denied. Please allow camera access.');
    }
  };

  const startScanning = async () => {
    if (!selectedCameraId || !codeReader.current || !videoRef.current) {
      setError('Please select a camera first.');
      return;
    }

    if (isScanning) {
      setSelectedCameraId(selectedCameraId);
      return;
    }

    try {
      setError(null);
      setIsScanning(true);

      if (codeReader.current) {
        codeReader.current.reset();
      }
      
      codeReader.current = new BrowserMultiFormatReader();
      
      await codeReader.current.decodeFromVideoDevice(
        selectedCameraId,
        videoRef.current,
        (result, error) => {
          if (result) {
            setIsScanning(false);
            onScan(result.getText());
            onClose();
          }
        }
      );

    } catch (err) {
      setIsScanning(false);
      setError('Failed to start camera. Please try a different camera.');
    }
  };

  const switchCamera = async (newCameraId: string) => {
    if (!codeReader.current || !videoRef.current) return;

    try {
      setError(null);
      
      if (codeReader.current) {
        codeReader.current.reset();
      }
      
      codeReader.current = new BrowserMultiFormatReader();
      
      await codeReader.current.decodeFromVideoDevice(
        newCameraId,
        videoRef.current,
        (result, error) => {
          if (result) {
            setIsScanning(false);
            onScan(result.getText());
            onClose();
          }
        }
      );

    } catch (err) {
      setError('Failed to switch camera. Please try again.');
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
    
    // Samsung-specific camera cleanup
    forceCleanupAllCameraStreams();
    
    // Force complete reset of camera state when closing
    setAvailableCameras([]);
    setSelectedCameraId('');
    setHasPermission(null);
    setError(null);
    setIsScanning(false);
    
    // Increment refresh key to force re-enumeration
    setCameraRefreshKey(prev => prev + 1);
    
    // Reset the code reader
    if (codeReader.current) {
      codeReader.current.reset();
      codeReader.current = null;
    }
    
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      // Additional cleanup when dialog is closed
      stopScanning();
      setError(null);
      setHasPermission(null);
      setAvailableCameras([]);
      setSelectedCameraId('');
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {hasPermission === null && (
            <div className="text-center py-4">
              <Button onClick={requestCameraPermission} className="w-full">
                <Camera className="w-4 h-4 mr-2" />
                Request Camera Permission
              </Button>
            </div>
          )}

          {hasPermission === false && (
            <div className="text-center py-4 text-red-600">
              Camera permission denied. Please allow camera access in your browser settings.
            </div>
          )}

          {hasPermission === true && availableCameras.length === 0 && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p>Loading cameras...</p>
            </div>
          )}

          {hasPermission === true && availableCameras.length > 0 && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Camera</label>
                <Select
                  value={selectedCameraId}
                  onValueChange={(value) => {
                    setSelectedCameraId(value);
                    if (isScanning) {
                      switchCamera(value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a camera" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCameras.map((camera, index) => (
                      <SelectItem key={camera.deviceId} value={camera.deviceId}>
                        {getCameraDisplayName(camera, index)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '4/3' }}>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                {!isScanning && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-white text-center">
                      <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Press Start to begin scanning</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                {!isScanning ? (
                  <Button 
                    onClick={startScanning} 
                    className="flex-1"
                    disabled={!selectedCameraId}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Start Scanning
                  </Button>
                ) : (
                  <Button 
                    onClick={stopScanning} 
                    variant="destructive" 
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Stop Scanning
                  </Button>
                )}
                
                <Button 
                  onClick={enumerateCameras} 
                  variant="outline"
                  size="icon"
                  title="Refresh cameras"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}