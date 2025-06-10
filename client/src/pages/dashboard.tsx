import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDashboardStats } from "@/hooks/use-tickets";
import { useReminders } from "@/hooks/use-parts";
import { useTickets } from "@/hooks/use-tickets";
import { usePartsOrders } from "@/hooks/use-parts";
import { format } from "date-fns";
import { 
  TicketIcon, 
  Cog, 
  CheckCircle, 
  DollarSign, 
  TrendingDown, 
  Clock, 
  TrendingUp,
  AlertTriangle,
  ArrowUpIcon,
  ArrowDownIcon,
  Calendar
} from "lucide-react";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: tickets, isLoading: ticketsLoading } = useTickets();
  const { data: reminders, isLoading: remindersLoading } = useReminders("upcoming");
  const { data: partsOrders, isLoading: partsLoading } = usePartsOrders();

  const recentTickets = tickets?.slice(0, 4) || [];
  const urgentReminders = reminders?.slice(0, 3) || [];
  const recentParts = partsOrders?.slice(0, 3) || [];

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

  const getPartsStatusColor = (status: string) => {
    switch (status) {
      case "ordered": return "bg-gray-100 text-gray-800";
      case "in_transit": return "bg-yellow-100 text-yellow-800";
      case "delivered": return "bg-green-100 text-green-800";
      case "installed": return "bg-blue-100 text-blue-800";
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

  if (statsLoading || ticketsLoading || remindersLoading || partsLoading) {
    return (
      <div className="p-3 sm:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-48 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard</h1>
          <div className="hidden sm:flex text-sm text-gray-500 items-center">
            <Calendar className="w-4 h-4 mr-1" />
            {format(new Date(), "MMMM d, yyyy")}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Active Tickets</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats?.activeTickets || 0}</p>
                <p className="text-xs sm:text-sm text-green-600 flex items-center mt-1">
                  <ArrowDownIcon className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                  12% from last week
                </p>
              </div>
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TicketIcon className="w-5 sm:w-6 h-5 sm:h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Pending Parts</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats?.pendingParts || 0}</p>
                <p className="text-xs sm:text-sm text-yellow-600 flex items-center mt-1">
                  <Clock className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                  {urgentReminders.length} overdue
                </p>
              </div>
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Cog className="w-5 sm:w-6 h-5 sm:h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Ready for Pickup</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{stats?.readyForPickup || 0}</p>
                <p className="text-xs sm:text-sm text-green-600 flex items-center mt-1">
                  <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                  {stats?.completedToday || 0} collected today
                </p>
              </div>
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 sm:w-6 h-5 sm:h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">Revenue This Month</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">${(stats?.revenue || 0).toLocaleString()}</p>
                <p className="text-xs sm:text-sm text-green-600 flex items-center mt-1">
                  <ArrowUpIcon className="w-3 sm:w-4 h-3 sm:h-4 mr-1" />
                  8% from last month
                </p>
              </div>
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 sm:w-6 h-5 sm:h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Recent Tickets */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Tickets</CardTitle>
              <Button variant="ghost" size="sm">View All</Button>
            </CardHeader>
            <CardContent className="p-0">
              {recentTickets.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <TicketIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No tickets found</p>
                </div>
              ) : (
                recentTickets.map((ticket) => (
                  <div key={ticket.id} className="p-4 sm:p-6 border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 space-y-2 sm:space-y-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 text-xs">
                          {ticket.ticketNumber}
                        </Badge>
                        <Badge className={`${getStatusColor(ticket.status)} text-xs`}>
                          {ticket.status.replace("_", " ")}
                        </Badge>
                        {ticket.priority === "urgent" && (
                          <Badge className={`${getPriorityColor(ticket.priority)} text-xs`}>
                            Urgent
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs sm:text-sm text-gray-500">
                        {format(new Date(ticket.createdAt), "MMM d, h:mm a")}
                      </span>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1 text-sm sm:text-base">{ticket.title}</h4>
                    <p className="text-xs sm:text-sm text-gray-600 mb-2">
                      {ticket.client.name} • {ticket.device.brand} {ticket.device.model}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">{ticket.description}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-4 sm:space-y-6">
          
          {/* Urgent Reminders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                Urgent Reminders
              </CardTitle>
            </CardHeader>
            <CardContent>
              {urgentReminders.length === 0 ? (
                <p className="text-sm text-gray-500">No urgent reminders</p>
              ) : (
                <div className="space-y-4">
                  {urgentReminders.map((reminder) => (
                    <div key={reminder.id} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{reminder.title}</p>
                        <p className="text-xs text-gray-500">{reminder.description}</p>
                        <p className="text-xs text-red-600 mt-1">
                          Due {format(new Date(reminder.dueDate), "MMM d")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Parts Status */}
          <Card>
            <CardHeader>
              <CardTitle>Parts Status</CardTitle>
            </CardHeader>
            <CardContent>
              {recentParts.length === 0 ? (
                <p className="text-sm text-gray-500">No recent parts orders</p>
              ) : (
                <div className="space-y-4">
                  {recentParts.map((part) => (
                    <div key={part.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{part.partName}</p>
                        <p className="text-xs text-gray-500">Order #{part.orderNumber}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={getPartsStatusColor(part.status)}>
                          {part.status.replace("_", " ")}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          {part.expectedDate ? format(new Date(part.expectedDate), "MMM d") : "No ETA"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Today's Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Tickets Completed</span>
                  <span className="text-sm font-semibold text-gray-900">{stats?.completedToday || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">New Tickets</span>
                  <span className="text-sm font-semibold text-gray-900">{stats?.newToday || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Parts Received</span>
                  <span className="text-sm font-semibold text-gray-900">{stats?.partsReceivedToday || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Revenue</span>
                  <span className="text-sm font-semibold text-gray-900">${stats?.revenueToday || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
