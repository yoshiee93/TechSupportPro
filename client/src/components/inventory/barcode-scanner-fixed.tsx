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
      console.log('BrowserMultiFormatReader initialized');
      
      const checkMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(checkMobile);
      console.log('Mobile detection:', { checkMobile, userAgent: navigator.userAgent });
      
      // Longer delay to ensure complete browser camera state reset
      setTimeout(() => {
        enumerateCameras();
      }, 500);
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
      console.log('Starting camera enumeration (fresh session)...');
      
      // Samsung phone fix: Complete camera state reset with stream tracking
      console.log('Camera refresh key:', cameraRefreshKey);
      
      // Step 1: Force camera resource cleanup
      await forceCleanupAllCameraStreams();
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Step 2: Multiple permission requests to reset Samsung camera state
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
            console.log('Permission request failed for constraint:', constraint, err);
          }
        }
        
        console.log('Multiple camera permissions granted, found', streams.length, 'streams');
        
        // Clean up all streams
        streams.forEach(stream => {
          stream.getTracks().forEach(track => track.stop());
        });
        activeStreams.current = [];
        
      } catch (permErr) {
        console.log('Samsung multiple permission workaround failed:', permErr);
        
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
          console.error('All permission requests failed:', fallbackErr);
          throw fallbackErr;
        }
      }
      
      console.log('Camera permissions complete, enumerating devices...');
      
      // Multiple enumeration attempts with longer delays for Samsung phones
      let devices = await navigator.mediaDevices.enumerateDevices();
      let videoDevices = devices.filter(device => device.kind === 'videoinput');
      
      console.log('First enumeration attempt:', videoDevices.length, 'cameras');
      
      // Samsung phones often need multiple attempts with delays
      let attempts = 0;
      while (videoDevices.length < 4 && attempts < 3) {
        attempts++;
        console.log(`Enumeration attempt ${attempts + 1}, found ${videoDevices.length} cameras, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 500 * attempts)); // Progressive delay
        devices = await navigator.mediaDevices.enumerateDevices();
        videoDevices = devices.filter(device => device.kind === 'videoinput');
      }
      
      console.log('All video devices found:', videoDevices.map((d, index) => ({
        index: index + 1,
        deviceId: d.deviceId,
        label: d.label,
        groupId: d.groupId
      })));
      
      // Always use all video devices to ensure consistent camera list
      let cameraList = videoDevices;
      
      // For mobile, still filter for rear cameras but keep all as fallback
      if (isMobile) {
        const rearCameras = videoDevices.filter(device => {
          const label = device.label.toLowerCase();
          return label.includes('back') || label.includes('rear') || 
                 (!label.includes('front') && !label.includes('user') && !label.includes('facing'));
        });
        
        console.log('Rear cameras found:', rearCameras.map((d, index) => ({
          index: index + 1,
          deviceId: d.deviceId,
          label: d.label
        })));
        
        // Only use rear cameras if we have enough, otherwise use all
        if (rearCameras.length >= 3) {
          cameraList = rearCameras;
        } else {
          console.log('Using all cameras since rear camera filter reduced count too much');
          cameraList = videoDevices;
        }
      }
      
      console.log('Final camera list with indexes:', cameraList.map((d, index) => ({
        index: index + 1,
        deviceId: d.deviceId,
        label: d.label,
        displayName: getCameraDisplayName(d, index)
      })));
      
      setAvailableCameras(cameraList);
      
      // Priority for 4th camera (index 3) as requested by user
      let selectedCamera;
      if (cameraList.length >= 4) {
        selectedCamera = cameraList[3]; // 4th camera (0-indexed)
        console.log('Auto-selected 4th camera (preferred for Samsung):', selectedCamera.label);
      } else if (cameraList.length > 0) {
        selectedCamera = cameraList[0]; // First camera as fallback
        console.log('Auto-selected first camera:', selectedCamera.label);
      }
      
      if (selectedCamera) {
        setSelectedCameraId(selectedCamera.deviceId);
      }
      
    } catch (err) {
      console.error('Camera enumeration failed:', err);
      // More robust fallback
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        console.log('Fallback camera enumeration:', videoDevices.length, 'cameras found');
        setAvailableCameras(videoDevices);
        if (videoDevices.length > 0) {
          setSelectedCameraId(videoDevices[0].deviceId);
        }
      } catch (fallbackErr) {
        console.error('Fallback enumeration also failed:', fallbackErr);
      }
    }
  };

  const getCameraDisplayName = (device: MediaDeviceInfo, index?: number) => {
    const label = device.label.toLowerCase();
    const cameraNumber = index !== undefined ? `Camera ${index + 1}: ` : '';
    const isPreferred = index === 3 ? ' ⭐' : ''; // Star for 4th camera
    
    if (label.includes('ultra') || label.includes('wide')) {
      return `${cameraNumber}📐 Ultra Wide${isPreferred}`;
    } else if (label.includes('telephoto') || label.includes('tele') || label.includes('zoom')) {
      return `${cameraNumber}🔍 Telephoto${isPreferred}`;
    } else if (label.includes('macro')) {
      return `${cameraNumber}🔬 Macro${isPreferred}`;
    } else {
      return `${cameraNumber}📷 Main Camera${isPreferred}`;
    }
  };

  const requestCameraPermission = async (cameraId?: string) => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported by this browser');
      }

      console.log('Attempting to request camera permission...', cameraId ? `for camera: ${cameraId}` : 'default');
      
      const videoConstraints: MediaTrackConstraints = {
        width: { ideal: 1920, max: 1920 },
        height: { ideal: 1080, max: 1080 },
        facingMode: "environment"
      };
      
      if (cameraId) {
        videoConstraints.deviceId = { ideal: cameraId };
        delete videoConstraints.facingMode;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: videoConstraints 
      });
      
      setHasPermission(true);
      setError(null);
      console.log('Camera permission granted successfully');
      
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (err) {
      console.error('Camera permission error:', err);
      
      if (cameraId && err instanceof Error && (err.name === 'OverconstrainedError' || err.name === 'NotReadableError')) {
        console.log('Trying fallback constraints for Samsung camera...');
        try {
          const fallbackConstraints: MediaTrackConstraints = {
            deviceId: { exact: cameraId },
            width: { min: 640, ideal: 1280 },
            height: { min: 480, ideal: 720 }
          };
          
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: fallbackConstraints });
          fallbackStream.getTracks().forEach(track => track.stop());
          
          setHasPermission(true);
          setError(null);
          console.log('Samsung camera fallback successful');
          return true;
          
        } catch (fallbackErr) {
          console.error('Samsung camera fallback failed:', fallbackErr);
        }
      }
      
      setHasPermission(false);
      
      let errorMessage = 'Camera access denied';
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMessage = 'Camera access denied. Please click the camera icon in your browser address bar and allow camera access.';
        } else if (err.name === 'NotFoundError') {
          errorMessage = 'No camera found. Please ensure your device has a camera.';
        } else if (err.name === 'NotSupportedError') {
          errorMessage = 'Camera not supported by this browser.';
        } else if (err.name === 'OverconstrainedError') {
          errorMessage = 'Selected camera not available. Try switching to a different camera.';
        } else if (err.name === 'NotReadableError') {
          errorMessage = 'Camera is being used by another application. Please close other camera apps and try again.';
        } else {
          errorMessage = `Camera error: ${err.message}`;
        }
      }
      
      setError(errorMessage);
      return false;
    }
  };

  const switchCamera = async (newCameraId: string) => {
    if (!isScanning) {
      setSelectedCameraId(newCameraId);
      return;
    }

    console.log('Switching camera during scanning to:', newCameraId);
    
    if (codeReader.current) {
      codeReader.current.reset();
    }
    
    setSelectedCameraId(newCameraId);
    await new Promise(resolve => setTimeout(resolve, 200));
    
    try {
      if (!codeReader.current) {
        codeReader.current = new BrowserMultiFormatReader();
      }
      
      await codeReader.current.decodeFromVideoDevice(
        newCameraId,
        videoRef.current,
        (result, error) => {
          if (result) {
            const scannedText = result.getText();
            console.log('Barcode detected with new camera:', scannedText);
            onScan(scannedText.trim());
            stopScanning();
            onClose();
          }
          if (error && !(error instanceof NotFoundException)) {
            console.error("Scanning error:", error);
          }
        }
      );
      
      console.log('Camera switched successfully');
    } catch (err) {
      console.error('Camera switch failed:', err);
      
      try {
        console.log('Attempting fallback to default camera...');
        if (codeReader.current) {
          codeReader.current.reset();
          await new Promise(resolve => setTimeout(resolve, 300));
          
          await codeReader.current.decodeFromVideoDevice(
            null,
            videoRef.current,
            (result, error) => {
              if (result) {
                console.log('Barcode detected with fallback camera:', result.getText());
                onScan(result.getText().trim());
                stopScanning();
                onClose();
              }
            }
          );
          console.log('Fallback camera started successfully');
        }
      } catch (fallbackErr) {
        console.error('Fallback camera also failed:', fallbackErr);
        setError('Camera switch failed. Please restart the scanner.');
        setIsScanning(false);
      }
    }
  };

  const startScanning = async () => {
    console.log('Start scanning button clicked');
    
    if (!codeReader.current) {
      codeReader.current = new BrowserMultiFormatReader();
    }
    
    if (!videoRef.current) {
      console.error('Video element not available');
      setError('Video element not ready. Please try again.');
      return;
    }

    setIsScanning(true);
    setError(null);

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
      
      const cameraId = selectedCameraId || null;
      
      try {
        await codeReader.current.decodeFromVideoDevice(
          cameraId,
          videoRef.current,
          (result, error) => {
            if (result) {
              const scannedText = result.getText();
              console.log('Barcode detected successfully:', {
                text: scannedText,
                format: result.getBarcodeFormat(),
                length: scannedText.length,
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
        
        console.log('Barcode scanner started successfully');
        setIsScanning(true);
        setError(null);
        
      } catch (scanErr) {
        console.error('Primary scanning failed:', scanErr);
        
        if (cameraId && scanErr instanceof Error && 
            (scanErr.name === 'NotReadableError' || scanErr.name === 'OverconstrainedError')) {
          console.log('Attempting Samsung camera fallback...');
          try {
            codeReader.current.reset();
            await new Promise(resolve => setTimeout(resolve, 300));
            
            await codeReader.current.decodeFromVideoDevice(
              null,
              videoRef.current,
              (result, error) => {
                if (result) {
                  const scannedText = result.getText();
                  console.log('Barcode detected with fallback:', scannedText);
                  onScan(scannedText.trim());
                  stopScanning();
                  onClose();
                }
                if (error && !(error instanceof NotFoundException)) {
                  console.error("Fallback scanning error:", error);
                }
              }
            );
            
            console.log('Fallback scanner started successfully');
            setIsScanning(true);
            setError(null);
            return;
            
          } catch (fallbackErr) {
            console.error('Fallback also failed:', fallbackErr);
          }
        }
        
        const errorMessage = scanErr instanceof Error ? scanErr.message : String(scanErr);
        setError(`Failed to start camera: ${errorMessage}`);
        setIsScanning(false);
      }
    } catch (err) {
      console.error("Scanner initialization failed:", err);
      setError('Scanner initialization failed. Please refresh and try again.');
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReader.current) {
      codeReader.current.reset();
    }
    setIsScanning(false);
  };

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
      console.log('Camera cleanup dummy stream failed:', err);
    }
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
            <Scan className="w-5 h-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {!isScanning && !error && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Camera className="w-8 h-8 text-gray-400" />
                </div>
              </div>
              
              {availableCameras.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
                    <Smartphone className="w-4 h-4" />
                    {availableCameras.length > 1 ? 'Multiple cameras detected' : 'Camera available'}
                  </div>
                  <div className="text-xs text-center text-gray-500">
                    Found {availableCameras.length} camera(s) {availableCameras.length >= 4 ? '(Camera 4 auto-selected ⭐)' : ''}
                  </div>
                  <Select value={selectedCameraId} onValueChange={setSelectedCameraId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select camera" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCameras.map((camera, index) => (
                        <SelectItem key={camera.deviceId} value={camera.deviceId}>
                          {getCameraDisplayName(camera, index)}
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
                
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-48 h-32 border-2 border-blue-500 rounded-lg relative">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-blue-500"></div>
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-blue-500"></div>
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-blue-500"></div>
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-blue-500"></div>
                  </div>
                </div>
              </div>
              
              {availableCameras.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs text-center text-gray-600">
                    {availableCameras.length > 1 ? 'Switch Camera:' : 'Current Camera:'}
                  </div>
                  <Select value={selectedCameraId} onValueChange={switchCamera}>
                    <SelectTrigger className="w-full h-8 text-sm">
                      <SelectValue />
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
              )}
              
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Position the barcode within the frame to scan
                </p>
                <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
                  💡 Tips: Hold steady, ensure good lighting, try different distances from camera
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Button 
                  onClick={stopScanning} 
                  variant="outline" 
                  size="sm"
                >
                  <X className="w-4 h-4 mr-1" />
                  Stop Scanner
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}