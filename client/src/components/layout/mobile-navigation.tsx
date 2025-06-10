import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useDashboardStats } from "@/hooks/use-tickets";
import { useClients } from "@/hooks/use-clients";
import { usePartsOrders } from "@/hooks/use-parts";
import { 
  Home, 
  TicketIcon, 
  Users, 
  Laptop, 
  Package, 
  BarChart3, 
  Settings,
  Wrench,
  Shield,
  Warehouse,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileNavigationProps {
  onClose: () => void;
}

export default function MobileNavigation({ onClose }: MobileNavigationProps) {
  const [location] = useLocation();
  const { data: stats } = useDashboardStats();
  const { data: clients = [] } = useClients();
  const { data: partsOrders = [] } = usePartsOrders();

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
      name: "Parts & Orders", 
      href: "/parts", 
      icon: Package, 
      badge: stats?.pendingParts || 0 
    },
    { 
      name: "Inventory", 
      href: "/inventory", 
      icon: Warehouse 
    },
    { name: "Admin", href: "/admin", icon: Shield },
    { name: "Reports", href: "/reports", icon: BarChart3 },
  ];

  const handleLinkClick = () => {
    onClose();
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Wrench className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">TechFix Pro</h1>
            <p className="text-xs text-gray-500">IT Support System</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          
          return (
            <Link key={item.name} href={item.href} onClick={handleLinkClick}>
              <div
                className={cn(
                  "flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors cursor-pointer",
                  isActive
                    ? "text-blue-700 bg-blue-50"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "ml-auto text-xs px-2 py-0.5",
                      item.name === "Repair Tickets" 
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
          <Link href="/settings" onClick={handleLinkClick}>
            <div
              className={cn(
                "flex items-center px-4 py-3 text-base font-medium rounded-lg transition-colors cursor-pointer",
                location === "/settings"
                  ? "text-blue-700 bg-blue-50"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <Settings className="w-5 h-5 mr-3" />
              Settings
            </div>
          </Link>
        </div>
      </nav>

      {/* User Profile */}
      <div className="px-4 py-6 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">MA</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium text-gray-900 truncate">Master Admin</p>
            <p className="text-sm text-gray-500">Administrator</p>
          </div>
        </div>
      </div>
    </div>
  );
}