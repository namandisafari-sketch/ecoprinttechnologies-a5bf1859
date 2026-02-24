import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tags,
  Users,
  Boxes,
  MessageCircle,
  LogOut,
  Receipt,
  Settings,
  Bell,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "POS", href: "/admin/pos", icon: Receipt },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
  { label: "Inventory", href: "/admin/inventory", icon: Boxes },
  { label: "Categories", href: "/admin/categories", icon: Tags },
  { label: "Customers", href: "/admin/customers", icon: Users },
  { label: "Notifications", href: "/admin/notifications", icon: Bell },
  { label: "Newsletter", href: "/admin/newsletter", icon: Mail },
  { label: "Chat", href: "/admin/chat", icon: MessageCircle },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

interface AdminMobileSidebarProps {
  onNavigate: () => void;
}

const AdminMobileSidebar = ({ onNavigate }: AdminMobileSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-secondary-foreground/10">
        <img src="/logo.png" alt="Eco Print Technologies" className="h-10 w-auto object-contain brightness-0 invert" />
        <p className="text-xs text-secondary-foreground/60 font-medium whitespace-nowrap">Admin Portal</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href ||
            (item.href !== "/admin" && location.pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "text-secondary-foreground/70 hover:text-secondary-foreground hover:bg-secondary-foreground/10"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className="p-4 border-t border-secondary-foreground/10">
        <div className="flex items-center gap-3 px-4 py-2 mb-2">
          <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
            <span className="text-primary font-medium">
              {user?.email?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-secondary-foreground truncate">
              {user?.email}
            </p>
            <p className="text-xs text-secondary-foreground/60">Administrator</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSignOut}
          className="w-full text-secondary-foreground/70 hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default AdminMobileSidebar;
