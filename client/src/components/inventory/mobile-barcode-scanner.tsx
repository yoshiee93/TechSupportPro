import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, Upload, X, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MobileBarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (result: string) => void;
  title?: string;
}

export default function MobileBarcodeScanner({ 
  isOpen, 
  onClose, 
  onScan, 
  title = "Scan Barcode" 
}: MobileBarcodeScannerProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageCapture = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image file too large. Please select an image under 10MB.');
      return;
    }

    setError(null);
    setSuccess(null);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Process barcode
    await processBarcode(file);
  };

  const processBarcode = async (file: File) => {
    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/scan-barcode', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.barcode) {
        setSuccess(`Barcode detected: ${result.barcode}`);
        toast({
          title: "Barcode Scanned Successfully",
          description: `Found: ${result.barcode}`,
        });
        
        // Pass result to parent component
        onScan(result.barcode);
        
        // Auto-close after successful scan
        setTimeout(() => {
          handleClose();
        }, 1500);
      } else {
        setError(result.error || 'No barcode detected in image. Please try again with a clearer photo.');
      }
    } catch (err) {
      console.error('Barcode processing error:', err);
      setError('Failed to process image. Please check your connection and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setPreviewImage(null);
    setError(null);
    setSuccess(null);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const triggerCamera = () => {
    fileInputRef.current?.click();
  };

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
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageCapture}
            className="hidden"
          />

          {/* Camera Button */}
          {!previewImage && (
            <div className="text-center space-y-4">
              <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg">
                <Camera className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-600 mb-4">
                  Take a photo of the barcode to scan it
                </p>
                <Button 
                  onClick={triggerCamera}
                  className="w-full"
                  disabled={isProcessing}
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Open Camera
                </Button>
              </div>
              
              <div className="text-xs text-gray-500 space-y-1">
                <p>• On mobile: Opens your camera automatically</p>
                <p>• On desktop: Choose an existing photo</p>
                <p>• Ensure barcode is clear and well-lit</p>
              </div>
            </div>
          )}

          {/* Image Preview */}
          {previewImage && (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-hidden">
                <img 
                  src={previewImage} 
                  alt="Captured barcode" 
                  className="w-full h-48 object-contain bg-gray-100"
                />
              </div>
              
              {!isProcessing && !success && !error && (
                <Button 
                  onClick={triggerCamera}
                  variant="outline"
                  className="w-full"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Another Photo
                </Button>
              )}
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span className="text-sm text-gray-600">Processing barcode...</span>
            </div>
          )}

          {/* Success State */}
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}

          {/* Error State */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {error && !isProcessing && (
              <Button 
                onClick={triggerCamera}
                variant="outline"
                className="flex-1"
              >
                <Camera className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
            <Button 
              onClick={handleClose}
              variant={success ? "default" : "outline"}
              className="flex-1"
            >
              <X className="w-4 h-4 mr-2" />
              {success ? "Done" : "Cancel"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}