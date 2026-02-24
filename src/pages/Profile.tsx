import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Heart, Bell, Package, Settings, LogOut, User, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useDeviceContext } from "@/contexts/DeviceContext";
import BottomNavigation from "@/components/layout/BottomNavigation";
import CartDrawer, { CartItem } from "@/components/cart/CartDrawer";

const Profile = () => {
  const { user, signOut, isAdmin } = useAuth();
  const { deviceName } = useDeviceContext();
  const [cartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const displayName = user?.user_metadata?.full_name || deviceName || "Guest";
  const email = user?.email;
  const { recoveryCode } = useDeviceContext();

  const menuItems = [
    { icon: Package, label: "My Orders", path: "/track-order", description: "Track your orders" },
    { icon: Heart, label: "Wishlist", path: "/wishlist", description: "Your saved products" },
    { icon: Bell, label: "Notifications", path: "/notifications", description: "View updates & offers" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center h-14 px-4">
          <Link to="/" className="p-1"><ChevronLeft className="h-5 w-5" /></Link>
          <span className="ml-3 font-semibold">My Account</span>
        </div>
      </header>

      <main className="pb-20 px-4 py-4 space-y-4">
        {/* Profile Card */}
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                <User className="h-7 w-7" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-lg">{displayName}</h2>
                {email && <p className="text-sm text-primary-foreground/80">{email}</p>}
                {recoveryCode && (
                  <p className="text-xs text-primary-foreground/70 mt-1 font-mono tracking-widest">
                    Recovery: {recoveryCode}
                  </p>
                )}
                {!user && (
                  <Link to="/login" className="text-sm underline text-primary-foreground/90 mt-1 inline-block">
                    Sign in for full access
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu Items */}
        <div className="space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
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

          {isAdmin && (
            <Link
              to="/admin"
              className="flex items-center gap-4 p-4 bg-card rounded-xl border border-primary/30 hover:border-primary/50 transition-colors"
            >
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Settings className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-primary">Admin Panel</p>
                <p className="text-sm text-muted-foreground">Manage your store</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </Link>
          )}
        </div>

        {user && (
          <Button
            variant="outline"
            className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        )}
      </main>

      <BottomNavigation cartCount={cartItems.length} onCartClick={() => setIsCartOpen(true)} />
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={() => {}}
        onRemoveItem={() => {}}
      />
    </div>
  );
};

export default Profile;
