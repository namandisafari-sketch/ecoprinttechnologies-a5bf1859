import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Briefcase,
  MessageSquare,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/seller", icon: LayoutDashboard },
  { label: "My Services", href: "/seller/services", icon: Briefcase },
  { label: "Requests", href: "/seller/requests", icon: MessageSquare },
  { label: "Profile", href: "/seller/profile", icon: User },
  { label: "Settings", href: "/seller/settings", icon: Settings },
];

const SellerSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-primary border-b border-primary-foreground/10 px-4 py-3 safe-area-top">
        <div className="flex items-center justify-between">
          <Link to="/seller" className="flex items-center gap-2">
            <img src="/logo.png" alt="Eco Print Technologies" className="w-8 h-8 rounded-lg object-contain" />
            <span className="font-bold text-primary-foreground">Seller Portal</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-primary transform transition-transform duration-200 lg:transform-none",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo - Desktop */}
          <div className="hidden lg:flex items-center gap-3 px-6 py-5 border-b border-primary-foreground/10">
             <img src="/logo.png" alt="Eco Print Technologies" className="w-10 h-10 rounded-lg object-contain" />
            <div>
              <h2 className="font-bold text-primary-foreground">Eco Print</h2>
              <p className="text-xs text-primary-foreground/60">Seller Portal</p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto mt-14 lg:mt-0">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== "/seller" && location.pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary-foreground text-primary shadow-lg"
                      : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-primary-foreground/10">
            <div className="flex items-center gap-3 px-4 py-2 mb-2">
              <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                <span className="text-primary-foreground font-medium">
                  {user?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary-foreground truncate">
                  {user?.email}
                </p>
                <p className="text-xs text-primary-foreground/60">Seller Account</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                asChild
              >
                <Link to="/">
                  <Home className="h-4 w-4 mr-2" />
                  Store
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-primary-foreground/70 hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default SellerSidebar;
