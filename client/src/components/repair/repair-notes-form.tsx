import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRepairNoteSchema } from "@shared/schema";
import { useCreateRepairNote, useUpdateRepairNote } from "@/hooks/use-repair-notes";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";

interface RepairNotesFormProps {
  ticketId: number;
  onSuccess?: () => void;
  noteId?: number;
  initialData?: any;
}

export default function RepairNotesForm({ ticketId, onSuccess, noteId, initialData }: RepairNotesFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const createMutation = useCreateRepairNote();
  const updateMutation = useUpdateRepairNote(noteId || 0);

  // Get user's display name
  const getUserDisplayName = () => {
    if (!user) return "Unknown User";
    const userInfo = user as any;
    if (userInfo.firstName && userInfo.lastName) {
      return `${userInfo.firstName} ${userInfo.lastName}`;
    }
    if (userInfo.firstName) return userInfo.firstName;
    if (userInfo.email) return userInfo.email;
    return "Unknown User";
  };

  const form = useForm({
    resolver: zodResolver(insertRepairNoteSchema),
    defaultValues: {
      ticketId: ticketId,
      type: initialData?.type || "diagnostic",
      title: initialData?.title || "",
      content: initialData?.content || "",
      technicianName: initialData?.technicianName || getUserDisplayName(),
      isResolved: initialData?.isResolved || false,
      priority: initialData?.priority || "normal",
      tags: initialData?.tags || [],
    },
  });

  const onSubmit = async (data: any) => {
    try {
      if (noteId) {
        await updateMutation.mutateAsync(data);
        toast({ title: "Repair note updated successfully" });
      } else {
        await createMutation.mutateAsync(data);
        toast({ title: "Repair note created successfully" });
      }
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: noteId ? "Error updating repair note" : "Error creating repair note",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Note Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select note type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="diagnostic">Diagnostic</SelectItem>
                    <SelectItem value="test_result">Test Result</SelectItem>
                    <SelectItem value="repair_step">Repair Step</SelectItem>
                    <SelectItem value="observation">Observation</SelectItem>
                    <SelectItem value="issue_found">Issue Found</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Brief description of the note" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Detailed Content</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Detailed description of the diagnostic, test result, or repair step..."
                  className="h-32"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="technicianName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Technician Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Technician name"
                  className="bg-muted"
                  disabled
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isResolved"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Mark as Resolved</FormLabel>
                <p className="text-sm text-muted-foreground">
                  Check this if the issue or test has been completed/resolved
                </p>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onSuccess}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending 
              ? (noteId ? "Updating..." : "Creating...") 
              : (noteId ? "Update Note" : "Create Note")
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}