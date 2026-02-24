import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import BottomNavigation from "@/components/layout/BottomNavigation";
import CartDrawer, { CartItem } from "@/components/cart/CartDrawer";
import { useAppNotifications } from "@/hooks/useAppNotifications";
import { formatDistanceToNow } from "date-fns";

const NotificationsPage = () => {
  const { notifications, readIds, markAsRead, isLoading } = useAppNotifications();
  const [cartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const handleMarkRead = (id: string) => {
    markAsRead.mutate(id);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center h-14 px-4">
          <Link to="/profile" className="p-1"><ChevronLeft className="h-5 w-5" /></Link>
          <Bell className="ml-3 h-5 w-5 text-primary" />
          <span className="ml-2 font-semibold">Notifications</span>
        </div>
      </header>

      <main className="pb-20 px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-bold mb-2">No notifications yet</h2>
            <p className="text-sm text-muted-foreground">We'll let you know about deals & updates</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => {
              const isRead = readIds.includes(n.id);
              return (
                <div
                  key={n.id}
                  className={`p-4 rounded-xl border transition-colors ${
                    isRead ? "bg-card border-border" : "bg-primary/5 border-primary/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {n.image_url && (
                      <img src={n.image_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-foreground">{n.title}</h3>
                        {!isRead && <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{n.body}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </span>
                        {!isRead && (
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleMarkRead(n.id)}>
                            <Check className="h-3 w-3 mr-1" /> Mark read
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  {n.link && (
                    <Link to={n.link} className="block mt-2 text-xs text-primary hover:underline">
                      View details →
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
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

export default NotificationsPage;
