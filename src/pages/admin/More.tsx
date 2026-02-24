import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Boxes,
  Tags,
  Users,
  Settings,
  LogOut,
  Home,
  ChevronRight,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";


const moreItems = [
  { label: "Inventory", href: "/admin/inventory", icon: Boxes, description: "Track stock levels & low-stock alerts" },
  { label: "Categories", href: "/admin/categories", icon: Tags, description: "Manage product categories" },
  { label: "Customers", href: "/admin/customers", icon: Users, description: "View & manage customers" },
  { label: "Newsletter", href: "/admin/newsletter", icon: Mail, description: "Manage newsletter subscribers" },
  { label: "Settings", href: "/admin/settings", icon: Settings, description: "App configuration & preferences" },
];

const AdminMore = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">More</h1>
        <p className="text-muted-foreground">Additional admin features</p>
      </div>

      {/* User Card */}
      <Card className="bg-secondary">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
              <span className="text-primary font-bold text-lg">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-secondary-foreground truncate">
                {user?.email}
              </p>
              <p className="text-sm text-secondary-foreground/60">Administrator</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu Items */}
      <div className="space-y-2">
        {moreItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/50 transition-colors"
          >
            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
              <item.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{item.label}</p>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </Link>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          variant="outline"
          className="flex-1"
          asChild
        >
          <Link to="/">
            <Home className="h-4 w-4 mr-2" />
            Go to Store
          </Link>
        </Button>
        <Button
          variant="destructive"
          className="flex-1"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default AdminMore;
