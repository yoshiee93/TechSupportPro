import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Clock, Plus } from "lucide-react";
import { useCreateTimeLog } from "@/hooks/use-time-logs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const manualTimeSchema = z.object({
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  description: z.string().optional(),
  billable: z.boolean().default(true),
  hourlyRate: z.string().optional(),
});

type ManualTimeFormData = z.infer<typeof manualTimeSchema>;

interface ManualTimeEntryProps {
  ticketId: number;
  technicianName: string;
}

export default function ManualTimeEntry({ ticketId, technicianName }: ManualTimeEntryProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const createTimeLog = useCreateTimeLog();

  const form = useForm<ManualTimeFormData>({
    resolver: zodResolver(manualTimeSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      startTime: "",
      endTime: "",
      description: "",
      billable: true,
      hourlyRate: "",
    },
  });

  const calculateDuration = (startTime: string, endTime: string): number => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    return Math.max(0, (end.getTime() - start.getTime()) / 1000); // Duration in seconds
  };

  const onSubmit = async (data: ManualTimeFormData) => {
    try {
      const startDateTime = new Date(`${data.date}T${data.startTime}`);
      const endDateTime = new Date(`${data.date}T${data.endTime}`);
      
      if (endDateTime <= startDateTime) {
        toast({
          title: "Invalid time range",
          description: "End time must be after start time",
          variant: "destructive",
        });
        return;
      }

      const duration = calculateDuration(data.startTime, data.endTime);

      await createTimeLog.mutateAsync({
        ticketId,
        userId: (user as any)?.id || "",
        technicianName,
        startTime: startDateTime,
        endTime: endDateTime,
        duration,
        description: data.description,
        billable: data.billable,
        hourlyRate: data.hourlyRate,
      });

      toast({
        title: "Time entry added",
        description: `Added ${Math.round(duration / 60)} minutes to ticket`,
      });

      form.reset();
      setOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add time entry",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Time Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Manual Time Entry
          </DialogTitle>
          <DialogDescription>
            Add a manual time entry for work performed on this ticket
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the work performed..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hourlyRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hourly Rate (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Enter hourly rate"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="billable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Billable time</FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createTimeLog.isPending}>
                {createTimeLog.isPending ? "Adding..." : "Add Entry"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}