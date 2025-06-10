import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertTicketSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useClients } from "@/hooks/use-clients";
import { useDevices } from "@/hooks/use-devices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useState } from "react";

interface TicketFormProps {
  onSuccess?: () => void;
  ticketId?: number;
  initialData?: any;
}

export default function TicketForm({ onSuccess, ticketId, initialData }: TicketFormProps) {
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: clients } = useClients();
  const { data: devices } = useDevices();

  // Filter devices by selected client
  const clientDevices = devices?.filter(device => 
    selectedClientId ? device.clientId === selectedClientId : false
  ) || [];

  const form = useForm({
    resolver: zodResolver(insertTicketSchema),
    defaultValues: {
      clientId: initialData?.clientId || 0,
      deviceId: initialData?.deviceId || 0,
      title: initialData?.title || "",
      description: initialData?.description || "",
      status: initialData?.status || "received",
      priority: initialData?.priority || "medium",
      estimatedCost: initialData?.estimatedCost || "",
      finalCost: initialData?.finalCost || "",
      isPaid: initialData?.isPaid || false,
      paymentMethod: initialData?.paymentMethod || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (ticketId) {
        return await apiRequest("PUT", `/api/tickets/${ticketId}`, data);
      } else {
        return await apiRequest("POST", "/api/tickets", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tickets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ 
        title: ticketId ? "Ticket updated successfully" : "Ticket created successfully" 
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: ticketId ? "Error updating ticket" : "Error creating ticket",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    const submitData = {
      ...data,
      estimatedCost: data.estimatedCost ? parseFloat(data.estimatedCost) : null,
      finalCost: data.finalCost ? parseFloat(data.finalCost) : null,
    };
    createMutation.mutate(submitData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client</FormLabel>
                <Select 
                  onValueChange={(value) => {
                    const clientId = parseInt(value);
                    field.onChange(clientId);
                    setSelectedClientId(clientId);
                    // Reset device selection when client changes
                    form.setValue("deviceId", 0);
                  }}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Client" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="deviceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Device</FormLabel>
                <Select 
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  value={field.value?.toString()}
                  disabled={!selectedClientId}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Device" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clientDevices.map((device) => (
                      <SelectItem key={device.id} value={device.id.toString()}>
                        {device.brand} {device.model} ({device.type})
                      </SelectItem>
                    ))}
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
              <FormLabel>Issue Title</FormLabel>
              <FormControl>
                <Input placeholder="Brief description of the issue" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Detailed Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe the issue in detail, including any troubleshooting steps already taken..."
                  className="h-32"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priority</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Priority" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="diagnosed">Diagnosed</SelectItem>
                    <SelectItem value="awaiting_parts">Awaiting Parts</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="estimatedCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimated Cost</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="finalCost"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Final Cost</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="0.00" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onSuccess}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending 
              ? (ticketId ? "Updating..." : "Creating...") 
              : (ticketId ? "Update Ticket" : "Create Ticket")
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
