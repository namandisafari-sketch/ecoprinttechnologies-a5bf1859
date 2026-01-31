import ProductCard, { Product } from "./ProductCard";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface FeaturedProductsProps {
  onAddToCart: (product: Product) => void;
}

const products: Product[] = [
  {
    id: 1,
    name: "iPhone 14 Pro Max OLED Screen",
    brand: "Apple",
    price: 450000,
    originalPrice: 550000,
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop",
    category: "Phone Screens",
    inStock: true,
    isSale: true,
  },
  {
    id: 2,
    name: "Samsung Galaxy S23 Ultra Display",
    brand: "Samsung",
    price: 380000,
    image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400&h=400&fit=crop",
    category: "Phone Screens",
    inStock: true,
    isNew: true,
  },
  {
    id: 3,
    name: "Original iPhone Battery Pack",
    brand: "Apple",
    price: 85000,
    originalPrice: 120000,
    image: "https://images.unsplash.com/photo-1609592707129-e0c9ed8c2ba7?w=400&h=400&fit=crop",
    category: "Batteries",
    inStock: true,
    isSale: true,
  },
  {
    id: 4,
    name: "65W Fast Charger with Cable",
    brand: "Universal",
    price: 45000,
    image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop",
    category: "Chargers",
    inStock: true,
    isNew: true,
  },
  {
    id: 5,
    name: "Xiaomi Redmi Note 12 LCD",
    brand: "Xiaomi",
    price: 120000,
    originalPrice: 150000,
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=400&fit=crop",
    category: "Phone Screens",
    inStock: true,
    isSale: true,
  },
  {
    id: 6,
    name: "Samsung Galaxy Battery",
    brand: "Samsung",
    price: 75000,
    image: "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=400&h=400&fit=crop",
    category: "Batteries",
    inStock: false,
  },
  {
    id: 7,
    name: "Phone Repair Tool Kit Pro",
    brand: "Sir Wanda",
    price: 65000,
    image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&h=400&fit=crop",
    category: "Spare Parts",
    inStock: true,
    isNew: true,
  },
  {
    id: 8,
    name: "Premium Tempered Glass Screen",
    brand: "Universal",
    price: 25000,
    originalPrice: 35000,
    image: "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&h=400&fit=crop",
    category: "Accessories",
    inStock: true,
    isSale: true,
  },
];

const FeaturedProducts = ({ onAddToCart }: FeaturedProductsProps) => {
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
          <Button variant="outlinePrimary">
            View All Products
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
