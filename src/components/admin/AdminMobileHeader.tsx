import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Home, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

const AdminMobileHeader = () => {
  const location = useLocation();
  const { user } = useAuth();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === "/admin") return "Dashboard";
    if (path === "/admin/pos") return "Point of Sale";
    if (path === "/admin/products") return "Products";
    if (path === "/admin/orders") return "Orders";
    if (path === "/admin/inventory") return "Inventory";
    if (path === "/admin/categories") return "Categories";
    if (path === "/admin/customers") return "Customers";
    if (path === "/admin/chat") return "Chat";
    if (path === "/admin/settings") return "Settings";
    if (path === "/admin/more") return "More";
    return "Admin";
  };

  return (
    <header className="lg:hidden sticky top-0 z-50 bg-secondary/95 backdrop-blur supports-[backdrop-filter]:bg-secondary/80">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Logo */}
        <Link to="/admin" className="flex items-center gap-2">
          <img src="/logo.png" alt="Co Print Technologies" className="h-8 w-auto object-contain brightness-0 invert" />
          <p className="text-[10px] text-secondary-foreground/60 font-medium">Admin</p>
        </Link>

        {/* Page Title - Center */}
        <h2 className="font-semibold text-secondary-foreground absolute left-1/2 -translate-x-1/2">
          {getPageTitle()}
        </h2>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-secondary-foreground/70 hover:text-secondary-foreground hover:bg-secondary-foreground/10" asChild>
            <Link to="/">
              <Home className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 text-secondary-foreground/70 hover:text-secondary-foreground hover:bg-secondary-foreground/10">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default AdminMobileHeader;
