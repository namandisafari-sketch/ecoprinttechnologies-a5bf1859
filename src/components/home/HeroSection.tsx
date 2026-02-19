import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Truck, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import heroBanner from "@/assets/hero-banner.jpg";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Hero Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src={heroBanner}
          alt="Laptop marketplace"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-secondary/90 via-secondary/70 to-secondary/90" />
      </div>

      {/* Content - Mobile Optimized */}
      <div className="relative px-4 py-10">
        <div className="max-w-md mx-auto text-center animate-fade-in">
          <span className="inline-block px-3 py-1 bg-accent/20 text-accent rounded-full text-xs font-medium mb-3">
            Suncity Mall, Kampala
          </span>
          
          <h1 className="text-2xl font-bold text-secondary-foreground mb-3 leading-tight">
            Co Print
            <span className="text-primary"> Technologies</span>
          </h1>
          
          <p className="text-sm text-secondary-foreground/80 mb-6">
            Top brands, expert repairs, unbeatable prices. Free delivery in Kampala.
          </p>

          <div className="flex gap-3 justify-center mb-8">
            <Button size="default" className="h-10 px-5" asChild>
              <Link to="/search">
                Browse
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="default" className="h-10 px-5 border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/10" asChild>
              <Link to="/technicians">
                Repairs
              </Link>
            </Button>
          </div>

          {/* Trust badges - Compact */}
          <div className="flex justify-center gap-4">
            <div className="flex flex-col items-center">
              <div className="p-2 bg-primary/20 rounded-full mb-1">
                <Shield className="h-4 w-4 text-primary" />
              </div>
              <span className="text-[10px] text-secondary-foreground/70">Warranty</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-2 bg-primary/20 rounded-full mb-1">
                <Truck className="h-4 w-4 text-primary" />
              </div>
              <span className="text-[10px] text-secondary-foreground/70">Delivery</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="p-2 bg-primary/20 rounded-full mb-1">
                <Wrench className="h-4 w-4 text-primary" />
              </div>
              <span className="text-[10px] text-secondary-foreground/70">Repairs</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
