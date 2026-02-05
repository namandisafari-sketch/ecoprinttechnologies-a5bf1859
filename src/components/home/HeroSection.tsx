import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Truck, Wrench } from "lucide-react";
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
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/95 via-secondary/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 py-16 md:py-24 lg:py-32">
        <div className="max-w-2xl animate-fade-in">
          <span className="inline-block px-4 py-1.5 bg-primary/20 text-primary rounded-full text-sm font-medium mb-4">
            Suncity Mall's Premier Laptop Hub
          </span>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-secondary-foreground mb-4 leading-tight">
            Find Your Dream 
            <span className="text-primary"> Laptop</span> Today
          </h1>
          
          <p className="text-lg text-secondary-foreground/80 mb-8 max-w-lg">
            Affordable laptops from top brands, expert technicians for repairs, 
            and unbeatable prices at Suncity Mall. Delivery across Kampala and nationwide.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Button variant="hero" size="xl">
              Browse Laptops
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="heroDark" size="xl">
              Repair Services
            </Button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-4 max-w-lg">
            <div className="flex items-center gap-2 text-secondary-foreground/80">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-medium">Warranty Included</span>
            </div>
            <div className="flex items-center gap-2 text-secondary-foreground/80">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-medium">Free Delivery</span>
            </div>
            <div className="flex items-center gap-2 text-secondary-foreground/80">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Wrench className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-medium">Expert Repairs</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
