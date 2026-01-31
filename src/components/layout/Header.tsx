import { useState } from "react";
import { Search, ShoppingCart, Menu, X, Phone, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
}

const Header = ({ cartCount, onCartClick }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    "Phone Screens",
    "Batteries",
    "Chargers",
    "Cases",
    "Spare Parts",
    "Accessories",
  ];

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      {/* Top bar */}
      <div className="bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-4 py-2 flex flex-wrap justify-between items-center text-sm">
          <div className="flex items-center gap-4">
            <a href="tel:+256700000000" className="flex items-center gap-1 hover:text-primary transition-colors">
              <Phone className="h-3 w-3" />
              <span>+256 700 000 000</span>
            </a>
            <span className="hidden sm:flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>Kampala, Uganda</span>
            </span>
          </div>
          <div className="text-xs sm:text-sm">
            Free delivery on orders over UGX 100,000
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">SW</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-lg leading-tight text-foreground">Sir Wanda</h1>
              <p className="text-xs text-muted-foreground">Phone Care</p>
            </div>
          </a>

          {/* Search bar */}
          <div className="hidden md:flex flex-1 max-w-xl mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for phone screens, batteries, parts..."
                className="pl-10 pr-4 h-11 w-full border-2 border-muted focus:border-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={onCartClick}
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary text-primary-foreground">
                  {cartCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Mobile search */}
        <div className="md:hidden mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-10 pr-4 h-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className={`border-t border-border ${isMenuOpen ? 'block' : 'hidden'} md:block`}>
        <div className="container mx-auto px-4">
          <ul className="flex flex-col md:flex-row md:items-center gap-1 md:gap-0 py-2 md:py-0">
            {categories.map((category) => (
              <li key={category}>
                <a
                  href={`#${category.toLowerCase().replace(' ', '-')}`}
                  className="block px-4 py-2 text-sm font-medium text-foreground hover:text-primary hover:bg-muted rounded-md md:rounded-none transition-colors"
                >
                  {category}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
};

export default Header;
