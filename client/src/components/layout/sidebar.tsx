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
  Receipt,
  ShoppingCart,
  Brain
} from "lucide-react";

export default function Sidebar() {
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
      name: "Sales", 
      href: "/sales", 
      icon: ShoppingCart 
    },
    { 
      name: "Inventory", 
      href: "/inventory", 
      icon: Warehouse 
    },
    { 
      name: "Clients", 
      href: "/clients", 
      icon: Users, 
      badge: clients.length || 0 
    },
    { 
      name: "Billing", 
      href: "/billing", 
      icon: Receipt 
    },
    { 
      name: "AI Insights", 
      href: "/ai-insights", 
      icon: Brain 
    },
    { name: "Admin", href: "/admin", icon: Shield },
    { name: "Reports", href: "/reports", icon: BarChart3 },
  ];

  return (
    <aside className="hidden md:flex w-64 bg-white shadow-lg border-r border-gray-200 flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Wrench className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">TechFix Pro</h1>
            <p className="text-xs text-gray-500">IT Support System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = location === item.href;
          
          return (
            <Link key={item.name} href={item.href}>
              <div
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer",
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
          <Link href="/settings">
            <div
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer",
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
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">MA</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Master Admin</p>
            <p className="text-xs text-gray-500">Administrator</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
