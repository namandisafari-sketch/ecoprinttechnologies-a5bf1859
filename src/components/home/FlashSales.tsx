import { useState, useEffect, useCallback } from "react";
import { Zap } from "lucide-react";
import ProductCard, { Product } from "./ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { useMemo } from "react";
import { Link } from "react-router-dom";

interface FlashSalesProps {
  onAddToCart: (product: Product) => void;
}

const FlashSales = ({ onAddToCart }: FlashSalesProps) => {
  const { data: products } = useProducts({ onSale: true, limit: 6 });

  // Countdown timer - resets every 6 hours
  const getTimeLeft = useCallback(() => {
    const now = new Date();
    const hours = now.getHours();
    const nextReset = new Date(now);
    const resetHours = [0, 6, 12, 18];
    const nextResetHour = resetHours.find((h) => h > hours) ?? 24;
    nextReset.setHours(nextResetHour, 0, 0, 0);
    if (nextResetHour === 24) nextReset.setDate(nextReset.getDate() + 1);
    nextReset.setHours(0, 0, 0, 0);
    const diff = nextReset.getTime() - now.getTime();
    return {
      hours: Math.floor(diff / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
    };
  }, []);

  const [timeLeft, setTimeLeft] = useState(getTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(timer);
  }, [getTimeLeft]);

  const displayProducts = useMemo(() => {
    if (!products) return [];
    return products.map((p) => ({
      id: parseInt(p.id.slice(0, 8), 16),
      name: p.name,
      brand: p.brands?.name || "Unknown",
      price: Number(p.price),
      originalPrice: p.original_price ? Number(p.original_price) : undefined,
      image: p.image_url || (p.images && p.images.length > 0 ? p.images[0] : "/placeholder.svg"),
      category: p.categories?.name || "Uncategorized",
      inStock: (p.stock_quantity || 0) > 0,
      isNew: p.is_new || false,
      isSale: true,
      slug: p.slug,
      stockQuantity: p.stock_quantity || 0,
    }));
  }, [products]);

  if (displayProducts.length === 0) return null;

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <section className="py-4 md:py-8 max-w-7xl mx-auto">
      {/* Flash sale header */}
      <div className="bg-primary mx-4 rounded-t-xl md:rounded-t-2xl px-4 py-3 md:px-6 md:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 md:h-6 md:w-6 text-primary-foreground fill-primary-foreground" />
          <h2 className="text-sm md:text-lg font-bold text-primary-foreground">Flash Sales</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] md:text-xs text-primary-foreground/80">Time Left:</span>
          <div className="flex items-center gap-1">
            <span className="bg-primary-foreground text-primary text-xs md:text-sm font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded">
              {pad(timeLeft.hours)}h
            </span>
            <span className="text-primary-foreground font-bold text-xs">:</span>
            <span className="bg-primary-foreground text-primary text-xs md:text-sm font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded">
              {pad(timeLeft.minutes)}m
            </span>
            <span className="text-primary-foreground font-bold text-xs">:</span>
            <span className="bg-primary-foreground text-primary text-xs md:text-sm font-bold px-1.5 py-0.5 md:px-2 md:py-1 rounded">
              {pad(timeLeft.seconds)}s
            </span>
          </div>
        </div>
        <Link to="/search?q=Sale" className="text-[10px] md:text-xs font-medium text-primary-foreground/80 hover:text-primary-foreground hidden sm:block">
          See All &gt;
        </Link>
      </div>

      {/* Products - horizontal scroll on mobile, grid on desktop */}
      <div className="bg-muted/50 mx-4 rounded-b-xl md:rounded-b-2xl p-3 md:p-5">
        <div className="flex md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 overflow-x-auto md:overflow-visible pb-1 md:pb-0 -mx-1 px-1 md:mx-0 md:px-0 scrollbar-hide">
          {displayProducts.map((product) => (
            <div key={product.id} className="min-w-[140px] max-w-[160px] md:min-w-0 md:max-w-none flex-shrink-0">
              <div className="card-product bg-card group rounded-lg overflow-hidden shadow-sm">
                <Link to={product.slug ? `/product/${product.slug}` : "#"} className="block relative aspect-square overflow-hidden bg-muted">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {product.originalPrice && (
                    <span className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground text-[9px] md:text-xs font-bold px-1.5 py-0.5 rounded">
                      -{Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                    </span>
                  )}
                </Link>
                <div className="p-2 md:p-3">
                  <h3 className="text-[11px] md:text-sm font-medium text-foreground line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-xs md:text-base font-bold text-primary mt-0.5">
                    UGX {product.price.toLocaleString()}
                  </p>
                  {product.originalPrice && (
                    <p className="text-[9px] md:text-xs text-muted-foreground line-through">
                      UGX {product.originalPrice.toLocaleString()}
                    </p>
                  )}
                  <div className="mt-1.5">
                    <div className="w-full bg-border rounded-full h-1 md:h-1.5">
                      <div
                        className="bg-accent h-1 md:h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(10, (product.stockQuantity / 50) * 100))}%` }}
                      />
                    </div>
                    <p className="text-[8px] md:text-[10px] text-muted-foreground mt-0.5">
                      {product.stockQuantity > 0 ? `${product.stockQuantity} left` : "Sold out"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FlashSales;
