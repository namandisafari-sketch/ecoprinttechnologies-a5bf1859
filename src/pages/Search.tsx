import { useState, useMemo } from "react";
import { Search as SearchIcon, Filter, X, ChevronLeft } from "lucide-react";
import MobileHeader from "@/components/layout/MobileHeader";
import MobileFooter from "@/components/layout/MobileFooter";
import BottomNavigation from "@/components/layout/BottomNavigation";
import ProductCard from "@/components/home/ProductCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts, useCategories, useBrands } from "@/hooks/useProducts";
import { useSearchParams, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import CartDrawer, { CartItem } from "@/components/cart/CartDrawer";
import { Product } from "@/components/home/ProductCard";

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get("brand") || "");
  const [showFilters, setShowFilters] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { toast } = useToast();

  const { data: products, isLoading } = useProducts({
    search: searchQuery,
    categoryId: selectedCategory || undefined,
    brandId: selectedBrand || undefined,
  });

  const { data: categories } = useCategories();
  const { data: brands } = useBrands();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedCategory) params.set("category", selectedCategory);
    if (selectedBrand) params.set("brand", selectedBrand);
    setSearchParams(params);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedBrand("");
    setSearchParams({});
  };

  const handleAddToCart = (product: Product) => {
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
  };

  const handleUpdateQuantity = (productId: number, quantity: number) => {
    if (quantity < 1) {
      setCartItems((prev) => prev.filter((item) => item.id !== productId));
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (productId: number) => {
    setCartItems((prev) => prev.filter((item) => item.id !== productId));
    toast({
      title: "Removed from cart",
      description: "Item has been removed from your cart",
    });
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const hasActiveFilters = searchQuery || selectedCategory || selectedBrand;

  // Transform database products to match ProductCard interface
  const displayProducts = useMemo(() => {
    if (!products) return [];
    return products.map((p) => ({
      id: parseInt(p.id.slice(0, 8), 16), // Convert UUID to number for cart
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
    <div className="min-h-screen flex flex-col bg-background">
      {/* Page Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
        <div className="flex items-center h-14 px-4 gap-3">
          <Link to="/" className="p-1">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search laptops..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-muted border-0"
              />
            </div>
          </form>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className="relative"
          >
            <Filter className="h-5 w-5" />
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full" />
            )}
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="px-4 pb-4 pt-2 space-y-3 animate-fade-in border-t border-border">
            <div className="flex gap-2">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Categories</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Brand" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Brands</SelectItem>
                  {brands?.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <Button
                type="button"
                variant="ghost"
                onClick={clearFilters}
                className="w-full text-muted-foreground"
                size="sm"
              >
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            )}
          </div>
        )}

        {/* Active Filters Pills */}
        {hasActiveFilters && !showFilters && (
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
            {searchQuery && (
              <Badge variant="secondary" className="gap-1 shrink-0">
                {searchQuery}
                <button onClick={() => setSearchQuery("")}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedCategory && (
              <Badge variant="secondary" className="gap-1 shrink-0">
                {categories?.find((c) => c.id === selectedCategory)?.name}
                <button onClick={() => setSelectedCategory("")}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {selectedBrand && (
              <Badge variant="secondary" className="gap-1 shrink-0">
                {brands?.find((b) => b.id === selectedBrand)?.name}
                <button onClick={() => setSelectedBrand("")}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </header>

      <main className="flex-1 pb-20">
        <div className="px-4 py-4">
          {/* Results */}
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-square rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : displayProducts.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                {displayProducts.length} product{displayProducts.length !== 1 ? "s" : ""} found
              </p>
              <div className="grid grid-cols-2 gap-3">
                {displayProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={handleAddToCart}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <SearchIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-lg font-semibold text-foreground mb-2">
                No products found
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Try adjusting your search or filters
              </p>
              <Button onClick={clearFilters} variant="outline" size="sm">
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </main>

      <BottomNavigation cartCount={cartCount} onCartClick={() => setIsCartOpen(true)} />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />
    </div>
  );
};

export default Search;
