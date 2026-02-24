import { useEffect, useState, useMemo } from "react";
import { Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Product } from "./ProductCard";

interface RecentProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  brand: string;
  viewedAt: number;
}

const STORAGE_KEY = "recently_viewed_products";
const MAX_ITEMS = 10;

// Export helper to track views from product detail page
export const trackProductView = (product: {
  id: string;
  slug: string;
  name: string;
  price: number;
  image_url?: string | null;
  brands?: { name: string } | null;
}) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const items: RecentProduct[] = stored ? JSON.parse(stored) : [];
    const filtered = items.filter((p) => p.id !== product.id);
    filtered.unshift({
      id: product.id,
      slug: product.slug,
      name: product.name,
      price: Number(product.price),
      image: product.image_url || "/placeholder.svg",
      brand: product.brands?.name || "Unknown",
      viewedAt: Date.now(),
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)));
  } catch {
    // ignore storage errors
  }
};

const RecentlyViewed = () => {
  const [items, setItems] = useState<RecentProduct[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  if (items.length === 0) return null;

  return (
    <section className="py-6 md:py-10 px-4">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
          <h2 className="text-base md:text-xl lg:text-2xl font-bold text-foreground">
            Recently Viewed
          </h2>
        </div>
      </div>

      <div className="flex md:grid md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 overflow-x-auto md:overflow-visible pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        {items.map((item) => (
          <Link
            key={item.id}
            to={`/product/${item.slug}`}
            className="flex-shrink-0 w-[130px] md:w-auto group"
          >
            <div className="bg-card rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="aspect-square bg-muted overflow-hidden">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-2.5 md:p-3">
                <p className="text-[10px] md:text-xs text-muted-foreground uppercase">
                  {item.brand}
                </p>
                <h3 className="text-xs md:text-sm font-medium text-foreground line-clamp-2 mt-0.5 min-h-[2rem]">
                  {item.name}
                </h3>
                <p className="text-sm md:text-base font-bold text-primary mt-1">
                  UGX {item.price.toLocaleString()}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default RecentlyViewed;
