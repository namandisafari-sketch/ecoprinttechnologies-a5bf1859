import { useState, useCallback } from "react";
import Header from "@/components/layout/Header";
import MobileHeader from "@/components/layout/MobileHeader";
import Footer from "@/components/layout/Footer";
import BottomNavigation from "@/components/layout/BottomNavigation";
import HeroCarousel from "@/components/home/HeroCarousel";
import CategorySection from "@/components/home/CategorySection";
import DealBanners from "@/components/home/DealBanners";
import FlashSales from "@/components/home/FlashSales";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import PromoSection from "@/components/home/PromoSection";
import BrandsSection from "@/components/home/BrandsSection";
import RecentlyViewed from "@/components/home/RecentlyViewed";
import NewsletterSection from "@/components/home/NewsletterSection";
import StoreMapSection from "@/components/home/StoreMapSection";
import CartDrawer, { CartItem } from "@/components/cart/CartDrawer";
import ChatWidget from "@/components/chat/ChatWidget";
import WelcomeToast from "@/components/WelcomeToast";
import KabejjaAdCard from "@/components/KabejjaAdCard";
import { Product } from "@/components/home/ProductCard";
import { useToast } from "@/hooks/use-toast";
import { useNotificationPermission } from "@/hooks/useNotificationPermission";

const Index = () => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { toast } = useToast();
  useNotificationPermission();

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
      {/* Desktop header */}
      <div className="hidden md:block">
        <Header cartCount={cartCount} onCartClick={() => setIsCartOpen(true)} />
      </div>
      
      {/* Mobile header */}
      <div className="md:hidden">
        <MobileHeader />
      </div>
      
      {/* Main content */}
      <main className="flex-1 pb-20 md:pb-0">
        <HeroCarousel />
        <div className="max-w-7xl mx-auto">
          <CategorySection />
          <DealBanners />
          <FlashSales onAddToCart={handleAddToCart} />
          <FeaturedProducts onAddToCart={handleAddToCart} />
          <PromoSection />
          <BrandsSection />
          <RecentlyViewed />
          <KabejjaAdCard />
          <NewsletterSection />
          <StoreMapSection />
        </div>
      </main>

      {/* Desktop footer */}
      <div className="hidden md:block">
        <Footer />
      </div>

      {/* Mobile bottom nav */}
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
