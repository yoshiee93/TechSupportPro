import { useState } from "react";
import { useRepairNotes, useDeleteRepairNote } from "@/hooks/use-repair-notes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import RepairNotesForm from "./repair-notes-form";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  Circle, 
  Stethoscope, 
  TestTube, 
  Wrench, 
  Eye, 
  AlertTriangle 
} from "lucide-react";

interface RepairNotesListProps {
  ticketId: number;
}

export default function RepairNotesList({ ticketId }: RepairNotesListProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<any>(null);
  const { data: repairNotes, isLoading } = useRepairNotes(ticketId);
  const deleteMutation = useDeleteRepairNote();
  const { toast } = useToast();

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "diagnostic": return <Stethoscope className="w-4 h-4" />;
      case "test_result": return <TestTube className="w-4 h-4" />;
      case "repair_step": return <Wrench className="w-4 h-4" />;
      case "observation": return <Eye className="w-4 h-4" />;
      case "issue_found": return <AlertTriangle className="w-4 h-4" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "diagnostic": return "bg-blue-100 text-blue-800";
      case "test_result": return "bg-green-100 text-green-800";
      case "repair_step": return "bg-orange-100 text-orange-800";
      case "observation": return "bg-gray-100 text-gray-800";
      case "issue_found": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "normal": return "bg-blue-100 text-blue-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const handleDelete = async (noteId: number) => {
    try {
      await deleteMutation.mutateAsync(noteId);
      toast({ title: "Repair note deleted successfully" });
    } catch (error: any) {
      toast({
        title: "Error deleting repair note",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Repair Notes & Progress</h3>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Note
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Repair Note</DialogTitle>
            </DialogHeader>
            <RepairNotesForm 
              ticketId={ticketId} 
              onSuccess={() => setIsCreateOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {!repairNotes || repairNotes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wrench className="w-12 h-12 text-gray-300 mb-4" />
            <p className="text-gray-500 text-center">
              No repair notes yet. Add your first diagnostic or repair step.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {repairNotes.map((note) => (
            <Card key={note.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    {getTypeIcon(note.type)}
                    <div>
                      <CardTitle className="text-lg flex items-center space-x-2">
                        <span>{note.title}</span>
                        {note.isResolved && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                      </CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={getTypeColor(note.type)}>
                          {note.type.replace("_", " ")}
                        </Badge>
                        <Badge className={getPriorityColor(note.priority)}>
                          {note.priority}
                        </Badge>
                        {note.isResolved && (
                          <Badge className="bg-green-100 text-green-800">
                            Resolved
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Dialog open={editingNote?.id === note.id} onOpenChange={(open) => setEditingNote(open ? note : null)}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Edit Repair Note</DialogTitle>
                        </DialogHeader>
                        <RepairNotesForm 
                          ticketId={ticketId}
                          noteId={note.id}
                          initialData={note}
                          onSuccess={() => setEditingNote(null)} 
                        />
                      </DialogContent>
                    </Dialog>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Repair Note</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this repair note? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(note.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-gray-700 mb-4">{note.content}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span>By {note.technicianName}</span>
                    <span>•</span>
                    <span>{format(new Date(note.createdAt), "MMM d, yyyy h:mm a")}</span>
                    {note.updatedAt !== note.createdAt && (
                      <>
                        <span>•</span>
                        <span>Updated {format(new Date(note.updatedAt), "MMM d, h:mm a")}</span>
                      </>
                    )}
                  </div>
                  
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex space-x-1">
                      {note.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}