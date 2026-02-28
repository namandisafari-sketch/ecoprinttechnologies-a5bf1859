import { Home, Search, ShoppingCart, Bell, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useAppNotifications } from "@/hooks/useAppNotifications";

interface BottomNavigationProps {
  cartCount: number;
  onCartClick: () => void;
}

const BottomNavigation = ({ cartCount, onCartClick }: BottomNavigationProps) => {
  const location = useLocation();
  const { isAdmin } = useAuth();
  const { unreadCount } = useAppNotifications();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Search, label: "Search", path: "/search" },
    { icon: ShoppingCart, label: "Cart", path: "#cart", isCart: true },
    { icon: Bell, label: "Alerts", path: "/notifications", badge: unreadCount },
    { icon: User, label: isAdmin ? "Admin" : "Account", path: isAdmin ? "/admin" : "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = item.path === location.pathname;
          const Icon = item.icon;
          
          if (item.isCart) {
            return (
              <button
                key={item.label}
                onClick={onCartClick}
                className="flex flex-col items-center justify-center flex-1 h-full relative"
              >
                <div className="relative">
                  <div className="w-12 h-12 -mt-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
                    <Icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs font-bold bg-destructive text-destructive-foreground rounded-full">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium text-primary mt-1">{item.label}</span>
              </button>
            );
          }
          
          return (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-colors relative",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5", isActive && "scale-110")} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 h-4 w-4 flex items-center justify-center text-[10px] font-bold bg-destructive text-destructive-foreground rounded-full">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] mt-1 font-medium",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
