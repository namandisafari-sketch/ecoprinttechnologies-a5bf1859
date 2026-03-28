import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { ChevronLeft, ShoppingCart, Heart, Share2, Minus, Plus, Phone, MessageCircle, Truck, Shield, RotateCcw, Star, MapPin, Printer } from "lucide-react";
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
import { useProduct, useRelatedProducts, useProductSpecifications } from "@/hooks/useProduct";
import { trackProductView } from "@/components/home/RecentlyViewed";
import { useWishlist } from "@/hooks/useWishlist";
import ProductReviews from "@/components/product/ProductReviews";
import ProductManual from "@/components/product/ProductManual";

interface CartItem extends Product {
  quantity: number;
}

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const manualRef = useRef<HTMLDivElement>(null);
  const { isWishlisted, toggleWishlist } = useWishlist();

  const { data: product, isLoading } = useProduct(slug || "");
  const { data: relatedProducts } = useRelatedProducts(
    product?.category_id || null,
    product?.id || "",
    4
  );
  const { data: productSpecs } = useProductSpecifications(product?.id || "");

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: product?.name, text: product?.description || "", url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied!" });
    }
  };

  const handlePrintManual = () => {
    if (!manualRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${product?.name} - Product Manual</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; }
          @media print {
            @page { size: A4; margin: 0; }
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>${manualRef.current.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const handleAddToCart = (productToAdd?: Product) => {
    const itemToAdd = productToAdd || {
      id: parseInt(product!.id.slice(0, 8), 16),
      name: product!.name,
      brand: product!.brands?.name || "Unknown",
      price: Number(product!.price),
      originalPrice: product!.original_price ? Number(product!.original_price) : undefined,
      image: product!.image_url || (product!.images && product!.images.length > 0 ? product!.images[0] : "/placeholder.svg"),
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

  useEffect(() => {
    if (product) {
      trackProductView(product);
    }
  }, [product]);

  const productImages = product
    ? [product.image_url, ...(product.images || [])].filter(Boolean) as string[]
    : [];

  const discount = product?.original_price
    ? Math.round(((Number(product.original_price) - Number(product.price)) / Number(product.original_price)) * 100)
    : 0;

  const inStock = (product?.stock_quantity || 0) > 0;
  const wishlisted = product ? isWishlisted(product.id) : false;

  const relatedDisplayProducts = relatedProducts?.map((p) => ({
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
          <Link to="/search"><Button size="sm">Browse Products</Button></Link>
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
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => toggleWishlist.mutate(product.id)}
            >
              <Heart className={`h-5 w-5 ${wishlisted ? "fill-destructive text-destructive" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={handleShare}>
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="pb-32 md:max-w-6xl md:mx-auto">
        {/* Desktop: two columns */}
        <div className="md:grid md:grid-cols-2 md:gap-8 md:p-6">
          {/* Image Gallery */}
          <div className="px-4 pt-4 md:px-0">
            <ImageGallery images={productImages} productName={product.name} />
          </div>

          {/* Product Info */}
          <div className="px-4 py-4 space-y-4 md:px-0">
            {/* Brand link */}
            {product.brands?.name && (
              <div className="text-sm">
                <span className="text-muted-foreground">Brand: </span>
                <Link to={`/search?q=${product.brands.name}`} className="text-primary hover:underline font-medium">
                  {product.brands.name}
                </Link>
                <span className="text-muted-foreground"> | </span>
                <Link to={`/search?q=${product.brands.name}`} className="text-primary hover:underline text-xs">
                  Similar products from {product.brands.name}
                </Link>
              </div>
            )}

            {/* Title */}
            <h1 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
              {product.name}
            </h1>

            {/* Price Section */}
            <div className="space-y-1">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl md:text-3xl font-bold text-foreground">
                  {formatPrice(Number(product.price))}
                </span>
                {product.original_price && (
                  <span className="text-base text-muted-foreground line-through">
                    {formatPrice(Number(product.original_price))}
                  </span>
                )}
                {discount > 0 && (
                  <Badge className="bg-primary text-primary-foreground text-xs">-{discount}%</Badge>
                )}
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${inStock ? "text-green-600" : "text-destructive"}`}>
                  {inStock ? "In stock" : "Out of Stock"}
                </span>
              </div>

              {/* Shipping info */}
              <p className="text-xs text-primary">
                + shipping from UGX 5,000 to Kampala
              </p>
            </div>

            {/* Model & Color & SKU */}
            {(product.model || product.color || product.sku) && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Specifications</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {product.model && (
                      <div><span className="text-muted-foreground">Model:</span> <strong>{product.model}</strong></div>
                    )}
                    {product.color && (
                      <div><span className="text-muted-foreground">Color:</span> <strong>{product.color}</strong></div>
                    )}
                    {product.sku && (
                      <div><span className="text-muted-foreground">SKU:</span> <strong>{product.sku}</strong></div>
                    )}
                    {product.categories?.name && (
                      <div><span className="text-muted-foreground">Category:</span> <strong>{product.categories.name}</strong></div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Detailed Specifications from product_specifications table */}
            {productSpecs && productSpecs.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Technical Specifications</h3>
                  <div className="border border-border rounded-lg overflow-hidden">
                    {productSpecs.map((spec, idx) => (
                      <div
                        key={spec.id}
                        className={`flex items-start text-sm ${idx % 2 === 0 ? "bg-muted/50" : "bg-background"}`}
                      >
                        <span className="w-2/5 px-3 py-2.5 font-medium text-muted-foreground border-r border-border">
                          {spec.spec_key}
                        </span>
                        <span className="w-3/5 px-3 py-2.5 text-foreground whitespace-pre-line">
                          {spec.spec_value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Brand badge */}
            {product.brands?.name && (
              <div>
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">Brand</h3>
                <Badge variant="outline" className="text-sm px-3 py-1">{product.brands.name}</Badge>
              </div>
            )}

            <Separator />

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            <Separator />

            {/* Delivery & Returns - Jumia style sidebar info */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Delivery & Returns</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Pickup Station</p>
                    <p className="text-xs text-primary">Delivery Fees UGX 5,000</p>
                    <p className="text-xs text-muted-foreground">Ready within 1-3 business days</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <Truck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Door Delivery</p>
                    <p className="text-xs text-primary">Delivery Fees UGX 8,000</p>
                    <p className="text-xs text-muted-foreground">Ready within 2-5 business days</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                  <RotateCcw className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Return Policy</p>
                    <p className="text-xs text-muted-foreground">Free return within 7 days for eligible items</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Share */}
            <div>
              <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">Share This Product</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-1" /> Share
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={`https://wa.me/?text=${encodeURIComponent(product.name + " " + window.location.href)}`} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4 mr-1" /> WhatsApp
                  </a>
                </Button>
              </div>
            </div>

            {/* Contact */}
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 h-10 text-sm" asChild>
                <a href="tel:0705154828">
                  <Phone className="h-4 w-4 mr-2" /> Call Us
                </a>
              </Button>
              <Button variant="outline" className="flex-1 h-10 text-sm" asChild>
                <a href="https://wa.me/256705154828" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Product Reviews */}
        <section className="px-4 py-4">
          <ProductReviews productId={product.id} />
        </section>

        {/* Related Products */}
        {relatedDisplayProducts.length > 0 && (
          <section className="px-4 py-4">
            <h2 className="text-lg font-bold mb-4">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
        <div className="flex items-center gap-3 max-w-6xl mx-auto">
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
