import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Camera, Download, Trash2, Eye, Calendar, User } from 'lucide-react';

interface PhotoGalleryProps {
  ticketId: number;
}

interface Attachment {
  id: number;
  ticketId: number;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  description?: string;
  type: string;
  uploadedBy: string;
  createdAt: string;
}

export function PhotoGallery({ ticketId }: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Attachment | null>(null);
  const { toast } = useToast();

  const { data: attachments, isLoading, refetch } = useQuery({
    queryKey: ['/api/attachments', ticketId],
    queryFn: async () => {
      const response = await fetch(`/api/tickets/${ticketId}/attachments`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch attachments');
      }
      return response.json();
    },
  });

  const handleDelete = async (attachmentId: number) => {
    try {
      const response = await fetch(`/api/attachments/${attachmentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete attachment');
      }

      toast({
        title: "Photo deleted successfully",
        description: "The photo has been removed from the ticket.",
      });

      refetch();
      setSelectedPhoto(null);
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: "Delete failed",
        description: "Failed to delete the photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'device_photo': return 'bg-blue-100 text-blue-800';
      case 'repair_photo': return 'bg-orange-100 text-orange-800';
      case 'document': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Camera className="w-5 h-5 mr-2" />
            Photo Gallery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-square bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!attachments || attachments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Camera className="w-5 h-5 mr-2" />
            Photo Gallery
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Camera className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No photos uploaded yet</p>
            <p className="text-sm text-gray-400 mt-1">Photos will appear here once uploaded</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Camera className="w-5 h-5 mr-2" />
            Photo Gallery
          </div>
          <Badge variant="secondary">{attachments.length} photos</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {attachments.map((attachment: Attachment) => (
            <div key={attachment.id} className="group relative">
              <div 
                className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-blue-500 transition-colors"
                onClick={() => setSelectedPhoto(attachment)}
              >
                <img
                  src={`/api/attachments/${attachment.id}/file`}
                  alt={attachment.description || attachment.originalName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                  <Eye className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
              <div className="mt-2">
                <Badge className={`${getTypeColor(attachment.type)} text-xs`}>
                  {attachment.type.replace('_', ' ')}
                </Badge>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  {attachment.originalName}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Photo Detail Modal */}
        {selectedPhoto && (
          <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>{selectedPhoto.originalName}</span>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <a href={`/api/attachments/${selectedPhoto.id}/file`} download>
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </a>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Photo</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this photo? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(selectedPhoto.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="text-center">
                  <img
                    src={`/api/attachments/${selectedPhoto.id}/file`}
                    alt={selectedPhoto.description || selectedPhoto.originalName}
                    className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Badge className={getTypeColor(selectedPhoto.type)}>
                        {selectedPhoto.type.replace('_', ' ')}
                      </Badge>
                    </div>
                    {selectedPhoto.description && (
                      <div>
                        <p className="text-sm font-medium text-gray-600">Description:</p>
                        <p className="text-sm text-gray-900">{selectedPhoto.description}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Uploaded by:</span>
                      <span>{selectedPhoto.uploadedBy}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">Date:</span>
                      <span>{format(new Date(selectedPhoto.createdAt), "MMM d, yyyy h:mm a")}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">File size:</span>
                      <span className="ml-2">{formatFileSize(selectedPhoto.size)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}