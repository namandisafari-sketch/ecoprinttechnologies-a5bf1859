import { useState } from "react";
import { Search, Bell, Menu, X, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AccessCodeDialog from "@/components/auth/AccessCodeDialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const MobileHeader = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();
  const { isAdmin, isSeller } = useAuth();

  const menuItems = [
    { label: "All Laptops", path: "/search?q=All Laptops" },
    { label: "Gaming Laptops", path: "/search?q=Gaming Laptops" },
    { label: "Business Laptops", path: "/search?q=Business Laptops" },
    { label: "Student Laptops", path: "/search?q=Student Laptops" },
    { label: "Refurbished", path: "/search?q=Refurbished" },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      {/* Main header */}
      <div className="flex items-center justify-between px-4 h-14">
        {/* Menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px]">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <img src="/logo.jpeg" alt="Eco Hub" className="w-8 h-8 rounded-lg object-cover" />
                <span>Eco Hub</span>
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-1">
              {menuItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.path}
                  className="px-3 py-3 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2">
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2 px-3 py-3 text-sm font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Admin Dashboard
                  </Link>
                )}
                {isSeller && !isAdmin && (
                  <Link
                    to="/seller"
                    className="flex items-center gap-2 px-3 py-3 text-sm font-medium rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Seller Dashboard
                  </Link>
                )}
                {!isAdmin && !isSeller && <AccessCodeDialog />}
              </div>
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.jpeg" alt="Eco Hub" className="w-8 h-8 rounded-lg object-cover" />
          <div>
            <h1 className="font-bold text-base leading-tight text-foreground">Eco Hub</h1>
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            {isSearchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Bell className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Expandable search */}
      {isSearchOpen && (
        <form onSubmit={handleSearch} className="px-4 pb-3 animate-fade-in">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search laptops, brands, specs..."
              className="pl-10 pr-4 h-10 w-full bg-muted border-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>
        </form>
      )}
    </header>
  );
};

export default MobileHeader;
