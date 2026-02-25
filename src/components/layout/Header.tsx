import { useState } from "react";
import { Search, ShoppingCart, Menu, X, Phone, MapPin, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  cartCount: number;
  onCartClick: () => void;
}

const Header = ({ cartCount, onCartClick }: HeaderProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  const categories = [
    "All Laptops",
    "Gaming Laptops",
    "Business Laptops",
    "Student Laptops",
    "Refurbished",
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      {/* Top bar */}
      <div className="bg-secondary text-secondary-foreground">
        <div className="container mx-auto px-4 py-2 flex flex-wrap justify-between items-center text-sm">
          <div className="flex items-center gap-4">
            <a href="tel:+256705154828" className="flex items-center gap-1 hover:text-primary transition-colors">
              <Phone className="h-3 w-3" />
              <span>+256 705 154 828</span>
            </a>
            <span className="hidden sm:flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>Suncity Mall, Kampala</span>
            </span>
          </div>
          <div className="text-xs sm:text-sm">
            Free delivery in Kampala on orders over UGX 500,000
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img src="/logo.png" alt="Co Print Technologies" className="h-20 w-auto object-contain" />
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search laptops by brand, model, specs..."
                className="pl-10 pr-4 h-11 w-full border-2 border-muted focus:border-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>

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

            {/* Admin Dashboard Link */}
            {isAdmin && (
              <Link to="/admin">
                <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-1.5">
                  <Settings className="h-4 w-4" />
                  <span>Admin</span>
                </Button>
                <Button variant="outline" size="icon" className="sm:hidden">
                  <Settings className="h-4 w-4" />
                </Button>
              </Link>
            )}




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
        <form onSubmit={handleSearch} className="md:hidden mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search laptops..."
              className="pl-10 pr-4 h-10 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
      </div>

      {/* Navigation */}
      <nav className={`border-t border-border ${isMenuOpen ? 'block' : 'hidden'} md:block`}>
        <div className="container mx-auto px-4">
          <ul className="flex flex-col md:flex-row md:items-center gap-1 md:gap-0 py-2 md:py-0">
            {categories.map((category) => (
              <li key={category}>
                <Link
                  to={`/search?q=${encodeURIComponent(category)}`}
                  className="block px-4 py-2 text-sm font-medium text-foreground hover:text-primary hover:bg-muted rounded-md md:rounded-none transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {category}
                </Link>
              </li>
            ))}
            <li className="md:ml-auto">
              <Link
                to="/technicians"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground hover:text-primary hover:bg-muted rounded-md md:rounded-none transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Find Technicians
              </Link>
            </li>
            <li>
              <Link
                to="/track-order"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground hover:text-primary hover:bg-muted rounded-md md:rounded-none transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Track Order
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </header>
  );
};

export default Header;
