import { useState } from 'react';
import { Link } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDashboardStats } from '@/hooks/use-tickets';
import { useTickets } from '@/hooks/use-tickets';
import { useClients } from '@/hooks/use-clients';
import { 
  TicketIcon,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Plus,
  ArrowRight,
  Wrench,
  Package
} from 'lucide-react';

export default function MobileDashboard() {
  const { data: stats } = useDashboardStats();
  const { data: tickets = [] } = useTickets();
  const { data: clients = [] } = useClients();

  const recentTickets = tickets.slice(0, 3);
  const urgentTickets = tickets.filter((ticket: any) => ticket.priority === 'urgent').slice(0, 2);

  const quickActions = [
    { 
      label: 'New Ticket', 
      href: '/tickets', 
      icon: TicketIcon, 
      color: 'bg-blue-500',
      description: 'Create repair ticket'
    },
    { 
      label: 'Quick Sale', 
      href: '/sales', 
      icon: Package, 
      color: 'bg-green-500',
      description: 'Process sale'
    },
    { 
      label: 'Add Client', 
      href: '/clients', 
      icon: Users, 
      color: 'bg-purple-500',
      description: 'Register new client'
    },
    { 
      label: 'Inventory', 
      href: '/inventory', 
      icon: Wrench, 
      color: 'bg-orange-500',
      description: 'Check stock'
    }
  ];

  return (
    <div className="space-y-4 pb-20">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Tickets</p>
                <p className="text-2xl font-bold">{stats?.activeTickets || 0}</p>
              </div>
              <TicketIcon className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats?.completedTickets || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Urgent</p>
                <p className="text-2xl font-bold">{urgentTickets.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold">${stats?.revenue || 0}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Link key={action.label} href={action.href}>
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center space-y-2 w-full"
                >
                  <div className={`p-2 rounded-full ${action.color}`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-sm">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Urgent Tickets */}
      {urgentTickets.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Urgent Tickets
              </CardTitle>
              <Link href="/tickets">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            {urgentTickets.map((ticket: any) => (
              <div key={ticket.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex-1">
                  <p className="font-medium text-sm">{ticket.ticketNumber}</p>
                  <p className="text-sm text-muted-foreground truncate">{ticket.issue}</p>
                  <p className="text-xs text-muted-foreground">{ticket.client?.name}</p>
                </div>
                <Badge variant="destructive" className="text-xs">
                  {ticket.priority}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Recent Tickets</CardTitle>
            <Link href="/tickets">
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          {recentTickets.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <TicketIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No recent tickets</p>
            </div>
          ) : (
            recentTickets.map((ticket: any) => (
              <div key={ticket.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-sm">{ticket.ticketNumber}</p>
                  <p className="text-sm text-muted-foreground truncate">{ticket.issue}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">{ticket.client?.name}</p>
                  </div>
                </div>
                <Badge 
                  variant={
                    ticket.status === 'completed' ? 'default' :
                    ticket.status === 'in-progress' ? 'secondary' : 'outline'
                  }
                  className="text-xs"
                >
                  {ticket.status}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}