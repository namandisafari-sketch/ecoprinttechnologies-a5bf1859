import { useState, useCallback } from "react";
import Header from "@/components/layout/Header";
import MobileHeader from "@/components/layout/MobileHeader";
import Footer from "@/components/layout/Footer";
import MobileFooter from "@/components/layout/MobileFooter";
import BottomNavigation from "@/components/layout/BottomNavigation";
import HeroSection from "@/components/home/HeroSection";
import CategorySection from "@/components/home/CategorySection";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import BrandsSection from "@/components/home/BrandsSection";
import PromoSection from "@/components/home/PromoSection";
import CartDrawer, { CartItem } from "@/components/cart/CartDrawer";
import ChatWidget from "@/components/chat/ChatWidget";
import WelcomeToast from "@/components/WelcomeToast";
import { Product } from "@/components/home/ProductCard";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { toast } = useToast();

  const handleAddToCart = useCallback((product: Product) => {
    setCartItems((prev) => {
      const existingItem = prev.find((item) => item.id === product.id);
      
      if (existingItem) {
        toast({
          title: "Updated cart",
          description: `Added another ${product.name} to your cart`,
        });
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      toast({
        title: "Added to cart",
        description: `${product.name} has been added to your cart`,
      });
      return [...prev, { ...product, quantity: 1 }];
    });
  }, [toast]);

  const handleUpdateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity < 1) {
      setCartItems((prev) => prev.filter((item) => item.id !== productId));
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  }, []);

  const handleRemoveItem = useCallback((productId: number) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
    toast({
      title: "Removed from cart",
      description: "Item has been removed from your cart",
    });
  }, [toast]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Desktop header - hidden on mobile */}
      <div className="hidden md:block">
        <Header cartCount={cartCount} onCartClick={() => setIsCartOpen(true)} />
      </div>
      
      {/* Mobile header - shown only on mobile */}
      <div className="md:hidden">
        <MobileHeader />
      </div>
      
      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-0">
        <HeroSection />
        <div className="max-w-7xl mx-auto">
          <CategorySection />
          <FeaturedProducts onAddToCart={handleAddToCart} />
          <PromoSection />
          <BrandsSection />
        </div>
      </main>

      {/* Desktop footer - hidden on mobile */}
      <div className="hidden md:block">
        <Footer />
      </div>

      {/* Mobile footer - shown only on mobile */}
      <div className="md:hidden">
        <MobileFooter />
      </div>

      {/* Mobile bottom nav - only on mobile */}
      <div className="md:hidden">
        <BottomNavigation 
          cartCount={cartCount} 
          onCartClick={() => setIsCartOpen(true)} 
        />
      </div>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />

      <ChatWidget />
      <WelcomeToast />
    </div>
  );
};

export default Index;
