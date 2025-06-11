import { useLocation } from 'wouter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useDashboardStats } from '@/hooks/use-tickets';
import MobileNav from './mobile-nav';
import { 
  Bell,
  Search,
  Plus,
  Wrench
} from 'lucide-react';

export default function MobileHeader() {
  const [location] = useLocation();
  const { data: stats } = useDashboardStats();

  const getPageTitle = () => {
    switch (location) {
      case '/': return 'Dashboard';
      case '/tickets': return 'Tickets';
      case '/clients': return 'Clients';
      case '/devices': return 'Devices';
      case '/inventory': return 'Inventory';
      case '/billing': return 'Billing';
      case '/sales': return 'Sales';
      case '/admin': return 'Admin';
      case '/reports': return 'Reports';
      case '/settings': return 'Settings';
      default: return 'TechFix Pro';
    }
  };

  const getQuickAction = () => {
    switch (location) {
      case '/tickets':
        return { icon: Plus, label: 'New Ticket', href: '/tickets?new=true' };
      case '/clients':
        return { icon: Plus, label: 'New Client', href: '/clients?new=true' };
      case '/sales':
        return { icon: Plus, label: 'New Sale', href: '/sales?new=true' };
      default:
        return null;
    }
  };

  const quickAction = getQuickAction();

  return (
    <header className="md:hidden bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left side - Menu + Logo */}
        <div className="flex items-center space-x-3">
          <MobileNav />
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
              <Wrench className="w-3 h-3 text-white" />
            </div>
            <h1 className="text-lg font-semibold text-gray-900 truncate">
              {getPageTitle()}
            </h1>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-2">
          {/* Search Button */}
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Search className="h-4 w-4" />
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="h-9 w-9 relative">
            <Bell className="h-4 w-4" />
            {stats?.activeTickets > 0 && (
              <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">
                {stats.activeTickets}
              </Badge>
            )}
          </Button>

          {/* Quick Action */}
          {quickAction && (
            <Button size="sm" className="h-9 px-3">
              <quickAction.icon className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">{quickAction.label}</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}