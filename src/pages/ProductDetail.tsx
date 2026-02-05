import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, ShoppingCart, Heart, Share2, Minus, Plus, Phone, MessageCircle, Truck, Shield, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/layout/BottomNavigation";
import ImageGallery from "@/components/product/ImageGallery";
import ProductCard, { Product } from "@/components/home/ProductCard";
import CartDrawer from "@/components/cart/CartDrawer";
import ChatWidget from "@/components/chat/ChatWidget";
import { useProduct, useRelatedProducts } from "@/hooks/useProduct";

interface CartItem extends Product {
  quantity: number;
}

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const { data: product, isLoading } = useProduct(slug || "");
  const { data: relatedProducts } = useRelatedProducts(
    product?.category_id || null,
    product?.id || "",
    4
  );

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = (productToAdd?: Product) => {
    const itemToAdd = productToAdd || {
      id: parseInt(product!.id.slice(0, 8), 16),
      name: product!.name,
      brand: product!.brands?.name || "Unknown",
      price: Number(product!.price),
      originalPrice: product!.original_price ? Number(product!.original_price) : undefined,
      image: product!.image_url || "/placeholder.svg",
      category: product!.categories?.name || "Uncategorized",
      inStock: (product!.stock_quantity || 0) > 0,
      isNew: product!.is_new || false,
      isSale: product!.is_on_sale || false,
    };

    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === itemToAdd.id);
      if (existing) {
        return prev.map((item) =>
          item.id === itemToAdd.id
            ? { ...item, quantity: item.quantity + (productToAdd ? 1 : quantity) }
            : item
        );
      }
      return [...prev, { ...itemToAdd, quantity: productToAdd ? 1 : quantity }];
    });

    toast({
      title: "Added to cart",
      description: `${productToAdd?.name || product?.name} has been added to your cart.`,
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (id: number, newQuantity: number) => {
    if (newQuantity < 1) {
      setCartItems((prev) => prev.filter((item) => item.id !== id));
    } else {
      setCartItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, quantity: newQuantity } : item
        )
      );
    }
  };

  const handleRemoveItem = (id: number) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Build images array
  const productImages = product
    ? [product.image_url, ...(product.images || [])].filter(Boolean) as string[]
    : [];

  const discount = product?.original_price
    ? Math.round(((Number(product.original_price) - Number(product.price)) / Number(product.original_price)) * 100)
    : 0;

  const inStock = (product?.stock_quantity || 0) > 0;

  // Transform related products for ProductCard
  const relatedDisplayProducts = relatedProducts?.map((p) => ({
    id: parseInt(p.id.slice(0, 8), 16),
    name: p.name,
    brand: p.brands?.name || "Unknown",
    price: Number(p.price),
    originalPrice: p.original_price ? Number(p.original_price) : undefined,
    image: p.image_url || "/placeholder.svg",
    category: p.categories?.name || "Uncategorized",
    inStock: (p.stock_quantity || 0) > 0,
    isNew: p.is_new || false,
    isSale: p.is_on_sale || false,
    slug: p.slug,
  })) || [];

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur h-14 flex items-center px-4 border-b border-border">
          <Link to="/search" className="p-1"><ChevronLeft className="h-5 w-5" /></Link>
          <span className="ml-3 font-medium">Loading...</span>
        </header>
        <main className="px-4 py-4 pb-20">
          <Skeleton className="aspect-square rounded-xl mb-4" />
          <Skeleton className="h-6 w-24 mb-2" />
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-6 w-1/3 mb-4" />
          <Skeleton className="h-20 w-full" />
        </main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur h-14 flex items-center px-4 border-b border-border">
          <Link to="/search" className="p-1"><ChevronLeft className="h-5 w-5" /></Link>
          <span className="ml-3 font-medium">Not Found</span>
        </header>
        <main className="px-4 py-16 text-center pb-20">
          <h1 className="text-xl font-bold mb-2">Product Not Found</h1>
          <p className="text-sm text-muted-foreground mb-4">This product doesn't exist.</p>
          <Link to="/search">
            <Button size="sm">Browse Products</Button>
          </Link>
        </main>
        <BottomNavigation cartCount={0} onCartClick={() => {}} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
        <div className="flex items-center justify-between h-14 px-4">
          <Link to="/search" className="p-1">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <span className="font-medium text-sm truncate max-w-[200px]">{product.name}</span>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Heart className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="pb-32">
        {/* Image Gallery */}
        <div className="px-4 pt-4">
          <ImageGallery images={productImages} productName={product.name} />
        </div>

        {/* Product Info */}
        <div className="px-4 py-4 space-y-4">
          {/* Brand & Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {product.brands?.name && (
              <Badge variant="secondary" className="text-xs">
                {product.brands.name}
              </Badge>
            )}
            {product.is_new && (
              <Badge className="bg-secondary text-secondary-foreground text-xs">New</Badge>
            )}
            {product.is_on_sale && discount > 0 && (
              <Badge className="bg-primary text-primary-foreground text-xs">-{discount}%</Badge>
            )}
          </div>

          {/* Title */}
          <h1 className="text-xl font-bold text-foreground">
            {product.name}
          </h1>

          {/* Model & Color */}
          {(product.model || product.color) && (
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              {product.model && <span>Model: <strong className="text-foreground">{product.model}</strong></span>}
              {product.color && <span>Color: <strong className="text-foreground">{product.color}</strong></span>}
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-primary">
              {formatPrice(Number(product.price))}
            </span>
            {product.original_price && (
              <span className="text-sm text-muted-foreground line-through">
                {formatPrice(Number(product.original_price))}
              </span>
            )}
          </div>

          {/* Stock Status */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${inStock ? 'bg-green-500' : 'bg-destructive'}`} />
            <span className={`text-sm ${inStock ? 'text-green-600' : 'text-destructive'}`}>
              {inStock ? `In Stock (${product.stock_quantity})` : 'Out of Stock'}
            </span>
          </div>

          <Separator />

          {/* Description */}
          {product.description && (
            <div>
              <h3 className="font-semibold text-sm mb-2">Description</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {product.description}
              </p>
            </div>
          )}

          <Separator />

          {/* Features */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center text-center p-3 bg-muted rounded-lg">
              <Truck className="h-5 w-5 text-primary mb-1" />
              <p className="text-xs font-medium">Fast Delivery</p>
            </div>
            <div className="flex flex-col items-center text-center p-3 bg-muted rounded-lg">
              <Shield className="h-5 w-5 text-primary mb-1" />
              <p className="text-xs font-medium">Warranty</p>
            </div>
            <div className="flex flex-col items-center text-center p-3 bg-muted rounded-lg">
              <RotateCcw className="h-5 w-5 text-primary mb-1" />
              <p className="text-xs font-medium">Returns</p>
            </div>
          </div>

          {/* Contact */}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-10 text-sm" asChild>
              <a href="tel:0705154828">
                <Phone className="h-4 w-4 mr-2" />
                Call
              </a>
            </Button>
            <Button variant="outline" className="flex-1 h-10 text-sm" asChild>
              <a href="https://wa.me/256705154828" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
              </a>
            </Button>
          </div>
        </div>

        {/* Related Products */}
        {relatedDisplayProducts.length > 0 && (
          <section className="px-4 py-4">
            <h2 className="text-lg font-bold mb-4">Related Products</h2>
            <div className="grid grid-cols-2 gap-3">
              {relatedDisplayProducts.map((relatedProduct) => (
                <ProductCard
                  key={relatedProduct.id}
                  product={relatedProduct}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-16 left-0 right-0 bg-background border-t border-border p-3 safe-area-bottom z-40">
        <div className="flex items-center gap-3">
          {/* Quantity */}
          <div className="flex items-center border rounded-lg">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={!inStock}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center font-medium text-sm">{quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={() => setQuantity(Math.min(product.stock_quantity || 1, quantity + 1))}
              disabled={!inStock}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Add to Cart */}
          <Button
            className="flex-1 h-10"
            onClick={() => handleAddToCart()}
            disabled={!inStock}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      </div>

      <BottomNavigation cartCount={cartCount} onCartClick={() => setIsCartOpen(true)} />
      
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
      />

      <ChatWidget />
    </div>
  );
};

export default ProductDetail;
