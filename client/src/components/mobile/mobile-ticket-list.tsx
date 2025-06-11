import { Link } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Clock,
  User,
  Phone,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';

interface MobileTicketListProps {
  tickets: any[];
  isLoading?: boolean;
}

export default function MobileTicketList({ tickets, isLoading }: MobileTicketListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">No tickets found</p>
        </CardContent>
      </Card>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    }
  };

  return (
    <div className="space-y-3">
      {tickets.map((ticket: any) => (
        <Card key={ticket.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm">{ticket.ticketNumber}</h3>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getPriorityColor(ticket.priority)}`}
                    >
                      {ticket.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{ticket.issue}</p>
                </div>
                <div className="flex items-center gap-1">
                  {getStatusIcon(ticket.status)}
                  <Badge 
                    variant={ticket.status === 'completed' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {ticket.status}
                  </Badge>
                </div>
              </div>

              {/* Client Info */}
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {ticket.client?.name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{ticket.client?.name}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {ticket.client?.phone}
                    </div>
                  </div>
                </div>
              </div>

              {/* Device Info */}
              {ticket.device && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium">
                        {ticket.device.brand} {ticket.device.model}
                      </p>
                      <p className="text-xs text-gray-500">{ticket.device.type}</p>
                    </div>
                    {ticket.device.serialNumber && (
                      <p className="text-xs text-gray-500 font-mono">
                        {ticket.device.serialNumber}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(ticket.createdAt), 'MMM dd, hh:mm a')}
                </div>
                
                <Link href={`/tickets/${ticket.id}`}>
                  <Button variant="ghost" size="sm" className="h-8 px-3">
                    View
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}