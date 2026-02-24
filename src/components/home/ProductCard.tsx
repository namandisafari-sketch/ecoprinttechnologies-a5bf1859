import { ShoppingCart, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

export interface Product {
  id: number;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  inStock: boolean;
  isNew?: boolean;
  isSale?: boolean;
  slug?: string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

const ProductCard = ({ product, onAddToCart }: ProductCardProps) => {
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="card-product bg-card group">
      {/* Image container */}
      <Link to={product.slug ? `/product/${product.slug}` : "#"} className="block relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 md:top-3 md:left-3 flex flex-col gap-1.5 md:gap-2">
          {product.isNew && (
            <Badge className="bg-secondary text-secondary-foreground text-[10px] md:text-xs">New</Badge>
          )}
          {product.isSale && discount > 0 && (
            <Badge className="bg-primary text-primary-foreground text-[10px] md:text-xs">-{discount}%</Badge>
          )}
        </div>

        {/* Wishlist button */}
        <button 
          className="absolute top-2 right-2 md:top-3 md:right-3 p-1.5 md:p-2 bg-background/80 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-primary hover:text-primary-foreground"
          onClick={(e) => e.preventDefault()}
        >
          <Heart className="h-3.5 w-3.5 md:h-4 md:w-4" />
        </button>

        {/* Quick add overlay - hidden on mobile, visible on hover for desktop */}
        <div className="absolute bottom-0 left-0 right-0 p-2 md:p-3 bg-gradient-to-t from-secondary/90 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300 hidden md:block">
          <Button
            variant="cart"
            className="w-full"
            onClick={(e) => {
              e.preventDefault();
              onAddToCart(product);
            }}
            disabled={!product.inStock}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {product.inStock ? "Add to Cart" : "Out of Stock"}
          </Button>
        </div>
      </Link>

      {/* Product info */}
      <Link to={product.slug ? `/product/${product.slug}` : "#"} className="block p-3 md:p-4">
        <span className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wider">
          {product.brand}
        </span>
        <h3 className="font-medium text-foreground mt-1 text-sm md:text-base line-clamp-2 min-h-[2rem] md:min-h-[2.5rem] hover:text-primary transition-colors">
          {product.name}
        </h3>
        
        <div className="flex items-center gap-1.5 md:gap-2 mt-2 md:mt-3">
          <span className="text-sm md:text-lg font-bold text-primary">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-[10px] md:text-sm text-muted-foreground line-through">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Mobile add to cart button */}
        <Button
          variant="cart"
          size="sm"
          className="w-full mt-2 md:hidden h-8 text-xs"
          onClick={(e) => {
            e.preventDefault();
            onAddToCart(product);
          }}
          disabled={!product.inStock}
        >
          <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
          {product.inStock ? "Add to Cart" : "Out of Stock"}
        </Button>

        {!product.inStock && (
          <span className="inline-block mt-2 text-xs text-destructive font-medium">
            Out of Stock
          </span>
        )}
      </Link>
    </div>
  );
};

export default ProductCard;
