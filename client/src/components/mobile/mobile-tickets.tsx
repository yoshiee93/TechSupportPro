import { useState } from "react";
import { useTickets } from "@/hooks/use-tickets";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { 
  Search, 
  Filter, 
  Plus, 
  Phone, 
  Mail, 
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Wrench,
  Package
} from "lucide-react";
import { Link } from "wouter";

export default function MobileTickets() {
  const { data: tickets, isLoading } = useTickets();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "received": return <Package className="w-4 h-4" />;
      case "diagnosed": return <AlertCircle className="w-4 h-4" />;
      case "awaiting_parts": return <Clock className="w-4 h-4" />;
      case "in_progress": return <Wrench className="w-4 h-4" />;
      case "ready_for_pickup": return <CheckCircle2 className="w-4 h-4" />;
      case "completed": return <CheckCircle2 className="w-4 h-4" />;
      default: return <Package className="w-4 h-4" />;
    }
  };

  const filteredTickets = tickets?.filter((ticket: any) => {
    const matchesSearch = 
      ticket.ticketNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.deviceModel?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || ticket.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  }) || [];

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Tickets</h1>
        <Link href="/tickets/new">
          <Button size="sm" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="received">Received</SelectItem>
              <SelectItem value="diagnosed">Diagnosed</SelectItem>
              <SelectItem value="awaiting_parts">Awaiting Parts</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No tickets found</p>
          </div>
        ) : (
          filteredTickets.map((ticket: any) => (
            <Link key={ticket.id} href={`/tickets/${ticket.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header Row */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ticket.status)}
                        <span className="font-semibold text-gray-900">
                          #{ticket.ticketNumber}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getPriorityColor(ticket.priority)} variant="secondary">
                          {ticket.priority}
                        </Badge>
                        <Badge className={getStatusColor(ticket.status)} variant="secondary">
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div>
                      <p className="font-medium text-gray-900">{ticket.customerName}</p>
                      <p className="text-sm text-gray-600">{ticket.deviceModel}</p>
                    </div>

                    {/* Issue Description */}
                    {ticket.issueDescription && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {ticket.issueDescription}
                      </p>
                    )}

                    {/* Contact Info */}
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {ticket.customerPhone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{ticket.customerPhone}</span>
                        </div>
                      )}
                      {ticket.customerEmail && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          <span className="truncate">{ticket.customerEmail}</span>
                        </div>
                      )}
                    </div>

                    {/* Date Info */}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>Created {format(new Date(ticket.createdAt), "MMM d")}</span>
                      </div>
                      {ticket.estimatedCompletion && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Est. {format(new Date(ticket.estimatedCompletion), "MMM d")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}