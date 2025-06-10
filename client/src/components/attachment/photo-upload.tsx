import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Camera, Upload, X, Loader2 } from 'lucide-react';

interface PhotoUploadProps {
  ticketId: number;
  onUploadComplete: () => void;
}

export function PhotoUpload({ ticketId, onUploadComplete }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [type, setType] = useState('device_photo');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
      return;
    }

    console.log('Starting upload for file:', file.name, 'to ticket:', ticketId);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('ticketId', ticketId.toString());
      formData.append('description', description);
      formData.append('type', type);

      console.log('Uploading with data:', { ticketId, description, type, fileName: file.name });

      const response = await fetch('/api/attachments/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const responseText = await response.text();
      console.log('Upload response:', response.status, responseText);

      if (!response.ok) {
        let errorMessage = 'Upload failed';
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = responseText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const result = JSON.parse(responseText);
      
      toast({
        title: "Photo uploaded successfully",
        description: "The photo has been attached to the ticket.",
      });

      // Reset form
      setPreview(null);
      setDescription('');
      setType('device_photo');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      onUploadComplete();

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast({
        title: "Upload failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const clearPreview = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Camera className="w-5 h-5" />
            <h3 className="text-lg font-medium">Upload Photo</h3>
          </div>

          {!preview ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="photo-upload">Select Photo</Label>
                <Input
                  id="photo-upload"
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="photo-type">Photo Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="device_photo">Device Photo</SelectItem>
                      <SelectItem value="repair_photo">Repair Progress</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="photo-description">Description (Optional)</Label>
                <Textarea
                  id="photo-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this photo shows..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg border"
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={clearPreview}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="photo-type">Photo Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="device_photo">Device Photo</SelectItem>
                      <SelectItem value="repair_photo">Repair Progress</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="photo-description">Description (Optional)</Label>
                <Textarea
                  id="photo-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this photo shows..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="flex space-x-2">
                <Button 
                  onClick={() => {
                    console.log('Upload button clicked');
                    handleUpload();
                  }} 
                  disabled={uploading} 
                  className="flex-1"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Photo
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={clearPreview} disabled={uploading}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}