import { 
  LayoutDashboard, 
  Receipt, 
  Package, 
  ShoppingCart, 
  MoreHorizontal 
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const AdminBottomNavigation = () => {
  const location = useLocation();
  
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
    { icon: Receipt, label: "POS", path: "/admin/pos" },
    { icon: Package, label: "Products", path: "/admin/products" },
    { icon: ShoppingCart, label: "Orders", path: "/admin/orders" },
    { icon: MoreHorizontal, label: "More", path: "/admin/more" },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-secondary border-t border-secondary-foreground/10 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = item.path === "/admin" 
            ? location.pathname === "/admin"
            : location.pathname.startsWith(item.path);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.label}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                isActive ? "text-primary" : "text-secondary-foreground/60"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "scale-110")} />
              <span className={cn(
                "text-[10px] mt-1 font-medium",
                isActive && "font-semibold text-primary"
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

export default AdminBottomNavigation;
