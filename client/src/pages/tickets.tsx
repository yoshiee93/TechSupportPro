import { useState } from "react";
import { useTickets, useDeleteTicket } from "@/hooks/use-tickets";
import { useClients } from "@/hooks/use-clients";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TicketForm from "@/components/ticket/ticket-form";
import RepairNotesList from "@/components/repair/repair-notes-list";
import TicketTimer from "@/components/timer/ticket-timer";
import TimeLogsList from "@/components/timer/time-logs-list";
import { PhotoUpload } from "@/components/attachment/photo-upload";
import { PhotoGallery } from "@/components/attachment/photo-gallery";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Search, Plus, Filter, TicketIcon, Phone, Mail, MapPin, Edit, Trash2 } from "lucide-react";

export default function Tickets() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const { toast } = useToast();
  const deleteMutation = useDeleteTicket();

  const { data: tickets, isLoading } = useTickets(searchQuery);
  const { data: clients } = useClients();

  const handleDeleteTicket = async (ticketId: number) => {
    try {
      await deleteMutation.mutateAsync(ticketId);
      toast({ title: "Ticket deleted successfully" });
      setSelectedTicket(null);
    } catch (error: any) {
      toast({
        title: "Error deleting ticket",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "received": return "bg-blue-100 text-blue-800";
      case "diagnosed": return "bg-gray-100 text-gray-800";
      case "awaiting_parts": return "bg-yellow-100 text-yellow-800";
      case "in_progress": return "bg-orange-100 text-orange-800";
      case "ready_for_pickup": return "bg-green-100 text-green-800";
      case "completed": return "bg-gray-100 text-gray-600";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredTickets = tickets?.filter(ticket => {
    if (statusFilter !== "all" && ticket.status !== statusFilter) return false;
    if (priorityFilter !== "all" && ticket.priority !== priorityFilter) return false;
    return true;
  }) || [];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Repair Tickets</h1>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Ticket</DialogTitle>
            </DialogHeader>
            <TicketForm onSuccess={() => setIsCreateOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search tickets, clients, devices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="diagnosed">Diagnosed</SelectItem>
            <SelectItem value="awaiting_parts">Awaiting Parts</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Priorities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tickets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTickets.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TicketIcon className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-500 text-center">
                  {searchQuery ? "No tickets found matching your search" : "No tickets found"}
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredTickets.map((ticket) => (
            <Card 
              key={ticket.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedTicket(ticket)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-blue-100 text-blue-800">
                    {ticket.ticketNumber}
                  </Badge>
                  <div className="flex space-x-2">
                    <Badge className={getStatusColor(ticket.status)}>
                      {ticket.status.replace("_", " ")}
                    </Badge>
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-lg">{ticket.title}</CardTitle>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Client:</span>
                    <span className="font-medium">{ticket.client.name}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Device:</span>
                    <span className="font-medium">{ticket.device.brand} {ticket.device.model}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Created:</span>
                    <span>{format(new Date(ticket.createdAt), "MMM d, yyyy")}</span>
                  </div>
                  
                  {ticket.estimatedCost && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Est. Cost:</span>
                      <span className="font-medium">${ticket.estimatedCost}</span>
                    </div>
                  )}
                  
                  <p className="text-sm text-gray-600 line-clamp-2">{ticket.description}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle className="flex items-center space-x-3">
                  <span>{selectedTicket.ticketNumber}</span>
                  <Badge className={getStatusColor(selectedTicket.status)}>
                    {selectedTicket.status.replace("_", " ")}
                  </Badge>
                  <Badge className={getPriorityColor(selectedTicket.priority)}>
                    {selectedTicket.priority}
                  </Badge>
                </DialogTitle>
                <div className="flex space-x-2">
                  <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Ticket
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Edit Ticket</DialogTitle>
                      </DialogHeader>
                      <TicketForm 
                        ticketId={selectedTicket.id}
                        initialData={selectedTicket}
                        onSuccess={() => {
                          setIsEditOpen(false);
                          setSelectedTicket(null);
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
                        <AlertDialogTitle>Delete Ticket</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete ticket {selectedTicket.ticketNumber}? This action cannot be undone and will also delete all associated repair notes and activity logs.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteTicket(selectedTicket.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete Ticket
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Ticket Overview */}
              <div>
                <h3 className="font-semibold text-lg mb-2">{selectedTicket.title}</h3>
                <p className="text-gray-600 mb-4">{selectedTicket.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Client Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{selectedTicket.client.name}</span>
                      </div>
                      {selectedTicket.client.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{selectedTicket.client.email}</span>
                        </div>
                      )}
                      {selectedTicket.client.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{selectedTicket.client.phone}</span>
                        </div>
                      )}
                      {selectedTicket.client.address && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{selectedTicket.client.address}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Device Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="capitalize">{selectedTicket.device.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Brand:</span>
                        <span>{selectedTicket.device.brand}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Model:</span>
                        <span>{selectedTicket.device.model}</span>
                      </div>
                      {selectedTicket.device.serialNumber && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Serial:</span>
                          <span className="font-mono text-sm">{selectedTicket.device.serialNumber}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Tabbed Content */}
              <Tabs defaultValue="notes" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="notes">Notes & Progress</TabsTrigger>
                  <TabsTrigger value="photos">Photos & Files</TabsTrigger>
                  <TabsTrigger value="time">Time Tracking</TabsTrigger>
                </TabsList>
                
                <TabsContent value="notes" className="space-y-6">
                  <RepairNotesList ticketId={selectedTicket.id} />
                  
                  {/* Activity Log */}
                  {selectedTicket.activityLogs && selectedTicket.activityLogs.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Activity Log</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {selectedTicket.activityLogs.slice(0, 5).map((log: any) => (
                            <div key={log.id} className="flex items-start space-x-3 pb-3 border-b border-gray-100 last:border-0">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                              <div className="flex-1">
                                <p className="text-sm font-medium">{log.description}</p>
                                <p className="text-xs text-gray-500">
                                  {format(new Date(log.createdAt), "MMM d, yyyy h:mm a")} by {log.createdBy}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>
                
                <TabsContent value="photos" className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-blue-900">Photo Upload & Gallery</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Phase 2 Feature</span>
                    </div>
                  </div>
                  <PhotoGallery ticketId={selectedTicket.id} />
                  <PhotoUpload 
                    ticketId={selectedTicket.id} 
                    onUploadComplete={() => {
                      // Refresh ticket data to show new attachment
                      window.location.reload();
                    }} 
                  />
                </TabsContent>
                
                <TabsContent value="time" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TicketTimer ticketId={selectedTicket.id} />
                    <TimeLogsList ticketId={selectedTicket.id} />
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
