import ProductCard, { Product } from "./ProductCard";
import { ArrowRight } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import { Link } from "react-router-dom";

interface FeaturedProductsProps {
  onAddToCart: (product: Product) => void;
}

const FeaturedProducts = ({ onAddToCart }: FeaturedProductsProps) => {
  const { data: products, isLoading } = useProducts({ featured: true, limit: 8 });

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
      isSale: p.is_on_sale || false,
      slug: p.slug,
    }));
  }, [products]);

  return (
    <section className="py-6 md:py-10 px-4">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-base md:text-xl lg:text-2xl font-bold text-foreground">
          Featured Laptops
        </h2>
        <Link to="/search" className="text-xs md:text-sm text-primary font-medium flex items-center gap-1 hover:underline">
          View All
          <ArrowRight className="h-3 w-3 md:h-4 md:w-4" />
        </Link>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 lg:gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-square rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : displayProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5 lg:gap-6">
          {displayProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8 md:py-16">
          <p className="text-sm md:text-base text-muted-foreground">No featured laptops</p>
          <Link to="/search" className="text-xs md:text-sm text-primary hover:underline mt-1 inline-block">
            Browse all
          </Link>
        </div>
      )}
    </section>
  );
};

export default FeaturedProducts;
