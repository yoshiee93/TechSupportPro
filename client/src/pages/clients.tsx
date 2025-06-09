
import { useState } from "react";
import { useClients, useDeleteClient } from "@/hooks/use-clients";
import { useDevices } from "@/hooks/use-devices";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import ClientForm from "@/components/client/client-form";
import { useToast } from "@/hooks/use-toast";
import { insertDeviceSchema } from "@shared/schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { Search, Plus, Users, Phone, Mail, MapPin, Laptop, Edit, Trash2, Monitor, Smartphone, Tablet, Hash } from "lucide-react";

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const { toast } = useToast();
  const deleteMutation = useDeleteClient();
  const queryClient = useQueryClient();

  const { data: clients, isLoading } = useClients();
  const { data: devices } = useDevices();

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "laptop": return <Laptop className="w-4 h-4" />;
      case "smartphone": return <Smartphone className="w-4 h-4" />;
      case "desktop": return <Monitor className="w-4 h-4" />;
      case "tablet": return <Tablet className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "laptop": return "bg-blue-100 text-blue-800";
      case "smartphone": return "bg-green-100 text-green-800";
      case "desktop": return "bg-purple-100 text-purple-800";
      case "tablet": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const deviceForm = useForm({
    resolver: zodResolver(insertDeviceSchema),
    defaultValues: {
      clientId: 0,
      type: "",
      brand: "",
      model: "",
      serialNumber: "",
      notes: "",
    },
  });

  const createDeviceMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/devices", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({ title: "Device added successfully" });
      setIsAddDeviceOpen(false);
      deviceForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error adding device",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteClient = async (clientId: number) => {
    try {
      await deleteMutation.mutateAsync(clientId);
      toast({ title: "Client deleted successfully" });
      setSelectedClient(null);
    } catch (error: any) {
      toast({
        title: "Error deleting client",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const onSubmitDevice = (data: any) => {
    const deviceData = {
      ...data,
      clientId: selectedClient.id
    };
    createDeviceMutation.mutate(deviceData);
  };

  const filteredClients = clients?.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone?.includes(searchQuery)
  ) || [];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Client</DialogTitle>
            </DialogHeader>
            <ClientForm onSuccess={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-500 text-center">
                  {searchQuery ? "No clients found matching your search" : "No clients found"}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredClients.map((client) => (
            <Card 
              key={client.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedClient(client)}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{client.name}</span>
                  <div className="flex items-center text-sm text-gray-500">
                    <Laptop className="w-4 h-4 mr-1" />
                    {client.devices.length}
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {client.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{client.email}</span>
                    </div>
                  )}
                  
                  {client.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{client.phone}</span>
                    </div>
                  )}
                  
                  {client.address && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-600 line-clamp-2">{client.address}</span>
                    </div>
                  )}
                  
                  <div className="pt-2 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Client since {format(new Date(client.createdAt), "MMM yyyy")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Client Detail Modal */}
      {selectedClient && (
        <Dialog open={!!selectedClient} onOpenChange={() => setSelectedClient(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>{selectedClient.name}</DialogTitle>
                <div className="flex space-x-2">
                  <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Client
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Edit Client</DialogTitle>
                      </DialogHeader>
                      <ClientForm 
                        clientId={selectedClient.id}
                        initialData={selectedClient}
                        onSuccess={() => {
                          setIsEditOpen(false);
                          setSelectedClient(null);
                        }} 
                      />
                    </DialogContent>
                  </Dialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Client</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {selectedClient.name}? This action cannot be undone and will also delete all associated devices and tickets.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteClient(selectedClient.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete Client
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </DialogHeader>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectedClient.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{selectedClient.email}</span>
                    </div>
                  )}
                  {selectedClient.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{selectedClient.phone}</span>
                    </div>
                  )}
                  {selectedClient.address && (
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{selectedClient.address}</span>
                    </div>
                  )}
                  {selectedClient.notes && (
                    <div className="pt-2">
                      <p className="text-sm text-gray-600">{selectedClient.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Devices */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Devices ({selectedClient.devices.length})</CardTitle>
                    <Dialog open={isAddDeviceOpen} onOpenChange={setIsAddDeviceOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Device
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Add Device for {selectedClient.name}</DialogTitle>
                        </DialogHeader>
                        
                        <Form {...deviceForm}>
                          <form onSubmit={deviceForm.handleSubmit(onSubmitDevice)} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={deviceForm.control}
                                name="type"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Device Type</FormLabel>
                                    <Select onValueChange={field.onChange}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="laptop">Laptop</SelectItem>
                                        <SelectItem value="desktop">Desktop</SelectItem>
                                        <SelectItem value="smartphone">Smartphone</SelectItem>
                                        <SelectItem value="tablet">Tablet</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={deviceForm.control}
                                name="brand"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Brand</FormLabel>
                                    <FormControl>
                                      <Input placeholder="e.g., Apple, Dell, HP" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <FormField
                              control={deviceForm.control}
                              name="model"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Model</FormLabel>
                                  <FormControl>
                                    <Input placeholder="e.g., MacBook Pro 13, OptiPlex 7070" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={deviceForm.control}
                              name="serialNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Serial Number</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Device serial number" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={deviceForm.control}
                              name="notes"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Notes</FormLabel>
                                  <FormControl>
                                    <Textarea placeholder="Additional device information..." {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <div className="flex justify-end space-x-3">
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => setIsAddDeviceOpen(false)}
                              >
                                Cancel
                              </Button>
                              <Button type="submit" disabled={createDeviceMutation.isPending}>
                                {createDeviceMutation.isPending ? "Adding..." : "Add Device"}
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedClient.devices.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No devices registered</p>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {selectedClient.devices.map((device: any) => (
                        <Card key={device.id} className="p-3 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-3">
                              {getDeviceIcon(device.type)}
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <p className="font-medium">{device.brand} {device.model}</p>
                                  <Badge className={getTypeColor(device.type)} variant="secondary">
                                    {device.type}
                                  </Badge>
                                </div>
                                {device.serialNumber && (
                                  <div className="flex items-center space-x-1 mt-1">
                                    <Hash className="w-3 h-3 text-gray-400" />
                                    <span className="text-xs text-gray-500 font-mono">{device.serialNumber}</span>
                                  </div>
                                )}
                                {device.notes && (
                                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{device.notes}</p>
                                )}
                                <p className="text-xs text-gray-400 mt-1">
                                  Added {format(new Date(device.createdAt), "MMM d, yyyy")}
                                </p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
