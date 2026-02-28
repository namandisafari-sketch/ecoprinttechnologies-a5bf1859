import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Heart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import BottomNavigation from "@/components/layout/BottomNavigation";
import CartDrawer, { CartItem } from "@/components/cart/CartDrawer";
import { useWishlistProducts, useWishlist } from "@/hooks/useWishlist";
import { useToast } from "@/hooks/use-toast";

const Wishlist = () => {
  const { data: products, isLoading } = useWishlistProducts();
  const { toggleWishlist } = useWishlist();
  const { toast } = useToast();
  const [cartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", minimumFractionDigits: 0 }).format(price);

  const handleRemove = (productId: string) => {
    toggleWishlist.mutate(productId, {
      onSuccess: () => toast({ title: "Removed from wishlist" }),
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex items-center h-14 px-4">
          <Link to="/profile" className="p-1"><ChevronLeft className="h-5 w-5" /></Link>
          <Heart className="ml-3 h-5 w-5 text-primary" />
          <span className="ml-2 font-semibold">Wishlist</span>
          {products && <span className="ml-auto text-sm text-muted-foreground">{products.length} items</span>}
        </div>
      </header>

      <main className="pb-20 px-4 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
          </div>
        ) : !products || products.length === 0 ? (
          <div className="text-center py-16">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-bold mb-2">Your wishlist is empty</h2>
            <p className="text-sm text-muted-foreground mb-4">Save products you love to buy later</p>
            <Button asChild><Link to="/search">Browse Products</Link></Button>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((product: any) => (
              <Link
                key={product.id}
                to={`/product/${product.slug}`}
                className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border hover:border-primary/30 transition-colors"
              >
                <img
                  src={product.image_url || (product.images && product.images.length > 0 ? product.images[0] : "/placeholder.svg")}
                  alt={product.name}
                  className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground text-sm truncate">{product.name}</p>
                  {product.brands?.name && (
                    <p className="text-xs text-muted-foreground">Brand: {product.brands.name}</p>
                  )}
                  <p className="font-bold text-primary mt-1">{formatPrice(Number(product.price))}</p>
                  {product.original_price && (
                    <span className="text-xs text-muted-foreground line-through ml-2">
                      {formatPrice(Number(product.original_price))}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive flex-shrink-0"
                  onClick={(e) => {
                    e.preventDefault();
                    handleRemove(product.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Link>
            ))}
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

export default Wishlist;
