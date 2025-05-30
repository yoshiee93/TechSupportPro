import { useState } from "react";
import { usePartsOrders, useReminders } from "@/hooks/use-parts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Search, Plus, Package, Clock, AlertTriangle, CheckCircle, Calendar } from "lucide-react";

export default function Parts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("orders");

  const { data: partsOrders, isLoading: partsLoading } = usePartsOrders();
  const { data: reminders, isLoading: remindersLoading } = useReminders("all");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ordered": return "bg-gray-100 text-gray-800";
      case "in_transit": return "bg-yellow-100 text-yellow-800";
      case "delivered": return "bg-green-100 text-green-800";
      case "installed": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ordered": return <Clock className="w-4 h-4" />;
      case "in_transit": return <Package className="w-4 h-4" />;
      case "delivered": return <CheckCircle className="w-4 h-4" />;
      case "installed": return <CheckCircle className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const getReminderTypeColor = (type: string) => {
    switch (type) {
      case "follow_up": return "bg-blue-100 text-blue-800";
      case "warranty_expiry": return "bg-red-100 text-red-800";
      case "maintenance": return "bg-green-100 text-green-800";
      case "custom": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredParts = partsOrders?.filter(part => {
    const matchesSearch = 
      part.partName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.supplier?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      part.orderNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || part.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const filteredReminders = reminders?.filter(reminder =>
    reminder.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reminder.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (partsLoading || remindersLoading) {
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
        <h1 className="text-2xl font-bold text-gray-900">Parts & Reminders</h1>
        
        <div className="flex space-x-2">
          <Button variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Add Reminder
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Order Parts
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="orders">Parts Orders</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
        </TabsList>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder={activeTab === "orders" ? "Search parts..." : "Search reminders..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {activeTab === "orders" && (
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ordered">Ordered</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="installed">Installed</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>

        <TabsContent value="orders">
          {/* Parts Orders */}
          <div className="space-y-4">
            {filteredParts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="w-12 h-12 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-center">
                    {searchQuery ? "No parts orders found matching your search" : "No parts orders found"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredParts.map((part) => (
                <Card key={part.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(part.status)}
                        <div>
                          <h3 className="font-semibold text-lg">{part.partName}</h3>
                          <p className="text-sm text-gray-600">
                            Qty: {part.quantity} • Order #{part.orderNumber}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(part.status)}>
                          {part.status.replace("_", " ")}
                        </Badge>
                        {part.cost && (
                          <span className="text-lg font-bold">${part.cost}</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Supplier:</span>
                        <p className="font-medium">{part.supplier || "Not specified"}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Order Date:</span>
                        <p className="font-medium">{format(new Date(part.orderDate), "MMM d, yyyy")}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Expected:</span>
                        <p className="font-medium">
                          {part.expectedDate 
                            ? format(new Date(part.expectedDate), "MMM d, yyyy")
                            : "No ETA"
                          }
                        </p>
                      </div>
                    </div>

                    {part.notes && (
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <p className="text-sm text-gray-600">{part.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="reminders">
          {/* Reminders */}
          <div className="space-y-4">
            {filteredReminders.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertTriangle className="w-12 h-12 text-gray-300 mb-4" />
                  <p className="text-gray-500 text-center">
                    {searchQuery ? "No reminders found matching your search" : "No reminders found"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredReminders.map((reminder) => {
                const isOverdue = new Date(reminder.dueDate) < new Date() && !reminder.isCompleted;
                const isDueToday = new Date(reminder.dueDate).toDateString() === new Date().toDateString();
                
                return (
                  <Card 
                    key={reminder.id} 
                    className={`hover:shadow-md transition-shadow ${
                      isOverdue ? "border-red-200 bg-red-50" : 
                      isDueToday ? "border-yellow-200 bg-yellow-50" : ""
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-3">
                          <div className={`w-3 h-3 rounded-full mt-1 ${
                            isOverdue ? "bg-red-500" :
                            isDueToday ? "bg-yellow-500" :
                            reminder.isCompleted ? "bg-green-500" : "bg-blue-500"
                          }`}></div>
                          <div>
                            <h3 className="font-semibold text-lg">{reminder.title}</h3>
                            {reminder.description && (
                              <p className="text-gray-600 mt-1">{reminder.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className={getReminderTypeColor(reminder.type)}>
                            {reminder.type.replace("_", " ")}
                          </Badge>
                          {reminder.isCompleted && (
                            <Badge className="bg-green-100 text-green-800">
                              Completed
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className={`${
                            isOverdue ? "text-red-600 font-medium" :
                            isDueToday ? "text-yellow-600 font-medium" :
                            "text-gray-600"
                          }`}>
                            Due {format(new Date(reminder.dueDate), "MMM d, yyyy")}
                            {isOverdue && " (Overdue)"}
                            {isDueToday && " (Today)"}
                          </span>
                        </div>
                        
                        <div className="flex space-x-2">
                          {!reminder.isCompleted && (
                            <Button size="sm" variant="outline">
                              Mark Complete
                            </Button>
                          )}
                          <Button size="sm" variant="ghost">
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
