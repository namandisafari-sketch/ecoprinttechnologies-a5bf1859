import ProductCard, { Product } from "./ProductCard";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2 } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo } from "react";
import { Link } from "react-router-dom";

interface FeaturedProductsProps {
  onAddToCart: (product: Product) => void;
}

const FeaturedProducts = ({ onAddToCart }: FeaturedProductsProps) => {
  const { data: products, isLoading } = useProducts({ featured: true, limit: 8 });

  // Transform database products to match ProductCard interface
  const displayProducts = useMemo(() => {
    if (!products) return [];
    return products.map((p) => ({
      id: parseInt(p.id.slice(0, 8), 16), // Convert UUID to number for cart
      name: p.name,
      brand: p.brands?.name || "Unknown",
      price: Number(p.price),
      originalPrice: p.original_price ? Number(p.original_price) : undefined,
      image: p.image_url || "/placeholder.svg",
      category: p.categories?.name || "Uncategorized",
      inStock: (p.stock_quantity || 0) > 0,
      isNew: p.is_new || false,
      isSale: p.is_on_sale || false,
    }));
  }, [products]);

  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
              Featured Products
            </h2>
            <p className="text-muted-foreground">
              Top picks from our collection
            </p>
          </div>
          <Link to="/search">
            <Button variant="outlinePrimary">
              View All Products
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : displayProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {displayProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No featured products available</p>
            <Link to="/search" className="text-primary hover:underline mt-2 inline-block">
              Browse all products
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default FeaturedProducts;
