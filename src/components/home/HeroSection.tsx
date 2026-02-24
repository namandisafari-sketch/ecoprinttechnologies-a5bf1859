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

      {/* Content - Responsive */}
      <div className="relative px-4 py-10 md:py-16 lg:py-24">
        <div className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto text-center md:text-left animate-fade-in">
          <span className="inline-block px-3 py-1 md:px-4 md:py-1.5 bg-accent/20 text-accent rounded-full text-xs md:text-sm font-medium mb-3 md:mb-4">
            Suncity Mall, Kampala
          </span>
          
          <h1 className="text-2xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-secondary-foreground mb-3 md:mb-4 lg:mb-6 leading-tight">
            Eco Print
            <span className="text-primary"> Technologies</span>
          </h1>
          
          <p className="text-sm md:text-base lg:text-lg text-secondary-foreground/80 mb-6 md:mb-8 max-w-lg">
            Top brands, expert repairs, unbeatable prices. Free delivery in Kampala.
          </p>

          <div className="flex gap-3 md:gap-4 justify-center md:justify-start mb-8 md:mb-10">
            <Button size="default" className="h-10 px-5 md:h-12 md:px-8 md:text-base" asChild>
              <Link to="/search">
                Browse
                <ArrowRight className="ml-1.5 h-4 w-4 md:h-5 md:w-5" />
              </Link>
            </Button>
            <Button variant="outline" size="default" className="h-10 px-5 md:h-12 md:px-8 md:text-base border-secondary-foreground/30 text-secondary-foreground hover:bg-secondary-foreground/10" asChild>
              <Link to="/technicians">
                Repairs
              </Link>
            </Button>
          </div>

          {/* Trust badges - Responsive */}
          <div className="flex justify-center md:justify-start gap-4 md:gap-8 lg:gap-12">
            <div className="flex flex-col md:flex-row items-center md:gap-3">
              <div className="p-2 md:p-3 bg-primary/20 rounded-full mb-1 md:mb-0">
                <Shield className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <div className="text-center md:text-left">
                <span className="text-[10px] md:text-sm font-medium text-secondary-foreground/90 block">Warranty</span>
                <span className="hidden md:block text-xs text-secondary-foreground/60">All products covered</span>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center md:gap-3">
              <div className="p-2 md:p-3 bg-primary/20 rounded-full mb-1 md:mb-0">
                <Truck className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <div className="text-center md:text-left">
                <span className="text-[10px] md:text-sm font-medium text-secondary-foreground/90 block">Delivery</span>
                <span className="hidden md:block text-xs text-secondary-foreground/60">Free in Kampala</span>
              </div>
            </div>
            <div className="flex flex-col md:flex-row items-center md:gap-3">
              <div className="p-2 md:p-3 bg-primary/20 rounded-full mb-1 md:mb-0">
                <Wrench className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <div className="text-center md:text-left">
                <span className="text-[10px] md:text-sm font-medium text-secondary-foreground/90 block">Repairs</span>
                <span className="hidden md:block text-xs text-secondary-foreground/60">Same-day service</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
