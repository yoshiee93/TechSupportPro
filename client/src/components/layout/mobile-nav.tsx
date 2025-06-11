import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useDashboardStats } from '@/hooks/use-tickets';
import { useClients } from '@/hooks/use-clients';
import { 
  Menu,
  Home, 
  TicketIcon, 
  Users, 
  Laptop, 
  BarChart3, 
  Settings,
  Wrench,
  Shield,
  Warehouse,
  Receipt,
  ShoppingCart,
  X
} from 'lucide-react';

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { data: stats } = useDashboardStats();
  const { data: clients = [] } = useClients();

  const navigation = [
    { name: "Dashboard", href: "/", icon: Home },
    { 
      name: "Tickets", 
      href: "/tickets", 
      icon: TicketIcon, 
      badge: stats?.activeTickets || 0 
    },
    { 
      name: "Clients", 
      href: "/clients", 
      icon: Users, 
      badge: clients.length || 0 
    },
    { 
      name: "Inventory", 
      href: "/inventory", 
      icon: Warehouse 
    },
    { 
      name: "Billing", 
      href: "/billing", 
      icon: Receipt 
    },
    { 
      name: "Sales", 
      href: "/sales", 
      icon: ShoppingCart 
    },
    { name: "Admin", href: "/admin", icon: Shield },
    { name: "Reports", href: "/reports", icon: BarChart3 },
  ];

  const handleNavClick = () => {
    setIsOpen(false);
  };

  return (
    <div className="md:hidden">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Menu className="h-6 w-6" />
            {stats?.activeTickets > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs">
                {stats.activeTickets}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        
        <SheetContent side="left" className="w-80 p-0">
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Wrench className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900">TechFix Pro</h1>
                  <p className="text-xs text-gray-500">IT Support System</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {navigation.map((item) => {
                const isActive = location === item.href;
                
                return (
                  <Link key={item.name} href={item.href}>
                    <div
                      onClick={handleNavClick}
                      className={cn(
                        "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                        isActive
                          ? "text-blue-700 bg-blue-50"
                          : "text-gray-600 hover:bg-gray-50 active:bg-gray-100"
                      )}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      {item.name}
                      {item.badge !== undefined && item.badge > 0 && (
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "ml-auto text-xs px-2 py-0.5",
                            item.name === "Tickets" 
                              ? "bg-red-100 text-red-800"
                              : "bg-blue-100 text-blue-800"
                          )}
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                  </Link>
                );
              })}
              
              <div className="pt-4 border-t border-gray-200">
                <Link href="/settings">
                  <div
                    onClick={handleNavClick}
                    className={cn(
                      "flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                      location === "/settings"
                        ? "text-blue-700 bg-blue-50"
                        : "text-gray-600 hover:bg-gray-50 active:bg-gray-100"
                    )}
                  >
                    <Settings className="w-5 h-5 mr-3" />
                    Settings
                  </div>
                </Link>
              </div>
            </nav>

            {/* User Profile */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">MA</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">Master Admin</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}