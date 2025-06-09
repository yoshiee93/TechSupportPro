import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  TicketIcon, 
  Users, 
  Laptop, 
  Package, 
  BarChart3, 
  Settings,
  Wrench
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Repair Tickets", href: "/tickets", icon: TicketIcon, badge: 3 },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Parts & Orders", href: "/parts", icon: Package, badge: 7 },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-gray-200 flex flex-col">
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
              <a
                className={cn(
                  "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "text-blue-700 bg-blue-50"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
                {item.badge && (
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "ml-auto text-xs px-2 py-0.5",
                      item.name === "Repair Tickets" 
                        ? "bg-red-100 text-red-800"
                        : "bg-yellow-100 text-yellow-800"
                    )}
                  >
                    {item.badge}
                  </Badge>
                )}
              </a>
            </Link>
          );
        })}
        
        <div className="pt-4 border-t border-gray-200">
          <Link href="/settings">
            <a
              className={cn(
                "flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                location === "/settings"
                  ? "text-blue-700 bg-blue-50"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <Settings className="w-5 h-5 mr-3" />
              Settings
            </a>
          </Link>
        </div>
      </nav>

      {/* User Profile */}
      <div className="px-4 py-6 border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">JD</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">John Doe</p>
            <p className="text-xs text-gray-500">Senior Technician</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
